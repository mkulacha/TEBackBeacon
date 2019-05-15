using Microsoft.AspNetCore.Http;

namespace BackBeacon.Services
{
    public interface IHttpContextualizer
    {
        HttpContext HttpContext();
        string GetRequestHeader(string key);
        string GetReferrer();
        string GetSessionId();
        string GetTraceId();
        string GetUserAgent();
        string GetIpAddress();
        string GetLocation();
        string GetFrom();
    }
}