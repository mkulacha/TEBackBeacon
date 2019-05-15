using System;
using System.Collections.Generic;

namespace BackBeacon.Models
{
    public partial class CampaignAction
    {
        public CampaignAction()
        {
            CampaignActionAttribute = new HashSet<CampaignActionAttribute>();
            CampaignEvent = new HashSet<CampaignEvent>();
        }

        public int CampaignActionId { get; set; }
        public int CampaignId { get; set; }
        public int ActionId { get; set; }
        public int? FunnelDepth { get; set; }
        public DateTime DateCreated { get; set; }

        public virtual Action Campaign { get; set; }
        public virtual Campaign CampaignNavigation { get; set; }
        public virtual ICollection<CampaignActionAttribute> CampaignActionAttribute { get; set; }
        public virtual ICollection<CampaignEvent> CampaignEvent { get; set; }
    }
}
