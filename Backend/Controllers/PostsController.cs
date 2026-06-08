using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PostsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IStorageService _storageService;
        private readonly IGeocodingService _geocodingService;

        public PostsController(AppDbContext context, IStorageService storageService, IGeocodingService geocodingService)
        {
            _context = context;
            _storageService = storageService;
            _geocodingService = geocodingService;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());

        public class CreatePostRequest
        {
            public IFormFile File { get; set; } = null!;
            public PrivacyLevel PrivacyLevel { get; set; }
            public string? Latitude { get; set; }
            public string? Longitude { get; set; }
            public string? LocationName { get; set; }
            public bool IncludedInPassport { get; set; } = true;
            public bool IsPublic { get; set; } = true;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePost([FromForm] CreatePostRequest request)
        {
            var userId = GetUserId();
            var imageUrl = await _storageService.UploadFileAsync(request.File, "posts");

            var post = new Post
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ImageUrl = imageUrl,
                PrivacyLevel = request.PrivacyLevel,
                IsPublic = request.IsPublic,
                IncludedInPassport = request.IncludedInPassport,
                CreatedAt = DateTime.UtcNow
            };

            double? finalLat = null;
            double? finalLon = null;

            if (!string.IsNullOrEmpty(request.Latitude) && double.TryParse(request.Latitude, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsedLat))
                finalLat = parsedLat;

            if (!string.IsNullOrEmpty(request.Longitude) && double.TryParse(request.Longitude, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsedLon))
                finalLon = parsedLon;

            double? obfLat = finalLat;
            double? obfLon = finalLon;

            if (request.PrivacyLevel == PrivacyLevel.Region && finalLat.HasValue && finalLon.HasValue)
            {
                // Obfuscate by up to 5km (approx 0.045 degrees)
                var rand = new Random();
                obfLat += (rand.NextDouble() * 0.09) - 0.045;
                obfLon += (rand.NextDouble() * 0.09) - 0.045;
                post.Location = new Point(obfLon.Value, obfLat.Value) { SRID = 4326 };
            }
            else if (request.PrivacyLevel == PrivacyLevel.Exact && finalLat.HasValue && finalLon.HasValue)
            {
                post.Location = new Point(finalLon.Value, finalLat.Value) { SRID = 4326 };
            }
            // For Macro, Location stays null

            // Reverse Geocoding
            if (finalLat.HasValue && finalLon.HasValue)
            {
                GeocodingResult? geoResult = null;
                try
                {
                    geoResult = await _geocodingService.GetLocationDetailsAsync(finalLat.Value, finalLon.Value);
                }
                catch (Exception)
                {
                    return BadRequest("Não foi possível calcular o endereço geográfico no momento. Por favor, tente publicar novamente em alguns segundos.");
                }

                if (geoResult != null && !geoResult.IsOcean && (!string.IsNullOrEmpty(geoResult.Country) || !string.IsNullOrEmpty(geoResult.City) || !string.IsNullOrEmpty(geoResult.State)))
                {
                    var parts = new System.Collections.Generic.List<string>();
                    
                    if (request.PrivacyLevel == PrivacyLevel.Exact && !string.IsNullOrWhiteSpace(geoResult.City))
                        parts.Add(geoResult.City);
                        
                    if ((request.PrivacyLevel == PrivacyLevel.Exact || request.PrivacyLevel == PrivacyLevel.Region) && !string.IsNullOrWhiteSpace(geoResult.State))
                        parts.Add(geoResult.State);
                        
                    if (!string.IsNullOrWhiteSpace(geoResult.Country))
                        parts.Add(geoResult.Country);

                    if (!string.IsNullOrWhiteSpace(request.LocationName))
                    {
                        post.LocationName = request.LocationName;
                        if (parts.Count > 0)
                        {
                            post.LocationName += $", {parts.First()}";
                        }
                    }
                    else
                    {
                        post.LocationName = string.Join(", ", parts);
                    }

                    // Badge Hierarchy (Country -> State -> City)
                    Badge? countryBadge = null, stateBadge = null, cityBadge = null;

                    if (!string.IsNullOrEmpty(geoResult.Country))
                    {
                        countryBadge = await GetOrCreateBadge(geoResult.Country, geoResult.CountryCode, BadgeType.Country, null);
                        await UnlockBadgeForUser(userId, countryBadge.Id);
                    }
                    if (!string.IsNullOrEmpty(geoResult.State) && countryBadge != null)
                    {
                        stateBadge = await GetOrCreateBadge(geoResult.State, "", BadgeType.State, countryBadge.Id);
                        await UnlockBadgeForUser(userId, stateBadge.Id);
                    }
                    if (!string.IsNullOrEmpty(geoResult.City) && stateBadge != null)
                    {
                        cityBadge = await GetOrCreateBadge(geoResult.City, "", BadgeType.City, stateBadge.Id);
                        await UnlockBadgeForUser(userId, cityBadge.Id);
                    }

                    // Link the most specific badge to the post if included in passport
                    if (request.IncludedInPassport)
                    {
                        post.BadgeId = cityBadge?.Id ?? stateBadge?.Id ?? countryBadge?.Id;
                    }
                }
                else if (geoResult != null && geoResult.IsOcean)
                {
                    // Obsidiana: Terras Longínquas
                    post.LocationName = "Terras Longínquas";
                    var oceanBadge = await GetOrCreateBadge("Terras Longínquas", "OCEAN", BadgeType.Special, null);
                    await UnlockBadgeForUser(userId, oceanBadge.Id);
                    if (request.IncludedInPassport)
                    {
                        post.BadgeId = oceanBadge.Id;
                    }
                }
            }

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            // Galactic check
            var countryCount = await _context.UserBadges
                .Include(ub => ub.Badge)
                .Where(ub => ub.UserId == userId && ub.Badge.Type == BadgeType.Country)
                .CountAsync();
                
            if (countryCount >= 3)
            {
                var galacticBadge = await GetOrCreateBadge("Conhecedor das Galáxias", "GALAXY", BadgeType.Special, null);
                await UnlockBadgeForUser(userId, galacticBadge.Id);
                await _context.SaveChangesAsync();
            }

            return Ok(new {
                post.Id,
                post.ImageUrl,
                post.PrivacyLevel,
                post.LocationName,
                Lat = post.Location != null ? post.Location.Y : (double?)null,
                Lon = post.Location != null ? post.Location.X : (double?)null,
                post.CreatedAt
            });
        }

        private async Task<Badge> GetOrCreateBadge(string name, string code, BadgeType type, Guid? parentId)
        {
            var badge = await _context.Badges.FirstOrDefaultAsync(b => b.Name == name && b.Type == type && b.ParentBadgeId == parentId);
            if (badge == null)
            {
                badge = new Badge
                {
                    Id = Guid.NewGuid(),
                    Name = name,
                    Code = code,
                    Type = type,
                    ParentBadgeId = parentId
                };
                _context.Badges.Add(badge);
                await _context.SaveChangesAsync();
            }
            return badge;
        }

        private async Task UnlockBadgeForUser(Guid userId, Guid badgeId)
        {
            var hasBadge = await _context.UserBadges.AnyAsync(ub => ub.UserId == userId && ub.BadgeId == badgeId);
            if (!hasBadge)
            {
                var isPioneer = !await _context.UserBadges.AnyAsync(ub => ub.BadgeId == badgeId);

                _context.UserBadges.Add(new UserBadge
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    BadgeId = badgeId,
                    UnlockedAt = DateTime.UtcNow,
                    IsPioneer = isPioneer
                });
            }
        }

        [HttpGet("discover")]
        public async Task<IActionResult> GetDiscoverFeed([FromQuery] double? lat, [FromQuery] double? lon)
        {
            var yesterday = DateTime.UtcNow.AddDays(-1);
            var query = _context.Posts
                .Include(p => p.User)
                .Where(p => !p.IsHidden && p.CreatedAt >= yesterday && p.IsPublic);

            if (lat.HasValue && lon.HasValue)
            {
                var point = new Point(lon.Value, lat.Value) { SRID = 4326 };
                // Sort by distance (nearest first)
                query = query.OrderBy(p => p.Location != null ? p.Location.Distance(point) : double.MaxValue);
            }
            else
            {
                query = query.OrderByDescending(p => p.CreatedAt);
            }

            var posts = await query.Take(50).Select(p => new {
                p.Id,
                p.ImageUrl,
                p.PrivacyLevel,
                p.LocationName,
                p.IsPublic,
                Lat = p.Location != null ? p.Location.Y : (double?)null,
                Lon = p.Location != null ? p.Location.X : (double?)null,
                p.CreatedAt,
                Author = new { p.User.Id, p.User.Username, Name = p.User.Name, p.User.ProfilePictureUrl }
            }).ToListAsync();

            return Ok(posts);
        }

        [HttpGet("friends")]
        public async Task<IActionResult> GetFriendsFeed()
        {
            var userId = GetUserId();
            var friendIds = await _context.Friendships
                .Where(f => (f.RequesterId == userId || f.ReceiverId == userId) && f.IsAccepted)
                .Select(f => f.RequesterId == userId ? f.ReceiverId : f.RequesterId)
                .ToListAsync();

            var posts = await _context.Posts
                .Include(p => p.User)
                .Where(p => (friendIds.Contains(p.UserId) || p.UserId == userId) && !p.IsHidden)
                .OrderByDescending(p => p.CreatedAt)
                .Take(50)
                .Select(p => new {
                    p.Id,
                    p.ImageUrl,
                    p.PrivacyLevel,
                    p.LocationName,
                    p.IsPublic,
                    Lat = p.Location != null ? p.Location.Y : (double?)null,
                    Lon = p.Location != null ? p.Location.X : (double?)null,
                    p.CreatedAt,
                    Author = new { p.User.Id, p.User.Username, Name = p.User.Name, p.User.ProfilePictureUrl }
                }).ToListAsync();

            return Ok(posts);
        }

        [HttpPost("{id}/report")]
        public async Task<IActionResult> ReportPost(Guid id)
        {
            var post = await _context.Posts.FindAsync(id);
            if (post == null) return NotFound();

            post.ReportCount++;
            if (post.ReportCount >= 5)
            {
                post.IsHidden = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Post reported" });
        }
    }
}
