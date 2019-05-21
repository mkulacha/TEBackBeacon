using System;
using System.Collections.Generic;

namespace BackBeacon.Models
{
    public partial class CampaignEvent
    {
        public CampaignEvent()
        {
            CampaignEventAttribute = new HashSet<CampaignEventAttribute>();
        }

        public long CampaignEventId { get; set; }
        public int UniversalClientId { get; set; }
        public int CampaignActionId { get; set; }
        public DateTime DateCreated { get; set; }
        public string RemoteAddress { get; set; }
        public string BrowserFootprint { get; set; }
        public string UserAgent { get; set; }
        public string WebSessionId { get; set; }
        public DateTime? ServerTimeStamp { get; set; }

        public virtual CampaignAction CampaignAction { get; set; }
        public virtual UniversalClient UniversalClient { get; set; }
        public virtual ICollection<CampaignEventAttribute> CampaignEventAttribute { get; set; }
    }
}
