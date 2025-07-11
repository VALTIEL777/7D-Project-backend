const Minio = require('minio');

// Debug: Log the environment variables being used
console.log('=== MinIO Configuration Debug ===');
console.log('MINIO_ENDPOINT:', process.env.MINIO_ENDPOINT);
console.log('MINIO_PORT:', process.env.MINIO_PORT);
console.log('MINIO_ACCESS_KEY:', process.env.MINIO_ACCESS_KEY);
console.log('MINIO_SECRET_KEY:', process.env.MINIO_SECRET_KEY);
console.log('MINIO_PUBLIC_HOST:', process.env.MINIO_PUBLIC_HOST);

// Ensure we have the correct credentials
const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const secretKey = process.env.MINIO_SECRET_KEY || 'miniosecretkey';
const endPoint = process.env.MINIO_ENDPOINT || 'localhost';
const port = parseInt(process.env.MINIO_PORT || '9000', 10);

// Create MinIO client with explicit configuration
const minioConfig = {
  endPoint: endPoint,
  port: port,
  useSSL: false,
  accessKey: accessKey,
  secretKey: secretKey
};

console.log('=== MinIO Client Config ===');
console.log('endPoint:', minioConfig.endPoint);
console.log('port:', minioConfig.port);
console.log('accessKey:', minioConfig.accessKey);
console.log('secretKey:', minioConfig.secretKey);

let minioClient = null;

// Initialize MinIO client with retry logic
async function initializeMinioClient() {
  try {
    console.log('=== Initializing MinIO Client ===');
    minioClient = new Minio.Client(minioConfig);
    
    // Test the connection
    const bucketExists = await minioClient.bucketExists('uploads');
    console.log('=== MinIO Connection Test ===');
    console.log('Connection successful:', bucketExists ? 'Bucket exists' : 'Bucket does not exist');
    
    if (!bucketExists) {
      console.log('Creating uploads bucket...');
      await minioClient.makeBucket('uploads');
      console.log('Uploads bucket created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('=== MinIO Connection Error ===');
    console.error('Error connecting to MinIO:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

// Initialize on startup
initializeMinioClient().then(success => {
  if (success) {
    console.log('MinIO client initialized successfully');
  } else {
    console.error('Failed to initialize MinIO client');
  }
});

// Helper function to convert internal MinIO URLs to public URLs
function convertToPublicUrl(internalUrl, req = null) {
  if (!internalUrl) return internalUrl;
  
  // Get the internal MinIO hostname and port
  const internalHost = `http://${endPoint}:${port}`;
  
  // Determine the public host
  let publicHost;
  if (req) {
    // Use the request's protocol and host, but replace the port with MinIO port
    const protocol = req.protocol; // 'http' or 'https'
    const host = req.headers.host; // e.g., 'localhost:3000' or 'yourdomain.com'
    const hostWithoutPort = host.replace(/:\d+$/, ''); // Remove port from host
    publicHost = `${protocol}://${hostWithoutPort}:9000`;
  } else {
    // Fallback to environment variable or default
    publicHost = `http://${process.env.MINIO_PUBLIC_HOST || 'localhost'}:9000`;
  }
  
  console.log('=== URL Conversion Debug ===');
  console.log('Internal URL:', internalUrl);
  console.log('Internal Host:', internalHost);
  console.log('Public Host:', publicHost);
  
  // Replace internal hostname with public hostname
  const publicUrl = internalUrl.replace(internalHost, publicHost);
  console.log('Public URL:', publicUrl);
  
  return publicUrl;
}

// Helper function to generate presigned URL with public hostname
async function generatePublicPresignedUrl(bucket, objectName, expirySeconds = 3600, req = null) {
  try {
    // Ensure MinIO client is initialized
    if (!minioClient) {
      console.log('MinIO client not initialized, attempting to initialize...');
      const initialized = await initializeMinioClient();
      if (!initialized) {
        throw new Error('Failed to initialize MinIO client');
      }
    }
    
    console.log('=== Generating Presigned URL ===');
    console.log('Bucket:', bucket);
    console.log('Object:', objectName);
    console.log('Expiry:', expirySeconds);
    console.log('Using credentials - AccessKey:', accessKey, 'SecretKey:', secretKey);
    
    const internalUrl = await minioClient.presignedGetObject(bucket, objectName, expirySeconds);
    console.log('Internal presigned URL:', internalUrl);
    
    const publicUrl = convertToPublicUrl(internalUrl, req);
    console.log('Public presigned URL:', publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}

// Get MinIO client (with initialization check)
function getMinioClient() {
  if (!minioClient) {
    console.warn('MinIO client not initialized, creating new instance...');
    minioClient = new Minio.Client(minioConfig);
  }
  return minioClient;
}

module.exports = { 
  getMinioClient, 
  convertToPublicUrl, 
  generatePublicPresignedUrl, 
  initializeMinioClient 
};