using System;
using System.Globalization;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlacesController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly Backend.Services.IGeocodingService _geocodingService;

        public PlacesController(IHttpClientFactory httpClientFactory, IConfiguration configuration, Backend.Services.IGeocodingService geocodingService)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _geocodingService = geocodingService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchPlaces([FromQuery] string q, [FromQuery] double lat, [FromQuery] double lon)
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest("Query is required");

            var apiKey = _configuration["Google:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
                return StatusCode(500, "Google API Key is not configured.");

            var url = "https://places.googleapis.com/v1/places:searchText";

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Goog-Api-Key", apiKey);
            client.DefaultRequestHeaders.Add("X-Goog-FieldMask", "places.id,places.displayName,places.formattedAddress,places.location");

            var requestBody = new
            {
                textQuery = q,
                locationBias = new
                {
                    circle = new
                    {
                        center = new
                        {
                            latitude = lat,
                            longitude = lon
                        },
                        radius = 15000.0
                    }
                },
                languageCode = "pt-BR"
            };

            var content = new StringContent(JsonSerializer.Serialize(requestBody), System.Text.Encoding.UTF8, "application/json");
            var response = await client.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, $"Failed to fetch places from Google: {errorBody}");
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            var results = new System.Collections.Generic.List<object>();

            if (root.TryGetProperty("places", out var placesArray))
            {
                foreach (var item in placesArray.EnumerateArray())
                {
                    var placeId = item.GetProperty("id").GetString();
                    
                    var name = "";
                    if (item.TryGetProperty("displayName", out var displayNameProp) && displayNameProp.TryGetProperty("text", out var textProp))
                    {
                        name = textProp.GetString();
                    }

                    var address = item.TryGetProperty("formattedAddress", out var addrProp) ? addrProp.GetString() : "";
                    
                    var location = item.GetProperty("location");
                    var itemLat = location.GetProperty("latitude").GetDouble();
                    var itemLon = location.GetProperty("longitude").GetDouble();

                    results.Add(new
                    {
                        id = placeId,
                        name = name,
                        address = address,
                        lat = itemLat,
                        lon = itemLon
                    });
                }
            }

            return Ok(results);
        }

        [HttpGet("reverse")]
        public async Task<IActionResult> ReverseGeocode([FromQuery] double lat, [FromQuery] double lon)
        {
            var geoResult = await _geocodingService.GetLocationDetailsAsync(lat, lon);
            if (geoResult != null)
            {
                return Ok(new { 
                    city = geoResult.City ?? "", 
                    state = geoResult.State ?? "", 
                    country = geoResult.Country ?? "" 
                });
            }
            return Ok(new { city = "", state = "", country = "" });
        }
    }
}
