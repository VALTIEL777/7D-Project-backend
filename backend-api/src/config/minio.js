// Check if AWS SDK is available (optional for S3 support)
let AWS;
try {
  AWS = require('aws-sdk');
} catch (err) {
  console.warn('aws-sdk not installed. S3 driver will not be available.');
}

const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'minio'; // 'minio' or 's3'

// ============================
// 📦 BUCKET CONFIGURATION
// ============================
// Use AWS_BUCKET_NAME for S3, default to 'uploads' for MinIO
const STORAGE_BUCKET = STORAGE_DRIVER === 's3' 
  ? (process.env.AWS_BUCKET_NAME || 'uploads')
  : 'uploads';

console.log('=== Storage Bucket Configuration ===');
console.log('STORAGE_BUCKET:', STORAGE_BUCKET);

// Only require Minio if we're using MinIO storage
let Minio;
if (STORAGE_DRIVER !== 's3') {
  Minio = require('minio');
}

// ============================
// 🧠 MINIO CONFIGURATION
// ============================
// Only create MinIO config if we're actually using MinIO
const minioConfig = STORAGE_DRIVER !== 's3' ? {
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'miniosecretkey',
} : null;

// ============================
// ☁️ AWS S3 CONFIGURATION
// ============================
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_S3_ENDPOINT || 'https://s3.amazonaws.com',
};

// Debug: Log the environment variables being used
console.log('=== Storage Configuration Debug ===');
console.log('STORAGE_DRIVER:', STORAGE_DRIVER);
console.log('MINIO_ENDPOINT:', process.env.MINIO_ENDPOINT);
console.log('MINIO_PORT:', process.env.MINIO_PORT);
console.log('MINIO_ACCESS_KEY:', process.env.MINIO_ACCESS_KEY);
console.log('MINIO_SECRET_KEY:', process.env.MINIO_SECRET_KEY);
console.log('MINIO_PUBLIC_HOST:', process.env.MINIO_PUBLIC_HOST);

// ============================
// 🧩 Initialize the Correct Client
// ============================
let storageClient;
let minioClient; // Keep for backward compatibility

if (STORAGE_DRIVER === 's3') {
  if (!AWS) {
    throw new Error('AWS SDK is required for S3 storage driver. Please install: npm install aws-sdk');
  }
  console.log('🚀 Using AWS S3 Storage');
  storageClient = new AWS.S3({
    ...s3Config,
    signatureVersion: 'v4',
  });
  // Create a wrapper to maintain backward compatibility
  minioClient = createS3Adapter(storageClient);
} else {
  console.log('💾 Using MinIO Storage');
  if (!Minio) {
    throw new Error('MinIO library is required but not loaded. Please ensure STORAGE_DRIVER is set correctly.');
  }
  if (!minioConfig) {
    throw new Error('MinIO configuration is missing. Please set MINIO_ENDPOINT and other MinIO environment variables.');
  }
  storageClient = new Minio.Client(minioConfig);
  minioClient = storageClient; // Same instance for MinIO
}

console.log('=== Storage Client Config ===');
if (STORAGE_DRIVER === 's3') {
  console.log('region:', s3Config.region);
  console.log('endpoint:', s3Config.endpoint);
} else {
console.log('endPoint:', minioConfig.endPoint);
console.log('port:', minioConfig.port);
console.log('accessKey:', minioConfig.accessKey);
}

