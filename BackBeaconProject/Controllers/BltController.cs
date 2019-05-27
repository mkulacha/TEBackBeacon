using System;
using Microsoft.AspNetCore.Mvc;
using BackBeacon.Services;
using BackBeacon.Models;
using System.Linq;
using Newtonsoft.Json;
using Hangfire;
using System.Diagnostics;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using Microsoft.AspNetCore.Cors;

/**
 * BLT - Beacon Log Tracker Controller
 */
namespace BackBeacon.Controllers
{ 
    [EnableCors()]
    [Route("api/[controller]")]
    [ApiController]
    public class BltController : ControllerBase
    {
        private readonly ICookieService _cookieSvc;
        private readonly IHttpContextualizer _httpCtx;
        private readonly Marketing_TrackingContext _dbCtx;

        private const string TRACKING_PIXEL = @"R0lGODlhAQABAPcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAP8ALAAAAAABAAEAAAgEAP8FBAA7";
        //private const string TRACKING_PIXEL = @"R0lGODlhAQABAIABAP///wAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="

        private const string COOKIE_NAME_BEACON = "Beacon";

        private const string MIME_TYPE_IMG_GIF = "image/gif";

        private string[] RESERVED_PARAMS = { "pagetoken", "campaignid", "actionid", "attributeid", "attrvalue" };
        
        public BltController(ICookieService cookieService, IHttpContextualizer httpContextualizer, Marketing_TrackingContext mtContext)
        {
            this._cookieSvc = cookieService;
            this._httpCtx = httpContextualizer;
            this._dbCtx = mtContext;
        }

        // <
        //[ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        [HttpGet("pixel")]
        public ActionResult<string> GetPixelAction(string uid, string session, string rsid, string rsuid, string pageToken, int campaignId, int actionId, string attributeId, string attrValue)
        {
            const string HTTP_METHOD = "GET";
            const string STASH_TYPE = "pixel";

            this.StashEvent(STASH_TYPE, HTTP_METHOD, uid, session, rsid, rsuid, pageToken, campaignId, actionId, attributeId, attrValue, this.ParseQueryStringForAtttributes(true));
     
            return File(System.Convert.FromBase64String(TRACKING_PIXEL), MIME_TYPE_IMG_GIF);
        }


        //[ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        [HttpPost("form")]
        public ActionResult<string> PostFormAction()
        {
            //const string HTTP_METHOD = "POST";
            //const string STASH_TYPE = "form";

            try
            {
                /*
                Dictionary<string,string> params = this.ParseFormForAtttributes(false);

                if (this.StashEvent(STASH_TYPE, HTTP_METHOD, cpd.UID, cdp.session, cpd.PageToken, cpd.CampaignId, cpd.ActionId, cpd.AttributeId, cpd.AttrValue, )
                {
                    return Ok("{ \"status\": \"OK\" }");
                }
                else
                {
                    return Ok("{ \"status\": \"NOT OK\" }");
                }
                */
                return Ok();
            }
            catch (Exception ex)
            {
                return Ok(String.Format("{{ \"status\": \"NOT OK\", \"exception\": \"{0}\" }}", ex.Message));
            }
        }


        //[ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        [HttpPost("consume")]
        public ActionResult<string> PostConsumeAction([FromBody] string json)
        {
            const string HTTP_METHOD = "POST";
            const string STASH_TYPE = "consume";

            try
            {
                ConsumePostData cpd = JsonConvert.DeserializeObject<ConsumePostData>(json);

                if (this.StashEvent(STASH_TYPE, HTTP_METHOD, cpd.UID, cpd.Session, "", "", cpd.PageToken, cpd.CampaignId, cpd.ActionId, cpd.AttributeId, cpd.AttrValue, this.ParseJsonForAtttributes(json, true)))
                {
                    return Ok("{ \"status\": \"OK\" }");
                }
                else
                {
                    return Ok("{ \"status\": \"NOT OK\" }");
                }
            }
            catch (Exception ex)
            {
                return Ok(String.Format("{{ \"status\": \"NOT OK\", \"exception\": \"{0}\" }}", ex.Message));
            }
        }

