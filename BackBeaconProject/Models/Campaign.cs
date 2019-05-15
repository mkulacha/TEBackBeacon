using System;
using System.Collections.Generic;

namespace BackBeacon.Models
{
    public partial class Campaign
    {
        public Campaign()
        {
            CampaignAction = new HashSet<CampaignAction>();
        }

        public int CampaignId { get; set; }
        public int BrandId { get; set; }
        public string Campaign1 { get; set; }
        public DateTime DateCreated { get; set; }

        public virtual Brand Brand { get; set; }
        public virtual ICollection<CampaignAction> CampaignAction { get; set; }
    }
}
