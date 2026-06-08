using System.Threading.Tasks;

namespace Backend.Services
{
    public class GeocodingResult
    {
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string CountryCode { get; set; } = string.Empty;
        public bool IsOcean { get; set; } = false;
    }

    public interface IGeocodingService
    {
        Task<GeocodingResult?> GetLocationDetailsAsync(double latitude, double longitude);
    }
}
