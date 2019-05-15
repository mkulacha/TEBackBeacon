using System;
using System.Collections.Generic;

namespace BackBeacon.Models
{
    public partial class Audit
    {
        public long Id { get; set; }
        public DateTime DateCreated { get; set; }
        public string Marker { get; set; }
        public string Details { get; set; }
    }
}
