using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace Backend.Services
{
    public interface IStorageService
    {
        Task<string> UploadFileAsync(IFormFile file, string directoryName);
        Task DeleteFileAsync(string fileUrl);
    }
}
