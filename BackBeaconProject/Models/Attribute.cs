using System;
using System.Collections.Generic;

namespace BackBeacon.Models
{
    public partial class Attribute
    {
        public Attribute()
        {
            CampaignActionAttribute = new HashSet<CampaignActionAttribute>();
        }

        public int AttributeId { get; set; }
        public string Attribute1 { get; set; }
        public string Description { get; set; }
        public DateTime DateCreated { get; set; }

        public virtual ICollection<CampaignActionAttribute> CampaignActionAttribute { get; set; }
    }
}