// ============================
// 🔄 S3 Adapter for Backward Compatibility
// ============================
// Creates an adapter that mimics MinIO's API for S3
function createS3Adapter(s3Client) {
  return {
    bucketExists: async (bucketName) => {
      try {
        await s3Client.headBucket({ Bucket: bucketName }).promise();
        return true;
      } catch (err) {
        if (err.code === 'NotFound' || err.statusCode === 404) {
          return false;
        }
        throw err;
      }
    },

    makeBucket: async (bucketName) => {
      try {
        await s3Client.createBucket({ Bucket: bucketName }).promise();
        return true;
      } catch (err) {
        if (err.code === 'BucketAlreadyOwnedByYou') {
          return true;
        }
        throw err;
      }
    },

    putObject: async (bucket, objectName, buffer, metaData = {}) => {
      // Remove trailing slash from objectName (S3 objects don't have trailing slashes)
      const cleanObjectName = objectName.replace(/\/$/, '');
      const params = {
        Bucket: bucket,
        Key: cleanObjectName,
        Body: buffer,
        ContentType: metaData['Content-Type'] || 'application/octet-stream',
      };
      await s3Client.putObject(params).promise();
    },

    getObject: (bucket, objectName, callback) => {
      // Remove trailing slash from objectName (S3 objects don't have trailing slashes)
      const cleanObjectName = objectName.replace(/\/$/, '');
      
      console.log('🔍 [S3 ADAPTER] getObject called:');
      console.log('  Bucket:', bucket);
      console.log('  Original Object Name:', objectName);
      console.log('  Cleaned Object Name:', cleanObjectName);
      
      // Helper function to check for folder prefix and get actual key
      const getActualKey = async (key) => {
        try {
          // First try to get the object directly
          await s3Client.headObject({ Bucket: bucket, Key: key }).promise();
          return key; // Object exists, return original key
        } catch (headErr) {
          // If NotFound, check if it's a folder prefix
          if (headErr.code === 'NotFound' || headErr.statusCode === 404) {
            try {
              console.log('🔍 [S3 ADAPTER] Object not found, checking if it\'s a folder prefix...');
              const folderPrefix = key + '/';
              
              const folderListParams = {
                Bucket: bucket,
                Prefix: folderPrefix,
                MaxKeys: 10
              };
              
              const folderListData = await s3Client.listObjectsV2(folderListParams).promise();
              
              if (folderListData.Contents && folderListData.Contents.length > 0) {
                const firstFile = folderListData.Contents[0];
                console.log('✅ [S3 ADAPTER] Found file in folder prefix, using:', firstFile.Key);
                return firstFile.Key;
              }
            } catch (folderErr) {
              console.warn('⚠️ [S3 ADAPTER] Error checking folder prefix:', folderErr.message);
            }
          }
          // If all else fails, return original key (will error later)
          return key;
        }
      };
      
      // Handle callback pattern
      if (callback) {
        getActualKey(cleanObjectName)
          .then(actualKey => {
            const stream = s3Client.getObject({ Bucket: bucket, Key: actualKey }).createReadStream();
            console.log('✅ [S3 ADAPTER] Stream created for:', actualKey);
            callback(null, stream);
          })
          .catch(err => {
            console.error('❌ [S3 ADAPTER] Error in getObject:', err.message);
            callback(err, null);
          });
        return;
      }
      
      // Promise pattern - return a promise that resolves to the stream
      return getActualKey(cleanObjectName)
        .then(actualKey => {
          const stream = s3Client.getObject({ Bucket: bucket, Key: actualKey }).createReadStream();
          console.log('✅ [S3 ADAPTER] Stream created for:', actualKey);
          return stream;
        })
        .catch(err => {
          console.error('❌ [S3 ADAPTER] Error in getObject:', err.message);
          throw err;
        });
    },

    statObject: async (bucket, objectName) => {
      // Remove trailing slash from objectName (S3 objects don't have trailing slashes)
      const cleanObjectName = objectName.replace(/\/$/, '');
      
      console.log('🔍 [S3 ADAPTER] statObject called:');
      console.log('  Bucket:', bucket);
      console.log('  Original Object Name:', objectName);
      console.log('  Cleaned Object Name:', cleanObjectName);
      
      const params = { Bucket: bucket, Key: cleanObjectName };
      
      try {
        console.log('📡 [S3 ADAPTER] Calling headObject with params:', JSON.stringify(params, null, 2));
        const data = await s3Client.headObject(params).promise();
        
        console.log('✅ [S3 ADAPTER] headObject successful');
        console.log('  ContentLength:', data.ContentLength);
        console.log('  ETag:', data.ETag);
        console.log('  LastModified:', data.LastModified);
        console.log('  ContentType:', data.ContentType);
        
        return {
          size: data.ContentLength,
          etag: data.ETag,
          lastModified: data.LastModified,
          contentType: data.ContentType,
        };
      } catch (err) {
        console.error('❌ [S3 ADAPTER] headObject failed:');
        console.error('  Error Code:', err.code);
        console.error('  Error Message:', err.message);
        console.error('  Status Code:', err.statusCode);
        console.error('  Request ID:', err.requestId);
        console.error('  Bucket:', bucket);
        console.error('  Key:', cleanObjectName);
        
        // Check if this might be a folder prefix (S3 folders show as PRE in listings)
        // Try listing with the object name as a prefix to see if it's a folder
        if (err.code === 'NotFound' || err.statusCode === 404) {
          try {
            console.log('🔍 [S3 ADAPTER] Checking if object is a folder prefix...');
            const folderPrefix = cleanObjectName + '/';
            console.log('  Checking folder prefix:', folderPrefix);
            
            const folderListParams = {
              Bucket: bucket,
              Prefix: folderPrefix,
              MaxKeys: 10,
              Delimiter: '/' // This helps identify folder structure
            };
            
            const folderListData = await s3Client.listObjectsV2(folderListParams).promise();
            
            // Check if this prefix exists as a folder
            if (folderListData.CommonPrefixes && folderListData.CommonPrefixes.length > 0) {
              console.log('📁 [S3 ADAPTER] Detected folder prefix! Common prefixes found:');
              folderListData.CommonPrefixes.forEach((prefix, idx) => {
                console.log(`  [${idx + 1}] ${prefix.Prefix}`);
              });
            }
            
            // Check for actual files inside the folder
            if (folderListData.Contents && folderListData.Contents.length > 0) {
              console.log('📄 [S3 ADAPTER] Found files inside folder prefix:');
              folderListData.Contents.forEach((obj, idx) => {
                console.log(`  [${idx + 1}] ${obj.Key} (${obj.Size} bytes)`);
              });
              
              // Use the first file found inside the folder
              const firstFile = folderListData.Contents[0];
              console.log('✅ [S3 ADAPTER] Using first file found in folder:', firstFile.Key);
              
              // Get metadata for the actual file
              const fileHeadParams = { Bucket: bucket, Key: firstFile.Key };
              const fileData = await s3Client.headObject(fileHeadParams).promise();
              
              console.log('✅ [S3 ADAPTER] Retrieved metadata from file inside folder');
              return {
                size: fileData.ContentLength,
                etag: fileData.ETag,
                lastModified: fileData.LastModified,
                contentType: fileData.ContentType,
                actualKey: firstFile.Key, // Store the actual key for later use
              };
            } else {
              console.log('⚠️ [S3 ADAPTER] Folder prefix exists but contains no files');
            }
          } catch (folderErr) {
            console.warn('⚠️ [S3 ADAPTER] Error checking folder prefix (non-critical):', folderErr.message);
          }
        }
        
        // Fallback: Try to list objects to see what's actually there
        try {
          console.log('🔍 [S3 ADAPTER] Attempting to list objects with prefix to debug...');
          const prefix = cleanObjectName.substring(0, cleanObjectName.lastIndexOf('/') + 1);
          console.log('  Prefix:', prefix);
          
          const listParams = {
            Bucket: bucket,
            Prefix: prefix,
            MaxKeys: 20
          };
          
          console.log('  List params:', JSON.stringify(listParams, null, 2));
          
          const listData = await s3Client.listObjectsV2(listParams).promise();
          console.log('📋 [S3 ADAPTER] ListObjectsV2 response:');
          console.log('  IsTruncated:', listData.IsTruncated);
          console.log('  KeyCount:', listData.KeyCount);
          console.log('  MaxKeys:', listData.MaxKeys);
          
          console.log('📋 [S3 ADAPTER] Found objects in prefix:');
          if (listData.Contents && listData.Contents.length > 0) {
            let exactMatchFound = false;
            let similarMatchFound = null;
            const filename = cleanObjectName.split('/').pop();
            
            listData.Contents.forEach((obj, idx) => {
              console.log(`  [${idx + 1}] ${obj.Key} (${obj.Size} bytes, modified: ${obj.LastModified})`);
              
              if (obj.Key === cleanObjectName) {
                exactMatchFound = true;
                console.log('    ✅ EXACT MATCH FOUND!');
              }
              
              // Check for similar filename
              if (!exactMatchFound && obj.Key.includes(filename)) {
                similarMatchFound = obj.Key;
                console.log(`    ⚠️  SIMILAR FILENAME FOUND: ${obj.Key}`);
              }
            });
            
            if (!exactMatchFound) {
              console.error('❌ [S3 ADAPTER] Exact match NOT found in listed objects');
              if (similarMatchFound) {
                console.error(`⚠️  But found similar: ${similarMatchFound}`);
                console.error(`    Expected: ${cleanObjectName}`);
                console.error(`    Actual:   ${similarMatchFound}`);
              } else {
                console.error('⚠️  No similar filename found either');
              }
              
              // Try to find the exact file with a different query
              console.log('🔍 [S3 ADAPTER] Trying to find exact file with direct query...');
              try {
                const directListParams = {
                  Bucket: bucket,
                  Prefix: cleanObjectName,
                  MaxKeys: 1
                };
                const directListData = await s3Client.listObjectsV2(directListParams).promise();
                if (directListData.Contents && directListData.Contents.length > 0) {
                  console.log('✅ [S3 ADAPTER] Found with direct prefix query:', directListData.Contents[0].Key);
                } else {
                  console.error('❌ [S3 ADAPTER] NOT found even with direct prefix query');
                }
              } catch (directErr) {
                console.error('❌ [S3 ADAPTER] Error with direct query:', directErr.message);
              }
            }
          } else {
            console.log('  ⚠️  No objects found with this prefix');
            console.log('  This might indicate:');
            console.log('    - Wrong bucket name');
            console.log('    - Wrong prefix');
            console.log('    - Permission issues');
          }
        } catch (listErr) {
          console.error('❌ [S3 ADAPTER] Could not list objects:');
          console.error('  Error:', listErr.message);
          console.error('  Code:', listErr.code);
          console.error('  Status Code:', listErr.statusCode);
          console.error('  This might indicate permission issues');
        }
        
        throw err;
      }
    },

    setBucketPolicy: async (bucketName, policy) => {
      const params = {
        Bucket: bucketName,
        Policy: typeof policy === 'string' ? policy : JSON.stringify(policy),
      };
      await s3Client.putBucketPolicy(params).promise();
    },

    listObjects: (bucket, prefix, recursive = false) => {
      const { EventEmitter } = require('events');
      const stream = new EventEmitter();
      
      const params = {
        Bucket: bucket,
        Prefix: prefix,
        Delimiter: recursive ? undefined : '/',
      };

      // Process asynchronously
      (async () => {
        try {
          let continuationToken;
          do {
            if (continuationToken) {
              params.ContinuationToken = continuationToken;
            }

            const data = await s3Client.listObjectsV2(params).promise();

            for (const item of data.Contents || []) {
              stream.emit('data', {
                name: item.Key,
                size: item.Size,
                lastModified: item.LastModified,
              });
            }

            continuationToken = data.NextContinuationToken;
          } while (continuationToken);
          
          stream.emit('end');
        } catch (err) {
          stream.emit('error', err);
        }
      })();

      return stream;
    },

    presignedGetObject: async (bucket, objectName, expirySeconds = 3600) => {
      // Remove trailing slash from objectName (S3 objects don't have trailing slashes)
      const cleanObjectName = objectName.replace(/\/$/, '');
      const params = {
        Bucket: bucket,
        Key: cleanObjectName,
        Expires: expirySeconds,
      };
      return s3Client.getSignedUrlPromise('getObject', params);
    },

    fPutObject: async (bucket, objectName, filePath, metaData = {}) => {
      // Remove trailing slash from objectName (S3 objects don't have trailing slashes)
      const cleanObjectName = objectName.replace(/\/$/, '');
      const fs = require('fs');
      const fileStream = fs.createReadStream(filePath);
      const params = {
        Bucket: bucket,
        Key: cleanObjectName,
        Body: fileStream,
        ContentType: metaData['Content-Type'] || 'application/octet-stream',
      };
      await s3Client.upload(params).promise();
    },
  };
}

