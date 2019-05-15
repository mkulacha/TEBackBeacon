﻿using Microsoft.AspNetCore.Http;
using System;
using System.Globalization;
using System.Web;

namespace BackBeacon.Services
{
    public class CookieService : ICookieService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CookieService(IHttpContextAccessor httpContextAccessor)
        {
            this._httpContextAccessor = httpContextAccessor;
        }
        public void AddReplaceCookie(string cookieName, string cookieValue)
        {
            var HttpContext = _httpContextAccessor.HttpContext;
            if (HttpContext.Request.Cookies[cookieName]== null)
            {
                // Create New
                HttpContext.Response.Cookies.Append(
                    cookieName, 
                    cookieValue, 
                    new CookieOptions() {
                        Expires = DateTime.Now.AddMilliseconds(GetExpirationMillis())
                    } );
            }
        }

        public string GetCookieValue(string cookieName)
        {
            try
            {
                var HttpContext = _httpContextAccessor.HttpContext;
                string cookieValue = HttpContext.Request.Cookies[cookieName];
                if (String.IsNullOrEmpty(cookieValue))
                {
                    return "";
                }
                else
                {
                    return cookieValue;
                }
            }
            catch(Exception) {
                return "";
            }
        }

        public bool IsCookieValid(string cookieName)
        {
            try
            {
                return _httpContextAccessor.HttpContext.Request.Cookies.ContainsKey(cookieName);               
            }
            catch (Exception)
            {
                return false;
            }
        }

        private double GetExpirationMillis()
        {
            DateTime start = DateTime.Now;
            string endDateString = "19/01/2038";
            DateTime end = DateTime.ParseExact(endDateString, "dd/MM/yyyy", CultureInfo.InvariantCulture);
            TimeSpan span = end.Date - start.Date;
            double ms = span.TotalMilliseconds;
            return ms;
        }
    }

}