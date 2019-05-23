using Microsoft.AspNetCore.Http;

namespace BackBeacon.Services
{
    public interface IHttpContextualizer
    {
        HttpContext GetContext();
        string GetRequestHeader(string key);
        string GetReferer();
        string GetSessionId();
        string GetTraceId();
        string GetUserAgent();
        string GetIpAddress();
        string GetLocation();
        string GetFrom();
    }
}