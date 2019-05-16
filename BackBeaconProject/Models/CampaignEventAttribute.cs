using System;
using System.Collections.Generic;

namespace BackBeacon.Models
{
    public partial class CampaignEventAttribute
    {
        public long CampaignEventAttributeId { get; set; }
        public long CampaignEventId { get; set; }
        public int? CampaignActionAttributeId { get; set; }
        public string AttributeValue { get; set; }
        public virtual CampaignActionAttribute CampaignActionAttribute { get; set; }
        public virtual CampaignEvent CampaignEvent { get; set; }
    }
}
