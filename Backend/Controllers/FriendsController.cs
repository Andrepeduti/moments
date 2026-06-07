using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FriendsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FriendsController(AppDbContext context)
        {
            _context = context;
        }

        private Guid GetUserId()
        {
            return Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        }

        [HttpPost("request/{targetUserId}")]
        public async Task<IActionResult> RequestFriendship(Guid targetUserId)
        {
            var userId = GetUserId();
            if (userId == targetUserId) return BadRequest("Cannot add yourself");

            var existing = await _context.Friendships
                .FirstOrDefaultAsync(f => (f.RequesterId == userId && f.ReceiverId == targetUserId) ||
                                          (f.RequesterId == targetUserId && f.ReceiverId == userId));

            if (existing != null)
            {
                if (existing.IsAccepted) return Ok(new { message = "Already friends" });
                return Ok(new { message = "Friendship pending" });
            }

            var friendship = new Friendship
            {
                Id = Guid.NewGuid(),
                RequesterId = userId,
                ReceiverId = targetUserId,
                IsAccepted = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Friendships.Add(friendship);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Request sent" });
        }

        [HttpPost("accept/{requesterId}")]
        public async Task<IActionResult> AcceptFriendship(Guid requesterId)
        {
            var userId = GetUserId();
            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => f.RequesterId == requesterId && f.ReceiverId == userId);

            if (friendship == null) return NotFound("Request not found");

            friendship.IsAccepted = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Friendship accepted" });
        }

        [HttpGet]
        public async Task<IActionResult> GetFriends()
        {
            var userId = GetUserId();
            var friends = await _context.Friendships
                .Include(f => f.Requester)
                .Include(f => f.Receiver)
                .Where(f => (f.RequesterId == userId || f.ReceiverId == userId) && f.IsAccepted)
                .Select(f => f.RequesterId == userId ? new { f.Receiver.Id, f.Receiver.Username, f.Receiver.Name } : new { f.Requester.Id, f.Requester.Username, f.Requester.Name })
                .ToListAsync();

            return Ok(friends);
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var userId = GetUserId();
            var requests = await _context.Friendships
                .Include(f => f.Requester)
                .Where(f => f.ReceiverId == userId && !f.IsAccepted)
                .Select(f => new {
                    f.Requester.Id,
                    f.Requester.Username,
                    f.Requester.Name,
                    f.Requester.ProfilePictureUrl,
                    f.CreatedAt
                })
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            return Ok(requests);
        }

        [HttpGet("status/{targetUserId}")]
        public async Task<IActionResult> GetFriendshipStatus(Guid targetUserId)
        {
            var userId = GetUserId();
            
            if (userId == targetUserId) return Ok(new { status = "Self" });

            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => (f.RequesterId == userId && f.ReceiverId == targetUserId) ||
                                          (f.RequesterId == targetUserId && f.ReceiverId == userId));

            if (friendship == null) return Ok(new { status = "None" });
            if (friendship.IsAccepted) return Ok(new { status = "Friends" });
            if (friendship.RequesterId == userId) return Ok(new { status = "Pending_Sent" });
            
            return Ok(new { status = "Pending_Received" });
        }

        [HttpGet("count/{userId}")]
        public async Task<IActionResult> GetFriendCount(Guid userId)
        {
            var count = await _context.Friendships
                .Where(f => (f.RequesterId == userId || f.ReceiverId == userId) && f.IsAccepted)
                .CountAsync();

            return Ok(new { count });
        }
    }
}
