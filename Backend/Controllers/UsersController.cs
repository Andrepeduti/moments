using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            return Ok(new { 
                user.Id,
                user.Name, 
                user.Username, 
                user.Bio, 
                user.ProfilePictureUrl,
                user.Nationality 
            });
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserProfile(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            return Ok(new { 
                user.Id,
                user.Name, 
                user.Username, 
                user.Bio, 
                user.ProfilePictureUrl,
                user.Nationality 
            });
        }

        public class UpdateProfileRequest
        {
            public string Name { get; set; } = string.Empty;
            public string Bio { get; set; } = string.Empty;
            public string ProfilePictureUrl { get; set; } = string.Empty;
            public string Nationality { get; set; } = string.Empty;
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            user.Name = request.Name;
            user.Bio = request.Bio;
            user.Nationality = request.Nationality;
            
            if (!string.IsNullOrEmpty(request.ProfilePictureUrl))
            {
                 user.ProfilePictureUrl = request.ProfilePictureUrl;
            }

            await _context.SaveChangesAsync();
            return Ok(new { user.Name, user.Username, user.Bio, user.ProfilePictureUrl, user.Nationality });
        }

        [HttpPost("me/photo")]
        public async Task<IActionResult> UploadProfilePicture([FromForm] Microsoft.AspNetCore.Http.IFormFile file, [FromServices] Backend.Services.IStorageService storageService)
        {
            if (file == null || file.Length == 0) return BadRequest("File is empty");
            
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            var imageUrl = await storageService.UploadFileAsync(file, "profiles");
            user.ProfilePictureUrl = imageUrl;
            await _context.SaveChangesAsync();

            return Ok(new { profilePictureUrl = user.ProfilePictureUrl });
        }
    }
}
