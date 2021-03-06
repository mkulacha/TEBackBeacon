﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BackBeacon.Models
{
    public class ConsumePostData
    {
        public string UID { get; set; }
        public string Session { get; set; }
        public string PageToken { get; set; }
        public int CampaignId { get; set; }
        public int ActionId { get; set; }
        public string AttributeId { get; set; }
        public string AttrValue { get; set; }
    }
}
