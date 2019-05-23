using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using BackBeacon.Services;
using System;
using System.Net;
using Hangfire;
using Hangfire.SqlServer;
using System.IO;
using Microsoft.AspNetCore.Rewrite;
using Microsoft.AspNetCore.HttpOverrides;

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

            services.AddCors(options =>
            {
                options.AddPolicy("CorsPolicy",
                    builder => builder.AllowAnyOrigin()
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials());
            });


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

            // Use HTTPS Redirection Middleware to redirect HTTP requests to HTTPS.
            app.UseHttpsRedirection();

            //app.UseCors(MyAllowSpecificOrigins);
            app.UseCors("CorsPolicy");

            // URL Rewrite 
            using (StreamReader apacheModRewriteStreamReader = File.OpenText("ApacheModRewrite.txt"))
            using (StreamReader iisUrlRewriteStreamReader = File.OpenText("IISUrlRewrite.xml"))
            {
                var options = new RewriteOptions()
                    //.AddRedirect("redirect-rule/(.*)", "redirected/$1")
                    //.AddRewrite(@"^rewrite-rule/(\d+)/(\d+)", "rewritten?var1=$1&var2=$2", skipRemainingRules: true)
                    //.AddApacheModRewrite(apacheModRewriteStreamReader)
                    .AddIISUrlRewrite(iisUrlRewriteStreamReader)
                    .Add(MethodRules.RedirectXmlFileRequests)
                    .Add(MethodRules.RewriteTextFileRequests);
                    //.Add(new RedirectImageRequests(".png", "/png-images"))
                    //.Add(new RedirectImageRequests(".jpg", "/jpg-images"));
                app.UseRewriter(options);
            }

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

            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.All,
                RequireHeaderSymmetry = false,
                ForwardLimit = null,
                KnownNetworks = { new IPNetwork(IPAddress.Parse("::ffff:172.17.0.1"), 104) }
            });

            //app.UseHttpContextItemsMiddleware();
            app.UseHangfireDashboard();

            // Add MVC to the request pipeline.
            app.UseMvc();
        }
    }
}
