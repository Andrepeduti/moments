using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class S3StorageService : IStorageService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
        private readonly ILogger<S3StorageService> _logger;

        public S3StorageService(IConfiguration configuration, ILogger<S3StorageService> logger)
        {
            var accessKey = configuration["AWS:AccessKeyId"];
            var secretKey = configuration["AWS:SecretAccessKey"];
            var region = Amazon.RegionEndpoint.USEast1; // Default to USEast1

            if (!string.IsNullOrEmpty(accessKey) && !string.IsNullOrEmpty(secretKey))
            {
                var credentials = new Amazon.Runtime.BasicAWSCredentials(accessKey, secretKey);
                _s3Client = new AmazonS3Client(credentials, region);
            }
            else
            {
                _s3Client = new AmazonS3Client(region);
            }
            
            _bucketName = configuration["AWS:S3BucketName"] ?? throw new InvalidOperationException("AWS:S3BucketName is missing from configuration.");
            _logger = logger;
        }

        public async Task<string> UploadFileAsync(IFormFile file, string directoryName)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Invalid file");

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var key = $"{directoryName}/{fileName}";

            _logger.LogInformation($"Uploading file {fileName} to S3 bucket {_bucketName} at prefix {directoryName}");

            using (var stream = new MemoryStream())
            {
                await file.CopyToAsync(stream);

                var request = new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = key,
                    InputStream = stream,
                    ContentType = file.ContentType
                    // We don't set CannedACL = S3CannedACL.PublicRead here because many modern buckets block public ACLs by default.
                    // The bucket itself should be configured with a public read bucket policy.
                };

                await _s3Client.PutObjectAsync(request);
            }

            // Return the public URL to the S3 object
            return $"https://{_bucketName}.s3.amazonaws.com/{key}";
        }

        public async Task DeleteFileAsync(string fileUrl)
        {
            if (string.IsNullOrEmpty(fileUrl)) return;

            // Extract the key from the URL: "https://bucket-name.s3.amazonaws.com/directory/filename.jpg"
            var prefix = $"https://{_bucketName}.s3.amazonaws.com/";
            if (fileUrl.StartsWith(prefix))
            {
                var key = fileUrl.Substring(prefix.Length);
                
                _logger.LogInformation($"Deleting file {key} from S3 bucket {_bucketName}");

                var request = new DeleteObjectRequest
                {
                    BucketName = _bucketName,
                    Key = key
                };

                await _s3Client.DeleteObjectAsync(request);
            }
            else
            {
                _logger.LogWarning($"Could not delete S3 file, invalid URL format: {fileUrl}");
            }
        }
    }
}
