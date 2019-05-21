using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace BackBeacon.Models
{
    public partial class Marketing_Tracking_DevContext : DbContext
    {
        public Marketing_Tracking_DevContext()
        {
        }

        public Marketing_Tracking_DevContext(DbContextOptions<Marketing_Tracking_DevContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Action> Action { get; set; }
        public virtual DbSet<Attribute> Attribute { get; set; }
        public virtual DbSet<Audit> Audit { get; set; }
        public virtual DbSet<Brand> Brand { get; set; }
        public virtual DbSet<Campaign> Campaign { get; set; }
        public virtual DbSet<CampaignAction> CampaignAction { get; set; }
        public virtual DbSet<CampaignActionAttribute> CampaignActionAttribute { get; set; }
        public virtual DbSet<CampaignEvent> CampaignEvent { get; set; }
        public virtual DbSet<CampaignEventAttribute> CampaignEventAttribute { get; set; }
        public virtual DbSet<RemoteSystem> RemoteSystem { get; set; }
        public virtual DbSet<UniversalClient> UniversalClient { get; set; }
        public virtual DbSet<UniversalClientLink> UniversalClientLink { get; set; }
        public virtual DbSet<UniversalClientRelationship> UniversalClientRelationship { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
           // if (!optionsBuilder.IsConfigured)
            //{
                //optionsBuilder.UseSqlServer("Server=sql-srv;Database=Marketing_Tracking_Dev;Trusted_Connection=false;User ID=mkt_dev;Password=fSff=6Jyk+r2Z*kD");
            //}
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasAnnotation("ProductVersion", "2.2.3-servicing-35854");

            modelBuilder.Entity<Action>(entity =>
            {
                entity.Property(e => e.Action1)
                    .HasColumnName("Action")
                    .HasMaxLength(100)
                    .IsUnicode(false);

                entity.Property(e => e.DateCreated).HasColumnType("datetime");

                entity.Property(e => e.Description)
                    .HasMaxLength(250)
                    .IsUnicode(false);
            });

            modelBuilder.Entity<Attribute>(entity =>
            {
                entity.Property(e => e.Attribute1)
                    .HasColumnName("Attribute")
                    .HasMaxLength(100)
                    .IsUnicode(false);

                entity.Property(e => e.DateCreated).HasColumnType("datetime");

                entity.Property(e => e.Description)
                    .HasMaxLength(250)
                    .IsUnicode(false);
            });

            modelBuilder.Entity<Audit>(entity =>
            {
                entity.Property(e => e.Details)
                    .HasMaxLength(4000)
                    .IsUnicode(false);

                entity.Property(e => e.Marker)
                    .HasMaxLength(250)
                    .IsUnicode(false);
            });

            modelBuilder.Entity<Brand>(entity =>
            {
                entity.Property(e => e.Brand1)
                    .HasColumnName("Brand")
                    .HasMaxLength(100)
                    .IsUnicode(false);

                entity.Property(e => e.DateCreated).HasColumnType("datetime");
            });

            modelBuilder.Entity<Campaign>(entity =>
            {
                entity.Property(e => e.Campaign1)
                    .HasColumnName("Campaign")
                    .HasMaxLength(100)
                    .IsUnicode(false);

                entity.Property(e => e.DateCreated).HasColumnType("datetime");

                entity.HasOne(d => d.Brand)
                    .WithMany(p => p.Campaign)
                    .HasForeignKey(d => d.BrandId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Campaign_Brand");
            });

            modelBuilder.Entity<CampaignAction>(entity =>
            {
                entity.Property(e => e.DateCreated).HasColumnType("datetime");

                entity.HasOne(d => d.Campaign)
                    .WithMany(p => p.CampaignAction)
                    .HasForeignKey(d => d.CampaignId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_CampaignAction_Action");

                entity.HasOne(d => d.CampaignNavigation)
                    .WithMany(p => p.CampaignAction)
                    .HasForeignKey(d => d.CampaignId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_CampaignAction_Campaign");
            });

            modelBuilder.Entity<CampaignActionAttribute>(entity =>
            {
                entity.HasOne(d => d.Attribute)
                    .WithMany(p => p.CampaignActionAttribute)
                    .HasForeignKey(d => d.AttributeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_CampaignActionAttribute_Attribute");

                entity.HasOne(d => d.CampaignAction)
                    .WithMany(p => p.CampaignActionAttribute)
                    .HasForeignKey(d => d.CampaignActionId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_CampaignActionAttribute_CampaignAction");
            });

            modelBuilder.Entity<CampaignEvent>(entity =>
            {
                entity.Property(e => e.BrowserFootprint)
                    .HasMaxLength(4000)
                    .IsUnicode(false);

                entity.Property(e => e.RemoteAddress)
                    .HasMaxLength(100)
                    .IsUnicode(false);

                entity.Property(e => e.UserAgent)
                    .HasMaxLength(1000)
                    .IsUnicode(false);

                entity.Property(e => e.WebSessionId)
                    .HasMaxLength(100)
                    .IsUnicode(false);

                entity.HasOne(d => d.CampaignAction)
                    .WithMany(p => p.CampaignEvent)
                    .HasForeignKey(d => d.CampaignActionId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_CampaignEvent_CampaignAction");

                entity.HasOne(d => d.UniversalClient)
                    .WithMany(p => p.CampaignEvent)
                    .HasForeignKey(d => d.UniversalClientId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_CampaignEvent_UniversalClient");
            });

            modelBuilder.Entity<CampaignEventAttribute>(entity =>
            {
                entity.Property(e => e.AttributeValue)
                    .HasMaxLength(1000)
                    .IsUnicode(false);

                entity.HasOne(d => d.CampaignActionAttribute)
                    .WithMany(p => p.CampaignEventAttribute)
                    .HasForeignKey(d => d.CampaignActionAttributeId)
                    .HasConstraintName("FK_CampaignEventAttribute_CampaignActionAttribute");

                entity.HasOne(d => d.CampaignEvent)
                    .WithMany(p => p.CampaignEventAttribute)
                    .HasForeignKey(d => d.CampaignEventId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_CampaignEventAttribute_CampaignEvent");
            });

            modelBuilder.Entity<RemoteSystem>(entity =>
            {
                entity.Property(e => e.RemoteSystemId).ValueGeneratedNever();

                entity.Property(e => e.DateCreated).HasColumnType("datetime");

                entity.Property(e => e.Description)
                    .HasMaxLength(100)
                    .IsUnicode(false);
            });

            modelBuilder.Entity<UniversalClient>(entity =>
            {
                entity.Property(e => e.DateCreated).HasColumnType("datetime");

                entity.Property(e => e.ExternalId)
                    .IsRequired()
                    .HasMaxLength(40)
                    .IsUnicode(false);
            });

            modelBuilder.Entity<UniversalClientLink>(entity =>
            {
                entity.Property(e => e.DateCreated).HasColumnType("datetime");

                entity.HasOne(d => d.System)
                    .WithMany(p => p.UniversalClientLink)
                    .HasForeignKey(d => d.SystemId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_UniversalClientLink_RemoteSystem");

                entity.HasOne(d => d.UniversalClient)
                    .WithMany(p => p.UniversalClientLink)
                    .HasForeignKey(d => d.UniversalClientId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_UniversalClientLink_UniversalClient");
            });

            modelBuilder.Entity<UniversalClientRelationship>(entity =>
            {
                entity.HasKey(e => e.UniversalClientRelationId);

                entity.HasOne(d => d.PrimaryUniversalClient)
                    .WithMany(p => p.UniversalClientRelationshipPrimaryUniversalClient)
                    .HasForeignKey(d => d.PrimaryUniversalClientId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_UniversalClientRelationship_UniversalClient");

                entity.HasOne(d => d.SecondaryUniversalClient)
                    .WithMany(p => p.UniversalClientRelationshipSecondaryUniversalClient)
                    .HasForeignKey(d => d.SecondaryUniversalClientId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_UniversalClientRelationship_UniversalClient1");
            });
        }
    }
}
