using System;
using Microsoft.AspNetCore.Mvc;
using BackBeacon.Services;
using BackBeacon.Models;
using System.Linq;
using Newtonsoft.Json;
using Hangfire;
using System.Diagnostics;

/**
 * BLT - Beacon Log Tracker Controller
 */
namespace BackBeacon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BltController : ControllerBase
    {
        private readonly ICookieService _cookieSvc;
        private readonly IHttpContextualizer _httpCtx;
        private readonly Marketing_TrackingContext _dbCtx;

        private readonly string TRACKING_PIXEL = @"R0lGODlhAQABAPcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAP8ALAAAAAABAAEAAAgEAP8FBAA7";
        //"R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
        //"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        private readonly string COOKIE_NAME_BEACON = "Beacon";
        //private readonly string COOKIE_NAME_UNIVERSAL_ID = "";
        private readonly string MIME_TYPE_IMG_GIF = "image/gif";
        
        public BltController(ICookieService cookieService, IHttpContextualizer httpContextualizer, Marketing_TrackingContext mtContext)
        {
            this._cookieSvc = cookieService;
            this._httpCtx = httpContextualizer;
            this._dbCtx = mtContext;
        }

        //[ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        [HttpGet("pixel")]
        public ActionResult<string> GetPixelAction(string pageToken, int campaignId, int actionId, string attributeId, string attrValue = "")
        {
            this.Stash(pageToken, campaignId, actionId, attributeId, attrValue);
     
            return File(System.Convert.FromBase64String(TRACKING_PIXEL), MIME_TYPE_IMG_GIF);
        }

        //[ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        [HttpPost("consume")]
        public ActionResult<string> PostLogAction([FromBody] string data)
        {
            try
            {
                ConsumePostData cpd = JsonConvert.DeserializeObject<ConsumePostData>(data);

                if (this.Stash(cpd.PageToken, cpd.CampaignId, cpd.ActionId, cpd.AttributeId, cpd.AttrValue))
                {
                    return "{ \"status\": \"OK\" }";
                }
                else
                {
                    return "{ \"status\": \"NOT OK\" }";
                }
            }
            catch (Exception ex)
            {
                return String.Format("{{ \"status\": \"NOT OK\", \"exception\": \"{0}\" }}", ex.Message);
            }
        }

        private bool Stash(string pageToken, int campaignId, int actionId, string attributeId, string attrValue = "")
        {
            Stopwatch stopWatch = new Stopwatch();
            stopWatch.Start();

            // BLT Timestamp
            DateTime bts = DateTime.Now;

            // Initialize Trace
            Models.Trace t = new Models.Trace
            {
                BeaconTimestamp = bts
            };

            try
            {
                // Trace Input Params
                t.SetGroup1(pageToken, campaignId, actionId, attributeId, attrValue);

                // Validation of Input Params
                if (campaignId < 1 || actionId < 1 || String.IsNullOrEmpty(attributeId) || String.IsNullOrEmpty(pageToken))
                {
                    throw BltInputParamsException("Input params invalid and/or unset");
                }

                // Lookup Up User/Beacon/Cookie
                Tuple<string, int> rbc = this.ResolveBeaconCookie();
                string beaconId = rbc.Item1;
                int universalId = rbc.Item2;
                t.BeaconId = beaconId;
                t.UniversalClientId = universalId;

                // BEACON STORAGE
                BackgroundJob.Enqueue(() => this.StoreBeaconDataset(
                    bts, universalId, campaignId, actionId, attributeId, attrValue,
                    _httpCtx.GetSessionId(), _httpCtx.GetUserAgent(), _httpCtx.GetIpAddress(),
                    new Fingerprint(_httpCtx).Generate()));
                t.setGroup2(_httpCtx);

                return true;
            }
            catch (Exception ex)
            {
                t.Error = ex.Message;
                Console.Write("BLT Stash faile; " + ex);

                return false;
            }
            finally
            {
                t.RunTime = StopAndCalcRuntime(stopWatch);
                BackgroundJob.Enqueue(() => this.PushAudit(bts.Millisecond.ToString(), t));
            }
        }


        private Tuple<string, int> ResolveBeaconCookie()
        {
            string beaconId = null;
            int universalId = -1;

            if (!_cookieSvc.IsCookieValid(COOKIE_NAME_BEACON))
            {
                // Generate new Client User Id (External ID)
                beaconId = Guid.NewGuid().ToString();

                universalId = this.GetNewUniversalIdentifier(beaconId);
                
                // Create new cookie on client
                _cookieSvc.AddReplaceCookie(COOKIE_NAME_BEACON, beaconId);
            }
            else
            {
                // Obtain existing User ID
                beaconId = _cookieSvc.GetCookieValue(COOKIE_NAME_BEACON);

                var query = _dbCtx.UniversalClient as IQueryable<UniversalClient>;
                query = query.Where(x => x.ExternalId == beaconId);
                UniversalClient[] list = query.ToArray<UniversalClient>();
                if (list.Length > 0) {
                    universalId = list.First<UniversalClient>().UniversalClientId;
                }
                else
                { 
                    universalId = this.GetNewUniversalIdentifier(beaconId);
                }
            }

            return new Tuple<string, int>(beaconId, universalId);
        }

        private int GetNewUniversalIdentifier(string beaconId)
        {
            UniversalClient uc = new UniversalClient
            {
                ExternalId = beaconId
            };
            _dbCtx.UniversalClient.Add(uc);
            _dbCtx.SaveChanges();

            int universalId = uc.UniversalClientId;
            return universalId;
        }

        public void StoreBeaconDataset(DateTime bts, int universalId, int campaignId, int actionId, string attributeId, string attrValue, string sessionId, string userAgent, string ip, string footprint)
        { 
            try {
                // Add Campaign Event
                CampaignEvent ce = new CampaignEvent
                {
                    UniversalClientId = universalId,
                    CampaignActionId = actionId,
                    WebSessionId = sessionId,
                    UserAgent = userAgent,
                    RemoteAddress = ip,
                    BrowserFootprint = footprint
                };
                _dbCtx.CampaignEvent.Add(ce);
                _dbCtx.SaveChanges();

                // Add CampaignEvent Attributes; Possible multiple provided
                string[] attributeIdArray = attributeId.Split(",");
                string[] attrValueArray = attrValue.Split(",");
                for (int i=0; i < attributeIdArray.Length;i++)
                { 
                    CampaignEventAttribute cea = new CampaignEventAttribute
                    {
                        CampaignEventId = ce.CampaignEventId,
                        CampaignActionAttributeId = int.Parse(attributeIdArray[i]),
                        AttributeValue = attrValueArray[i]
                    };
                    _dbCtx.CampaignEventAttribute.Add(cea);
                }
                _dbCtx.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.Write(ex);
            }
        }

        public void PushAudit(string marker, Models.Trace trace)
        {
            try
            {             
                Audit adt = new Audit
                {
                    Marker = marker,
                    Details = JsonConvert.SerializeObject(trace, Formatting.Indented)
                };
                _dbCtx.Audit.Add(adt);
                _dbCtx.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }


        private string StopAndCalcRuntime(Stopwatch s)
        {
            s.Stop();
            TimeSpan ts = s.Elapsed;
            string elapsedTime = String.Format("{0:00}:{1:00}:{2:00}.{3:00}",
                ts.Hours, ts.Minutes, ts.Seconds,
                ts.Milliseconds / 10);
            return "Elapsed:" + elapsedTime + " | Millis:" + ts.Milliseconds.ToString();
        }

        private Exception BltInputParamsException(string v)
        {
            throw new Exception(v);
        }

        private Exception BltGenericException(string v)
        {
            throw new Exception(v);
        }
    }
}