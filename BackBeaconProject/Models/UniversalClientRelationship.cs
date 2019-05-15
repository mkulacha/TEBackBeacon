using System;
using System.Collections.Generic;

namespace BackBeacon.Models
{
    public partial class UniversalClientRelationship
    {
        public int UniversalClientRelationId { get; set; }
        public int PrimaryUniversalClientId { get; set; }
        public int SecondaryUniversalClientId { get; set; }
        public bool Deleted { get; set; }

        public virtual UniversalClient PrimaryUniversalClient { get; set; }
        public virtual UniversalClient SecondaryUniversalClient { get; set; }
    }
}
