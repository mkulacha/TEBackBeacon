using System;
using System.Collections.Generic;

namespace BackBeacon.Models
{
    public partial class UniversalClient
    {
        public UniversalClient()
        {
            CampaignEvent = new HashSet<CampaignEvent>();
            UniversalClientLink = new HashSet<UniversalClientLink>();
            UniversalClientRelationshipPrimaryUniversalClient = new HashSet<UniversalClientRelationship>();
            UniversalClientRelationshipSecondaryUniversalClient = new HashSet<UniversalClientRelationship>();
        }

        public int UniversalClientId { get; set; }
        public string ExternalId { get; set; }
        public DateTime DateCreated { get; set; }
        public bool IsDeleted { get; set; }

        public virtual ICollection<CampaignEvent> CampaignEvent { get; set; }
        public virtual ICollection<UniversalClientLink> UniversalClientLink { get; set; }
        public virtual ICollection<UniversalClientRelationship> UniversalClientRelationshipPrimaryUniversalClient { get; set; }
        public virtual ICollection<UniversalClientRelationship> UniversalClientRelationshipSecondaryUniversalClient { get; set; }
    }
}
