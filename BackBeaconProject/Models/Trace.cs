using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BackBeacon.Models
{
    public class Trace
    {
        public DateTime BeaconTimestamp { get; set; } 
        public string BeaconId { get; set; }
        public int UniversalClientId { get; set; }
        public string RemoteSystemId { get; set; }
        public string RemoteSystemUserId { get; set; }
        public int CampaignId { get; set; }
        public int ActionId { get; set; }
        public string AttributeId { get; set; }
        public string SessionId { get; set; }
        public string TraceId { get; set; }
        public string Referrer { get; set; }
        public string IpAddress { get; set; }
        public string UserAgent { get; set; }
        public string AttrValue { get; set; }
        public string PageToken { get; set; }
        public string Fingerprint { get; set; }
        public string Error { get; set; }
        public int RunTime { get; set; }
        public string RunTimeSummary { get; set; }
        public string StashType { get; set; }
        public string HttpMethod { get; set; }
        public IDictionary<string,string> DataDict { get; set; }
        
        public void SetGroup1(string pageToken, int campaignId, int actionId, string attributeId, string attrValue)
        {
            PageToken = pageToken;
            CampaignId = campaignId;
            ActionId = actionId;
            AttributeId = attributeId;
            AttrValue = attrValue;
        }

        public void setGroup2(Services.IHttpContextualizer hc)
        {
            //SessionId = hc.GetSessionId();
            UserAgent = hc.GetUserAgent();
            IpAddress = hc.GetIpAddress();
            Fingerprint = new Fingerprint(hc).Generate();
        }
    }
}
