namespace BackBeacon.Services
{
    public interface ICookieService
    {
        void AddReplaceCookie(string cookieName, string cookieValue);

        string GetCookieValue(string cookieName);

        bool IsCookieValid(string cookieName);
    }
}