        // Inner Function: Stash - process/log event
        private bool StashEvent(string stashType, string httpMethod, string uid, string session, string remoteSystemId, string remoteSystemUserId, string pageToken, int campaignId, int actionId, string attributeId, string attrValue, IDictionary<string,string> dataDict)
        {
            Stopwatch stopWatch = new Stopwatch();
            stopWatch.Start();

            // BLT Timestamp
            DateTime bts = DateTime.Now;

            // Initialize Trace
            Models.Trace t = new Models.Trace
            {
                BeaconTimestamp = bts,
                StashType = stashType,
                HttpMethod = httpMethod,
                DataDict = dataDict
            };  

            try
            {
                // Trace Input Params
                t.SetGroup1(pageToken, campaignId, actionId, attributeId, attrValue);

                // Validation of Input Params
                if (campaignId < 1 || actionId < 1 || String.IsNullOrEmpty(pageToken))
                {
                    throw BltInputParamsException("Required param not set!");
                }

                // Lookup Up User/Beacon/Cookie
                string beaconId = uid;
                int universalId = -1;
                if (String.IsNullOrEmpty(uid))
                {
                    Tuple<string, int> rbc = this.ResolveBeaconCookie();
                    beaconId = rbc.Item1;
                    universalId = rbc.Item2;
                    t.BeaconId = beaconId;
                    t.UniversalClientId = universalId;
                }
                else
                {
                    universalId = this.ResolveBeaconUserIdentifier(uid);
                    // FORCE COOKIE CREATION FOR SEND IN UID (Temporary)
                    _cookieSvc.AddReplaceCookie(COOKIE_NAME_BEACON, uid);
                }

                string sessionId = !String.IsNullOrEmpty(session) ? session : _httpCtx.GetSessionId();
                t.SessionId = sessionId;

                // BEACON STORAGE
                BackgroundJob.Enqueue(() => this.StoreBeaconDataset(
                    bts, universalId, remoteSystemId, remoteSystemUserId, campaignId, actionId, attributeId, attrValue, pageToken, dataDict, sessionId, 
                    _httpCtx.GetUserAgent(), 
                    _httpCtx.GetIpAddress(),
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
                Tuple<int, string> runTime = StopAndCalcRuntime(stopWatch);
                t.RunTime = runTime.Item1;
                t.RunTimeSummary = runTime.Item2;
                BackgroundJob.Enqueue(() => this.PushAudit(bts.Millisecond.ToString(), t));
            }
        }

        // Resolve beacon cookie, additionally obtain a UniversalClient Id from Beacon-Database
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
                    // May be forced to assign to a new universal user id.
                    universalId = this.GetNewUniversalIdentifier(beaconId);
                }
            }

            return new Tuple<string, int>(beaconId, universalId);
        }

