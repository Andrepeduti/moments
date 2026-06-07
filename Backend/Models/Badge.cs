using System;
using System.Collections.Generic;

namespace Backend.Models
{
    public class Badge
    {
        public Guid Id { get; set; }
        
        public string Name { get; set; } = string.Empty;
        
        /// <summary>
        /// Example: 'BR' for Brazil, 'SP' for São Paulo, etc.
        /// </summary>
        public string Code { get; set; } = string.Empty;
        
        public BadgeType Type { get; set; }
        
        public string FlagImageUrl { get; set; } = string.Empty;

        public Guid? ParentBadgeId { get; set; }
        public Badge? ParentBadge { get; set; }

        public ICollection<Badge> ChildBadges { get; set; } = new List<Badge>();
        public ICollection<UserBadge> UserBadges { get; set; } = new List<UserBadge>();
        public ICollection<Post> Posts { get; set; } = new List<Post>();
    }
}
