using System;
using System.Collections.Generic;

namespace BackBeacon.Models
{
    public partial class CampaignActionAttribute
    {
        public CampaignActionAttribute()
        {
            CampaignEventAttribute = new HashSet<CampaignEventAttribute>();
        }

        public int CampaignActionAttributeId { get; set; }
        public int CampaignActionId { get; set; }
        public int AttributeId { get; set; }

        public virtual Attribute Attribute { get; set; }
        public virtual CampaignAction CampaignAction { get; set; }
        public virtual ICollection<CampaignEventAttribute> CampaignEventAttribute { get; set; }
    }
}