        private int ResolveBeaconUserIdentifier(string uid)
        {
            var query = _dbCtx.UniversalClient as IQueryable<UniversalClient>;
            query = query.Where(x => x.ExternalId == uid);
            UniversalClient[] list = query.ToArray<UniversalClient>();
            int universalId = -1;
            if (list.Length > 0)
            {
                universalId = list.First<UniversalClient>().UniversalClientId;
            }
            else
            {
                // May be forced to assign to a new universal user id.
                universalId = this.GetNewUniversalIdentifier(uid);
            }
            return universalId;
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

        public void StoreBeaconDataset(DateTime bts, int universalId, string remoteSystemId, string remoteSystemUserId, int campaignId, int actionId, string attributeId, string attrValue, string pageToken, IDictionary<string,string> dataDict, string sessionId, string userAgent, string ip, string footprint)
        { 
            try {
                // Add Campaign Event
                CampaignEvent ce = new CampaignEvent
                {
                    UniversalClientId = universalId,
                    CampaignActionId = actionId,
                    PageUrl = pageToken,
                    WebSessionId = sessionId,
                    UserAgent = userAgent,
                    RemoteAddress = ip,
                    BrowserFootprint = footprint,
                    ServerTimeStamp = bts
                };
                _dbCtx.CampaignEvent.Add(ce);
                _dbCtx.SaveChanges();

                // Add CampaignEvent Attributes; Possible multiple provided
                if (!String.IsNullOrEmpty(attributeId))
                {
                    string[] attributeIdArray = attributeId.Split(",");
                    string[] attrValueArray = { };
                    if (attributeIdArray.Length > 1)
                    {
                        if (String.IsNullOrEmpty(attrValue))
                        {
                            attrValueArray = attrValue.Split(",");
                        }

                        if (attributeIdArray.Length == attrValueArray.Length)
                        {
                            for (int i = 0; i < attributeIdArray.Length; i++)
                            {
                                CampaignEventAttribute cea = new CampaignEventAttribute
                                {
                                    CampaignEventId = ce.CampaignEventId,
                                    CampaignActionAttributeId = int.Parse(attributeIdArray[i]),
                                    AttributeValue = attrValueArray[i]
                                };
                                _dbCtx.CampaignEventAttribute.Add(cea);
                            }
                        }
                        else
                        {
                            // What to do in this state?  
                        }
                    }
                    else
                    {
                        // Condition for Single Attribute, with possible AttributeValue
                        CampaignEventAttribute cea = new CampaignEventAttribute
                        {
                            CampaignEventId = ce.CampaignEventId,
                            CampaignActionAttributeId = int.Parse(attributeId),
                            AttributeValue = attrValue
                        };
                        _dbCtx.CampaignEventAttribute.Add(cea);
                    }
                    _dbCtx.SaveChanges();
                }

                // Reconcile params in data-dict 
                if (dataDict.Keys.Count > 0) {
                    foreach (string k in dataDict.Keys)
                    {
                        CampaignEventAttribute cea = new CampaignEventAttribute
                        {
                            CampaignEventId = ce.CampaignEventId,
                            CampaignActionAttributeId = int.Parse(k),
                            AttributeValue = dataDict[k]
                        };
                        _dbCtx.CampaignEventAttribute.Add(cea);
                    }
                    _dbCtx.SaveChanges();
                }

                /*
                var query = _dbCtx.UniversalClientLink as IQueryable<UniversalClientLink>;
                query = query.Where(x => (x.UniversalClientId == universalId && x.SystemId == remoteSystemUserId  && x.RemoteId == remoteSystemId);
                UniversalClient[] list = query.ToArray<UniversalClient>();
                if (list.Length == 0)
                {
                    UniversalClientLink ucl = new UniversalClientLink
                    {
                        UniversalClientId = universalId,
                        
                        SystemId = remoteSystemUserId

                    };
                }
                */
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


        private Tuple<int,string> StopAndCalcRuntime(Stopwatch s)
        {
            s.Stop();
            TimeSpan ts = s.Elapsed;
            string elapsedTime = String.Format("{0:00}:{1:00}:{2:00}.{3:00}",
                ts.Hours, ts.Minutes, ts.Seconds,
                ts.Milliseconds / 10);
            return new Tuple<int, string>(ts.Milliseconds, "Elapsed:" + elapsedTime);
        }

        private IDictionary<string, string> ParseQueryStringForAtttributes(bool skipReserved = false)
        {
            IDictionary<string, string> d = new Dictionary<string, string>();
            IQueryCollection qc = _httpCtx.GetContext().Request.Query;
            foreach (string k in qc.Keys)
            {
                if (!skipReserved || (skipReserved && !RESERVED_PARAMS.Contains(k.ToLower()))) {
                    string v = _httpCtx.GetContext().Request.Query[k];
                    d.Add(k, v);
                }
            }
            return d;
        }

        private IDictionary<string, string> ParseFormForAtttributes(bool skipReserved = false)
        {
            IDictionary<string, string> d = new Dictionary<string, string>();
            IFormCollection qc = _httpCtx.GetContext().Request.Form;
            foreach (string k in qc.Keys)
            {
                if (!skipReserved || (skipReserved && !RESERVED_PARAMS.Contains(k.ToLower())))
                {
                    string v = _httpCtx.GetContext().Request.Query[k];
                    d.Add(k, v);
                }
            }
            return d;
        }


        private IDictionary<string, string> ParseJsonForAtttributes(string json, bool skipReserved = true)
        {
            IDictionary<string, string> d = JsonConvert.DeserializeObject<Dictionary<string, string>>(json);
            if (skipReserved)
            {
                foreach (string k in d.Keys)
                {
                    if (RESERVED_PARAMS.Contains(k.ToLower()))
                    {
                        d.Remove(k);
                    }
                }
            }
            return d;
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