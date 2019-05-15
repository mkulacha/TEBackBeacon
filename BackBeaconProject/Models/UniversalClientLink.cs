using System;
using System.Collections.Generic;

namespace BackBeacon.Models
{
    public partial class UniversalClientLink
    {
        public int UniversalClientLinkId { get; set; }
        public int UniversalClientId { get; set; }
        public int SystemId { get; set; }
        public int RemoteId { get; set; }
        public DateTime DateCreated { get; set; }
        public bool IsDeleted { get; set; }

        public virtual RemoteSystem System { get; set; }
        public virtual UniversalClient UniversalClient { get; set; }
    }
}
