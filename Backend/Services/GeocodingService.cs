using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class NominatimGeocodingService : IGeocodingService
    {
        private readonly HttpClient _httpClient;

        public NominatimGeocodingService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            // Nominatim requires a user-agent to be set
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "MomentsApp/1.0");
        }

        public async Task<GeocodingResult?> GetLocationDetailsAsync(double latitude, double longitude)
        {
            try
            {
                var url = $"https://nominatim.openstreetmap.org/reverse?format=json&lat={latitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}&lon={longitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}&zoom=10&addressdetails=1";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var data = await response.Content.ReadFromJsonAsync<JsonElement>();
                    
                    if (data.TryGetProperty("error", out var errorProp) && errorProp.GetString() == "Unable to geocode")
                    {
                        return new GeocodingResult { IsOcean = true };
                    }

                    if (data.TryGetProperty("address", out var address))
                    {
                        string city = address.TryGetProperty("city", out var cityProp) ? cityProp.GetString() ?? "" :
                                      address.TryGetProperty("municipality", out var munProp) ? munProp.GetString() ?? "" :
                                      address.TryGetProperty("town", out var townProp) ? townProp.GetString() ?? "" :
                                      address.TryGetProperty("village", out var villageProp) ? villageProp.GetString() ?? "" : "";
                        
                        string state = address.TryGetProperty("state", out var stateProp) ? stateProp.GetString() ?? "" : "";
                        string country = address.TryGetProperty("country", out var countryProp) ? countryProp.GetString() ?? "" : "";
                        string countryCode = address.TryGetProperty("country_code", out var ccProp) ? (ccProp.GetString() ?? "").ToUpper() : "";

                        return new GeocodingResult
                        {
                            City = city,
                            State = state,
                            Country = country,
                            CountryCode = countryCode
                        };
                    }
                }
                
                throw new Exception($"Geocoding API returned status {response.StatusCode}");
            }
            catch (Exception ex)
            {
                throw new Exception("Falha na API de mapas.", ex);
            }
        }
    }
}
