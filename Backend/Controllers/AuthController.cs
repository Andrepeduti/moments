using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public class LoginRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username || u.Email == request.Username);
            
            if (user == null || user.PasswordHash != request.Password) // Simple mock check for MVP
            {
                return Unauthorized("Invalid credentials");
            }

            var token = GenerateJwtToken(user);
            return Ok(new { token, user.Id, user.Username, user.Name });
        }

        public class SocialLoginRequest
        {
            public string Provider { get; set; } = string.Empty;
            public string ProviderToken { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
        }

        [HttpPost("social-login")]
        public async Task<IActionResult> SocialLogin([FromBody] SocialLoginRequest request)
        {
            // Mock validation: in a real app, validate the providerToken via Google/Apple API
            if (string.IsNullOrEmpty(request.Email)) return BadRequest("Email is required");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                // Auto-register
                user = new User
                {
                    Id = Guid.NewGuid(),
                    Email = request.Email,
                    Name = request.Name,
                    Username = request.Email.Split('@')[0] + new Random().Next(1000, 9999),
                    CreatedAt = DateTime.UtcNow
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            var token = GenerateJwtToken(user);
            return Ok(new { token, user.Id, user.Username, user.Name });
        }

        private string GenerateJwtToken(User user)
        {
            var secret = _configuration["Jwt:Secret"] ?? "SuperSecretKeyForDevelopmentPurposesOnly123456789";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "MomentsApp",
                audience: _configuration["Jwt:Audience"] ?? "MomentsAppUsers",
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        public class RegisterRequest
        {
            public string Name { get; set; } = string.Empty;
            public string Username { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string Nationality { get; set; } = string.Empty;
            public Microsoft.AspNetCore.Http.IFormFile? ProfilePicture { get; set; }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromForm] RegisterRequest request, [FromServices] Backend.Services.IStorageService storageService)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Username))
                return BadRequest("Email and Username are required.");

            if (await _context.Users.AnyAsync(u => u.Email == request.Email || u.Username == request.Username))
                return BadRequest("Email or Username already in use.");

            string profilePicUrl = string.Empty;
            if (request.ProfilePicture != null && request.ProfilePicture.Length > 0)
            {
                profilePicUrl = await storageService.UploadFileAsync(request.ProfilePicture, "profiles");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Username = request.Username,
                Email = request.Email,
                PasswordHash = request.Password, // Simple for MVP
                Nationality = request.Nationality,
                ProfilePictureUrl = profilePicUrl,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            return Ok(new { token, user.Id, user.Username, user.Name });
        }
    }
}
