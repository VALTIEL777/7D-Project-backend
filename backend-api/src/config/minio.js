const Minio = require('minio');

// Debug: Log the environment variables being used
console.log('=== MinIO Configuration Debug ===');
console.log('MINIO_ENDPOINT:', process.env.MINIO_ENDPOINT);
console.log('MINIO_PORT:', process.env.MINIO_PORT);
console.log('MINIO_ACCESS_KEY:', process.env.MINIO_ACCESS_KEY);
console.log('MINIO_SECRET_KEY:', process.env.MINIO_SECRET_KEY);
console.log('MINIO_PUBLIC_HOST:', process.env.MINIO_PUBLIC_HOST);

// Credentials
const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const secretKey = process.env.MINIO_SECRET_KEY || 'miniosecretkey';
const endPoint = process.env.MINIO_ENDPOINT || 'localhost';
const port = parseInt(process.env.MINIO_PORT || '9000', 10);

// MinIO config
const minioConfig = {
  endPoint,
  port,
  useSSL: false,
  accessKey,
  secretKey,
};

console.log('=== MinIO Client Config ===');
console.log('endPoint:', minioConfig.endPoint);
console.log('port:', minioConfig.port);
console.log('accessKey:', minioConfig.accessKey);
console.log('secretKey:', minioConfig.secretKey);

let minioClient = new Minio.Client(minioConfig); // ✅ Crear una instancia por defecto

// ✅ Ensure initialization and retry logic
async function initializeMinioClient() {
  try {
    console.log('=== Initializing MinIO Client ===');

    // (Re)create if something replaced it
    if (!minioClient) {
      minioClient = new Minio.Client(minioConfig);
    }

    // Test bucket existence
    const bucketExists = await minioClient.bucketExists('uploads');
    console.log('=== MinIO Connection Test ===');
    console.log('Connection successful:', bucketExists ? 'Bucket exists' : 'Bucket does not exist');

    if (!bucketExists) {
      console.log('Creating uploads bucket...');
      await minioClient.makeBucket('uploads');
      console.log('Uploads bucket created successfully');
    }

    console.log('MinIO client initialized successfully');
    return true;
  } catch (error) {
    console.error('=== MinIO Connection Error ===');
    console.error('Error connecting to MinIO:', error.message);
    return false;
  }
}

// ✅ Convert to public URL (sin cambios)
function convertToPublicUrl(internalUrl, req = null) {
  if (!internalUrl) return internalUrl;

  const internalHost = `http://${endPoint}:${port}`;
  let publicHost;
  if (req) {
    const protocol = req.protocol;
    const hostWithoutPort = req.headers.host.replace(/:\d+$/, '');
    publicHost = `${protocol}://${hostWithoutPort}:9000`;
  } else {
    publicHost = `http://${process.env.MINIO_PUBLIC_HOST || 'localhost'}:9000`;
  }

  return internalUrl.replace(internalHost, publicHost);
}

// ✅ Generate presigned URL
async function generatePublicPresignedUrl(bucket, objectName, expirySeconds = 3600, req = null) {
  if (!minioClient) {
    console.log('MinIO client not initialized, attempting to initialize...');
    const initialized = await initializeMinioClient();
    if (!initialized) throw new Error('Failed to initialize MinIO client');
  }

  const internalUrl = await minioClient.presignedGetObject(bucket, objectName, expirySeconds);
  return convertToPublicUrl(internalUrl, req);
}

// ✅ Always return a valid instance
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
  initializeMinioClient,
};
