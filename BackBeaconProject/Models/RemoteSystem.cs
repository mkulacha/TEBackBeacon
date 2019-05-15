using System;
using System.Collections.Generic;

namespace BackBeacon.Models
{
    public partial class RemoteSystem
    {
        public RemoteSystem()
        {
            UniversalClientLink = new HashSet<UniversalClientLink>();
        }

        public int RemoteSystemId { get; set; }
        public string Description { get; set; }
        public DateTime DateCreated { get; set; }

        public virtual ICollection<UniversalClientLink> UniversalClientLink { get; set; }
    }
}
