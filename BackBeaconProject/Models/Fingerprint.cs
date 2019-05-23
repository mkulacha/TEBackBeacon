using BackBeacon.Services;
using System;
using System.Collections.Specialized;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Net.Http.Headers;

namespace BackBeacon.Models
{
    public class Fingerprint
    {
        public readonly IHttpContextualizer _httpCtx;

        public Fingerprint(IHttpContextualizer httpContextualizer)
        {
            _httpCtx = httpContextualizer;
        }

        private readonly MD5 _hasher = MD5.Create();

        public string Generate()
        {
            string ipAddress = _httpCtx.GetIpAddress();

            //string sp = _httpCtx.GetContext().Request.Headers[HeaderNames.];
            string ec = _httpCtx.GetContext().Request.Headers[HeaderNames.AcceptEncoding];
            string al = _httpCtx.GetContext().Request.Headers[HeaderNames.AcceptLanguage];
            string ua = _httpCtx.GetContext().Request.Headers[HeaderNames.UserAgent];
            string ac = _httpCtx.GetContext().Request.Headers[HeaderNames.Accept];

            string protocol = _httpCtx.GetContext().Request.IsHttps ? "HTTPS" : "HTTP";
            string encoding = !string.IsNullOrEmpty(ec) ? ec : string.Empty;
            string language = !string.IsNullOrEmpty(al) ? al : string.Empty;
            string userAgent = !string.IsNullOrEmpty(ua) ? ua : string.Empty;
            string accept = !string.IsNullOrEmpty(ac) ? ac : string.Empty;

            string stringToTokenise = ipAddress + protocol + encoding + language + userAgent + accept;

            return GetMd5Hash(_hasher, stringToTokenise);
        }

        private string GetMd5Hash(MD5 md5Hash, string input)
        {
            byte[] data = md5Hash.ComputeHash(Encoding.UTF8.GetBytes(input));
            StringBuilder sBuilder = new StringBuilder();

            for (int i = 0; i < data.Length; i++)
            {
                sBuilder.Append(data[i].ToString("x2"));
            }

            return sBuilder.ToString();
        }
    }
}
