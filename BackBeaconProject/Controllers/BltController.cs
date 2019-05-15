using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using BackBeacon.Services;
using System.Net;
using BackBeacon.Models;
using System.Linq;
using Newtonsoft.Json;

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
        private readonly string COOKIE_NAME_BEACON = "Beacon";
        //private readonly string COOKIE_NAME_UNIVERSAL_ID = "U";
        private readonly string MIME_TYPE_IMG_GIF = "image/gif";
        
        public BltController(ICookieService cookieService, IHttpContextualizer httpContextualizer, Marketing_TrackingContext mtContext)
        {
            this._cookieSvc = cookieService;
            this._httpCtx = httpContextualizer;
            this._dbCtx = mtContext;
        }

        [HttpGet("pixel")]
        public ActionResult<string> GetPixelAction(string pageToken, int campaignId, int actionId, int attributeId, string attrValue = "")
        {
            this.Stash(pageToken, campaignId, actionId, attributeId, attrValue);
     
            return File(System.Convert.FromBase64String(TRACKING_PIXEL), MIME_TYPE_IMG_GIF);
        }


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

        private bool Stash(string pageToken, int campaignId, int actionId, int attributeId, string attrValue = "")
        {
            // BLT Timestamp
            DateTime bts = DateTime.Now;

            // Initialize Trace
            Trace t = new Trace
            {
                BeaconTimestamp = bts
            };

            try
            {
                // Trace Input Params
                t.SetGroup1(pageToken, campaignId, actionId, attributeId, attrValue);

                // Validation of Input Params
                if (campaignId < 1 || actionId < 1 || attributeId < 1 || String.IsNullOrEmpty(pageToken))
                {
                    throw BltInputParamsException("Input params unset");
                }

                // Lookup Up User/Beacon/Cookie
                Tuple<string, int> rbc = this.ResolveBeaconCookie();
                string beaconId = rbc.Item1;
                int universalId = rbc.Item2;
                t.BeaconId = beaconId;
                t.UniversalClientId = universalId;

                // BEACON STORAGE
                this.StoreBeaconDataset(bts, universalId, campaignId, actionId, attributeId, attrValue);
                t.setGroup2(_httpCtx);

                return true;
            }
            catch (Exception ex)
            {
                t.Error = ex.Message;
                Console.Write("BLT Pixel Tracking Failed; " + ex);

                return false;
            }
            finally
            {
                this.PushAudit("", t);
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

                // Insert into Primary Storage, and obtain universal-id
                UniversalClient uc = new UniversalClient
                {
                    ExternalId = beaconId
                };
                _dbCtx.UniversalClient.Add(uc);
                _dbCtx.SaveChanges();

                // Universal Id??
                universalId = uc.UniversalClientId;

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
                universalId = list.First<UniversalClient>().UniversalClientId;
            }

            return new Tuple<string, int>(beaconId, universalId);
        }


        private void StoreBeaconDataset(DateTime bts, int universalId, int campaignId, int actionId, int attributeId, string attrValue)
        {
            // BEACON STORAGE
            CampaignEvent ce = new CampaignEvent
            {
                UniversalClientId = universalId,
                CampaignActionId = actionId,
                WebSessionId = _httpCtx.GetSessionId(),
                UserAgent = _httpCtx.GetUserAgent(),
                RemoteAddress = _httpCtx.GetIpAddress(),
                BrowserFootprint = new Fingerprint(_httpCtx).Generate()
            };
            _dbCtx.CampaignEvent.Add(ce);
            _dbCtx.SaveChanges();

            // TODO FOR LOOP
            CampaignEventAttribute cea = new CampaignEventAttribute
            {
                CampaignEventId = ce.CampaignEventId,
                CampaignActionAttributeId = attributeId,
                AttributeValue = attrValue
            };
            _dbCtx.CampaignEventAttribute.Add(cea);
            _dbCtx.SaveChanges();
        }

        private void PushAudit(string marker, Trace trace)
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
            catch
            {
            }
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