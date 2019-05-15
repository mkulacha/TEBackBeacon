using System;
using System.Collections.Generic;

namespace BackBeacon.Models
{
    public partial class Action
    {
        public Action()
        {
            CampaignAction = new HashSet<CampaignAction>();
        }

        public int ActionId { get; set; }
        public string Action1 { get; set; }
        public string Description { get; set; }
        public DateTime? DateCreated { get; set; }

        public virtual ICollection<CampaignAction> CampaignAction { get; set; }
    }
}
