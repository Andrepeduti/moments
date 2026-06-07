using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<Badge> Badges { get; set; }
        public DbSet<UserBadge> UserBadges { get; set; }
        public DbSet<Friendship> Friendships { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Habilita a extensão do PostGIS no PostgreSQL
            modelBuilder.HasPostgresExtension("postgis");

            // Configura o tipo de coluna espacial usando NetTopologySuite
            modelBuilder.Entity<Post>()
                .Property(p => p.Location)
                .HasColumnType("geometry (point)");

            modelBuilder.Entity<Friendship>()
                .HasOne(f => f.Requester)
                .WithMany(u => u.FriendshipsRequested)
                .HasForeignKey(f => f.RequesterId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Friendship>()
                .HasOne(f => f.Receiver)
                .WithMany(u => u.FriendshipsReceived)
                .HasForeignKey(f => f.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Badge>()
                .HasOne(b => b.ParentBadge)
                .WithMany(b => b.ChildBadges)
                .HasForeignKey(b => b.ParentBadgeId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
