using System;

namespace Backend.Models
{
    public class UserBadge
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        
        public Guid BadgeId { get; set; }
        public Badge Badge { get; set; } = null!;
        
        public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;
        
        public bool IsPioneer { get; set; } = false;
    }
}
