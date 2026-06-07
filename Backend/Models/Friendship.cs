using System;

namespace Backend.Models
{
    public class Friendship
    {
        public Guid Id { get; set; }
        
        public Guid RequesterId { get; set; }
        public User Requester { get; set; } = null!;
        
        public Guid ReceiverId { get; set; }
        public User Receiver { get; set; } = null!;
        
        public bool IsAccepted { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
