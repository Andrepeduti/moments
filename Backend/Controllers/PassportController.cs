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
    public class PassportController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PassportController(AppDbContext context)
        {
            _context = context;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());

        [HttpGet]
        private async Task<IActionResult> GetPassportForUser(Guid userId)
        {
            var unlockedBadges = await _context.UserBadges
                .Include(ub => ub.Badge)
                .Where(ub => ub.UserId == userId)
                .Select(ub => new { 
                    ub.Badge.Id, 
                    ub.Badge.Name, 
                    ub.Badge.Code, 
                    ub.Badge.Type, 
                    ub.Badge.ParentBadgeId, 
                    ub.UnlockedAt,
                    ub.IsPioneer
                })
                .ToListAsync();

            // Structure hierarchically (Country/Special -> State -> City)
            var countries = unlockedBadges.Where(b => b.Type == BadgeType.Country || b.Type == BadgeType.Special).Select(c => new {
                c.Id,
                c.Name,
                c.Code,
                c.Type,
                c.IsPioneer,
                c.UnlockedAt,
                States = unlockedBadges.Where(s => s.Type == BadgeType.State && s.ParentBadgeId == c.Id).Select(s => new {
                    s.Id,
                    s.Name,
                    s.IsPioneer,
                    s.UnlockedAt,
                    Cities = unlockedBadges.Where(ci => ci.Type == BadgeType.City && ci.ParentBadgeId == s.Id).Select(ci => new {
                        ci.Id, ci.Name, ci.UnlockedAt, ci.IsPioneer
                    }).ToList()
                }).ToList()
            }).ToList();

            return Ok(countries);
        }

        [HttpGet]
        public Task<IActionResult> GetMyPassport() => GetPassportForUser(GetUserId());

        [HttpGet("{userId}")]
        public Task<IActionResult> GetUserPassport(Guid userId) => GetPassportForUser(userId);

        [HttpGet("badge/{badgeId}")]
        public async Task<IActionResult> GetBadgeDetails(Guid badgeId)
        {
            var badge = await _context.Badges.FindAsync(badgeId);
            if (badge == null) return NotFound();

            // Rarity stats: global count of users who unlocked this badge
            var unlockCount = await _context.UserBadges.CountAsync(ub => ub.BadgeId == badgeId);
            var totalUsers = await _context.Users.CountAsync();
            
            var percentage = totalUsers > 0 ? Math.Round(((double)unlockCount / totalUsers) * 100, 1) : 0;

            return Ok(new { badge.Id, badge.Name, badge.Type, UnlockCount = unlockCount, TotalUsers = totalUsers, Percentage = percentage });
        }

        [HttpGet("badge/{badgeId}/photos")]
        [HttpGet("badge/{badgeId}/photos/{userId}")]
        public async Task<IActionResult> GetBadgePhotos(Guid badgeId, Guid? userId = null)
        {
            var targetUserId = userId ?? GetUserId();

            // Include photos archived under this badge or its children
            var descendantBadgeIds = await _context.Badges
                .Where(b => b.Id == badgeId || b.ParentBadgeId == badgeId || b.ParentBadge.ParentBadgeId == badgeId)
                .Select(b => b.Id)
                .ToListAsync();

            var photos = await _context.Posts
                .Where(p => p.UserId == targetUserId && p.IncludedInPassport && p.BadgeId.HasValue && descendantBadgeIds.Contains(p.BadgeId.Value) && !p.IsHidden)
                .Include(p => p.Badge)
                .ThenInclude(b => b.ParentBadge)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new { 
                    p.Id, 
                    p.ImageUrl, 
                    p.LocationName, 
                    p.CreatedAt,
                    StateId = p.Badge!.Type == BadgeType.State ? p.BadgeId :
                              p.Badge.Type == BadgeType.City ? p.Badge.ParentBadgeId :
                              (Guid?)null
                })
                .ToListAsync();

            return Ok(photos);
        }
    }
}