// ============================
// 📦 Unified Functions
// ============================

// Create bucket if missing (MinIO only, S3 buckets are created automatically)
async function ensureBucket(bucketName) {
  if (STORAGE_DRIVER === 's3') {
    console.log(`S3 does not require manual bucket creation for: ${bucketName}`);
    // Check if bucket exists, create if not
    try {
      const exists = await storageClient.headBucket({ Bucket: bucketName }).promise().then(() => true).catch(() => false);
      if (!exists) {
        await storageClient.createBucket({ Bucket: bucketName }).promise();
        console.log(`✅ Created S3 bucket: ${bucketName}`);
      } else {
        console.log(`✅ S3 bucket already exists: ${bucketName}`);
      }
    } catch (err) {
      console.error('Error ensuring S3 bucket:', err.message);
    }
    return;
  }

  try {
    const exists = await storageClient.bucketExists(bucketName);
    if (!exists) {
      await storageClient.makeBucket(bucketName);
      console.log(`✅ Created bucket: ${bucketName}`);
    } else {
      console.log(`✅ Bucket already exists: ${bucketName}`);
    }
  } catch (err) {
    console.error('Error ensuring bucket:', err.message);
  }
}

// Upload file
async function uploadFile(bucket, key, filePath, contentType = 'application/octet-stream') {
  // Remove trailing slash from key (S3 objects don't have trailing slashes)
  const cleanKey = key.replace(/\/$/, '');
  
  if (STORAGE_DRIVER === 's3') {
    const fs = require('fs');
    const fileStream = fs.createReadStream(filePath);
    await storageClient
      .upload({
        Bucket: bucket,
        Key: cleanKey,
        Body: fileStream,
        ContentType: contentType,
      })
      .promise();
    // Return S3 URL format (without trailing slash)
    return `https://${bucket}.s3.${s3Config.region}.amazonaws.com/${cleanKey}`;
  } else {
    if (!minioConfig) {
      throw new Error('MinIO configuration is missing. Cannot upload file.');
    }
    await storageClient.fPutObject(bucket, cleanKey, filePath, { 'Content-Type': contentType });
    return `http://${minioConfig.endPoint}:${minioConfig.port}/${bucket}/${cleanKey}`;
  }
}

