using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using BackBeacon.Services;
using System;
using Hangfire;
using Hangfire.SqlServer;

namespace BackBeacon
{
    public class Startup
    {
        //readonly string MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            /*
            // https://docs.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-2.2
            services.AddCors(options =>
            {
                options.AddPolicy(MyAllowSpecificOrigins,
                builder =>
                {
                    builder.WithOrigins("http://dev.adxtravel.com",
                                        "http://www.adxtravel.com",
                                        "http://kensingtontours.com",
                                        "http://traveledge.com");

                });
            });
            */
            //var corsOriginsList = new List<string>(ConfigurationManager.AppSettings["CorsOrigins"].Split(new char[] { ';' }));

            services.AddDistributedMemoryCache();
            services.AddSession(options =>
            {
                options.Cookie.Domain = ".adxtravel.com";
                options.IdleTimeout = TimeSpan.FromMinutes(20);
                options.Cookie.HttpOnly = true;
            });

            //https://docs.microsoft.com/en-us/aspnet/core/security/cookie-sharing?view=aspnetcore-2.2
            //services.AddDataProtection().ProtectKeysWithCertificate("thumbprint");

            services.AddHangfire(x => x.UseSqlServerStorage(Configuration.GetConnectionString("JobsDatabase")));
            services.AddHangfireServer();

            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_2);

            // REQUIRED FOR HTTPCONTEXT OPERATIONS IN .NET CORE
            services.AddHttpContextAccessor();

            // COOKIE SERVICE
            services.AddTransient<ICookieService, CookieService>();
            services.AddTransient<IHttpContextualizer, HttpContextualizer>();

            // ENTITY FRAMEWORK INITIALIZE DATABASE FROM CONFIG
            services.AddDbContext<BackBeacon.Models.Marketing_TrackingContext>(options => 
                options.UseSqlServer(Configuration.GetConnectionString("BeaconDatabase")));

        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            //app.UseCors(MyAllowSpecificOrigins);
          
            // Use HTTPS Redirection Middleware to redirect HTTP requests to HTTPS.
            app.UseHttpsRedirection();

            // Return static files and end the pipeline.
            app.UseStaticFiles();

            // Use Cookie Policy Middleware to conform to EU General Data 
            // Protection Regulation (GDPR) regulations.
            app.UseCookiePolicy();

            // Authenticate before the user accesses secure resources.
            app.UseAuthentication();

            // If the app uses session state, call Session Middleware after Cookie 
            // Policy Middleware and before MVC Middleware.
            app.UseSession();

            //app.UseHttpContextItemsMiddleware();
            app.UseHangfireDashboard();

            // Add MVC to the request pipeline.
            app.UseMvc();
        }
    }
}
