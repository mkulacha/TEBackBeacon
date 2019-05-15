using Microsoft.AspNetCore.Http;
using System;
using System.Web;

namespace BackBeacon.Services
{
    public class HttpContextualizer : IHttpContextualizer
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public HttpContext HttpContext()
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
        public string GetReferrer()
        {
            return _httpContextAccessor.HttpContext.Request.Headers["Referrer"];
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
            return _httpContextAccessor.HttpContext.Request.Headers["User-Agent"];
        }

        public string GetIpAddress()
        {
            return _httpContextAccessor.HttpContext.Request.Headers["Host"];
        }

        public string GetFrom()
        {
            return _httpContextAccessor.HttpContext.Request.Headers["From"];
        }

        public string GetLocation()
        {
                return _httpContextAccessor.HttpContext.Request.Headers["Location"];
        }

        //public string GetFrom()
        //{
        //   return _httpContextAccessor.HttpContext.Request.Headers["From"];
        //}
    }

}