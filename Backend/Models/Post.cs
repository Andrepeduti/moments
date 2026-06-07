using System;
using NetTopologySuite.Geometries;

namespace Backend.Models
{
    public class Post
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public string ImageUrl { get; set; } = string.Empty;
        
        public PrivacyLevel PrivacyLevel { get; set; }
        public bool IsPublic { get; set; } = true;
        
        public Point? Location { get; set; }
        public string? LocationName { get; set; }
        
        public int ReportCount { get; set; } = 0;
        public bool IsHidden { get; set; } = false;
        public bool IncludedInPassport { get; set; } = true;

        public Guid? BadgeId { get; set; }
        public Badge? Badge { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
