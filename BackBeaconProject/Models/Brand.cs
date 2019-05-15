using System;
using System.Collections.Generic;

namespace BackBeacon.Models
{
    public partial class Brand
    {
        public Brand()
        {
            Campaign = new HashSet<Campaign>();
        }

        public int BrandId { get; set; }
        public string Brand1 { get; set; }
        public DateTime DateCreated { get; set; }

        public virtual ICollection<Campaign> Campaign { get; set; }
    }
}
