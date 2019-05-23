using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;
using System;
using System.Web;

namespace BackBeacon.Services
{
    public class HttpContextualizer : IHttpContextualizer
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public HttpContext GetContext()
        {
            return _httpContextAccessor.HttpContext;
        }

        public string GetRequestHeader(string key)
        {
            return _httpContextAccessor.HttpContext.Request.Headers[key];
        }

        public HttpContextualizer(IHttpContextAccessor httpContextAccessor)
        {
            this._httpContextAccessor = httpContextAccessor;
        }
        public string GetReferer()
        {
            return _httpContextAccessor.HttpContext.Request.Headers[HeaderNames.Referer];
        }

        public string GetSessionId()
        {
            return _httpContextAccessor.HttpContext.Session.Id;
        }

        public string GetTraceId()
        {
            return _httpContextAccessor.HttpContext.TraceIdentifier;
        }

        public string GetUserAgent()
        {
            return _httpContextAccessor.HttpContext.Request.Headers[HeaderNames.UserAgent];
        }

        public string GetIpAddress()
        {
            string address = string.Empty;
            if (!string.IsNullOrEmpty(_httpContextAccessor.HttpContext.Connection.RemoteIpAddress.ToString()))
            {
                address = _httpContextAccessor.HttpContext.Connection.RemoteIpAddress.MapToIPv4().ToString();
                //_httpCtx.GetContext().Request.Headers["HTTP_CLIENT_IP"];
            }
            /*
            if (!string.IsNullOrEmpty(_httpCtx.GetContext().Request.Headers["HTTP_X_FORWARDED_FOR"]))
            {
                address = _httpCtx.GetContext().Request.Headers["HTTP_X_FORWARDED_FOR"];
            }
            if (!string.IsNullOrEmpty(_httpCtx.GetContext().Request.Headers["REMOTE_ADDR"]))
            {
                address = _httpCtx.GetContext().Request.Headers["REMOTE_ADDR"];
            }
            */
            if (string.IsNullOrEmpty(address))
            {
                address = "0.0.0.0";
            }
            return address;
        }

        public string GetFrom()
        {
            return _httpContextAccessor.HttpContext.Request.Headers[HeaderNames.From];
        }

        public string GetLocation()
        {
                return _httpContextAccessor.HttpContext.Request.Headers[HeaderNames.Location];
        }

        //public string GetFrom()
        //{
        //   return _httpContextAccessor.HttpContext.Request.Headers["From"];
        //}
    }

}