// Generate presigned URL
async function getPresignedUrl(bucket, key, expirySeconds = 3600) {
  // Remove trailing slash from key (S3 objects don't have trailing slashes)
  const cleanKey = key.replace(/\/$/, '');
  
  if (STORAGE_DRIVER === 's3') {
    const params = { Bucket: bucket, Key: cleanKey, Expires: expirySeconds };
    return storageClient.getSignedUrlPromise('getObject', params);
  } else {
    return storageClient.presignedGetObject(bucket, cleanKey, expirySeconds);
  }
}

// ============================
// ✅ Legacy Functions (Backward Compatibility)
// ============================

// Initialize storage client (formerly initializeMinioClient)
async function initializeMinioClient() {
  try {
    console.log(`=== Initializing ${STORAGE_DRIVER.toUpperCase()} Storage Client ===`);

    // (Re)create if something replaced it
    if (!storageClient) {
      if (STORAGE_DRIVER === 's3') {
        if (!AWS) {
          throw new Error('AWS SDK is required for S3 storage driver');
        }
        storageClient = new AWS.S3({
          ...s3Config,
          signatureVersion: 'v4',
        });
        minioClient = createS3Adapter(storageClient);
      } else {
        if (!Minio) {
          throw new Error('MinIO library is required but not loaded. Please ensure STORAGE_DRIVER is set correctly.');
        }
        if (!minioConfig) {
          throw new Error('MinIO configuration is missing. Please set MINIO_ENDPOINT and other MinIO environment variables.');
        }
        storageClient = new Minio.Client(minioConfig);
        minioClient = storageClient;
      }
    }

    const bucketName = STORAGE_BUCKET;
    const bucketExists = await minioClient.bucketExists(bucketName);
    console.log(`=== ${STORAGE_DRIVER.toUpperCase()} Connection Test ===`);
    console.log('Connection successful:', bucketExists ? 'Bucket exists' : 'Bucket does not exist');

    if (!bucketExists) {
      console.log(`Creating ${bucketName} bucket...`);
      await minioClient.makeBucket(bucketName);
      console.log(`${bucketName} bucket created successfully`);
    }

    // Set public read-only policy (MinIO only, S3 uses IAM policies)
    if (STORAGE_DRIVER === 'minio') {
    const publicPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Action: ["s3:GetObject"],
          Effect: "Allow",
          Principal: ["*"],
          Resource: [`arn:aws:s3:::${bucketName}/*`]
        }
      ]
    };
    try {
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(publicPolicy));
      console.log('Política pública asignada correctamente al bucket:', bucketName);
    } catch (err) {
      console.error('Error asignando política pública al bucket:', err.message);
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
