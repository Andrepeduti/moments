using System;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace Backend.Services
{
    public class GoogleGeocodingService : IGeocodingService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public GoogleGeocodingService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<GeocodingResult?> GetLocationDetailsAsync(double latitude, double longitude)
        {
            try
            {
                var apiKey = _configuration["Google:ApiKey"];
                if (string.IsNullOrEmpty(apiKey)) throw new Exception("Google API Key not configured");

                var latStr = latitude.ToString(System.Globalization.CultureInfo.InvariantCulture);
                var lonStr = longitude.ToString(System.Globalization.CultureInfo.InvariantCulture);
                
                // Google Maps Geocoding API
                var url = $"https://maps.googleapis.com/maps/api/geocode/json?latlng={latStr},{lonStr}&language=pt-BR&key={apiKey}";
                
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var responseBody = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(responseBody);
                    var root = doc.RootElement;
                    
                    if (root.TryGetProperty("status", out var statusProp))
                    {
                        var status = statusProp.GetString();
                        
                        // ZERO_RESULTS is given by Google when coordinates land in the ocean or uncharted territory
                        if (status == "ZERO_RESULTS")
                        {
                            return new GeocodingResult { IsOcean = true };
                        }
                        
                        if (status == "OK" && root.TryGetProperty("results", out var resultsArray) && resultsArray.GetArrayLength() > 0)
                        {
                            var firstResult = resultsArray[0];
                            if (firstResult.TryGetProperty("address_components", out var addressComponents))
                            {
                                string city = "";
                                string state = "";
                                string country = "";
                                string countryCode = "";

                                foreach (var comp in addressComponents.EnumerateArray())
                                {
                                    if (comp.TryGetProperty("types", out var types))
                                    {
                                        var typeList = types.EnumerateArray().Select(t => t.GetString()).ToList();
                                        
                                        // locality or administrative_area_level_2 for City
                                        if (string.IsNullOrEmpty(city) && (typeList.Contains("locality") || typeList.Contains("administrative_area_level_2") || typeList.Contains("administrative_area_level_3")))
                                        {
                                            city = comp.GetProperty("long_name").GetString() ?? "";
                                        }
                                        
                                        // administrative_area_level_1 for State
                                        if (typeList.Contains("administrative_area_level_1"))
                                        {
                                            state = comp.GetProperty("long_name").GetString() ?? "";
                                        }

                                        // country for Country
                                        if (typeList.Contains("country"))
                                        {
                                            country = comp.GetProperty("long_name").GetString() ?? "";
                                            countryCode = comp.GetProperty("short_name").GetString() ?? "";
                                        }
                                    }
                                }

                                return new GeocodingResult
                                {
                                    City = city,
                                    State = state,
                                    Country = country,
                                    CountryCode = countryCode.ToUpper()
                                };
                            }
                        }
                    }
                }
                
                throw new Exception($"Geocoding API failed");
            }
            catch (Exception ex)
            {
                throw new Exception("Falha na API de mapas do Google.", ex);
            }
        }
    }
}
