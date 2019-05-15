using BackBeacon.Services;
using System;
using System.Collections.Specialized;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

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
            string ipAddress = GetIpAddress();

            string protocol = !string.IsNullOrEmpty( _httpCtx.GetRequestHeader("SERVER_PROTOCOL"))  ? _httpCtx.GetRequestHeader("SERVER_PROTOCOL") : string.Empty;
            string encoding = !string.IsNullOrEmpty(_httpCtx.GetRequestHeader("HTTP_ACCEPT_ENCODING")) ? _httpCtx.GetRequestHeader("HTTP_ACCEPT_ENCODING") : string.Empty;
            string language = !string.IsNullOrEmpty(_httpCtx.GetRequestHeader("HTTP_ACCEPT_LANGUAGE")) ? _httpCtx.GetRequestHeader("HTTP_ACCEPT_LANGUAGE") : string.Empty;
            string userAgent = !string.IsNullOrEmpty(_httpCtx.GetRequestHeader("HTTP_USER_AGENT")) ? _httpCtx.GetRequestHeader("HTTP_USER_AGENT") : string.Empty;
            string accept = !string.IsNullOrEmpty(_httpCtx.GetRequestHeader("HTTP_ACCEPT")) ? _httpCtx.GetRequestHeader("HTTP_ACCEPT") : string.Empty;

            string stringToTokenise = ipAddress + protocol + encoding + language + userAgent + accept;

            return GetMd5Hash(_hasher, stringToTokenise);
        }

        public string GetIpAddress()
        {
            string address = string.Empty;

            if (!string.IsNullOrEmpty(_httpCtx.GetRequestHeader("HTTP_CLIENT_IP")))
            {
                address = _httpCtx.GetRequestHeader("HTTP_CLIENT_IP");
            }

            if (!string.IsNullOrEmpty(_httpCtx.GetRequestHeader("HTTP_X_FORWARDED_FOR")))
            {
                address = _httpCtx.GetRequestHeader("HTTP_X_FORWARDED_FOR");
            }

            if (!string.IsNullOrEmpty(_httpCtx.GetRequestHeader("REMOTE_ADDR")))
            {
                address = _httpCtx.GetRequestHeader("REMOTE_ADDR");
            }

            if (string.IsNullOrEmpty(address))
            {
                address = "0.0.0.0";
            }

            return address;
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
