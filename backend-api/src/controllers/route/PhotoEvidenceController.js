const PhotoEvidence = require('../../models/route/PhotoEvidence');
const Tickets = require('../../models/ticket-logic/Tickets');
const { getMinioClient, STORAGE_BUCKET, STORAGE_DRIVER } = require('../../config/minio');
const path = require('path');
const exif = require('exif-parser');

function parseExifDate(exifValue) {
  if (!exifValue) return null;
  if (typeof exifValue === 'number') {
    return new Date(exifValue * 1000).toISOString();
  }
  if (typeof exifValue === 'string') {
    const match = exifValue.match(/^([0-9]{4}):([0-9]{2}):([0-9]{2}) ([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.(\d+))?$/);
    if (match) {
      const [ , year, month, day, hour, min, sec, ms ] = match;
      return new Date(
        Date.UTC(
          parseInt(year), parseInt(month) - 1, parseInt(day),
          parseInt(hour), parseInt(min), parseInt(sec),
          ms ? parseInt(ms) : 0
        )
      ).toISOString();
    }
  }
  return null;
}

function buildPublicBaseUrl(req) {
  const envHost = process.env.MINIO_PUBLIC_HOST;
  if (envHost && envHost.trim()) {
    return envHost.startsWith('http') ? envHost : `http://${envHost}`;
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  return `${proto}://${host}`;
}

function buildPublicBaseUrl(req) {
  const envHost = process.env.MINIO_PUBLIC_HOST;
  if (envHost && envHost.trim()) {
    return envHost.startsWith('http') ? envHost : `http://${envHost}`;
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  return `${proto}://${host}`;
}

function buildApiBaseUrl(req) {
  // Always prefer the request host for API URLs; do not use MINIO_PUBLIC_HOST here
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  return `${proto}://${host}`;
}

const PhotoEvidenceController = {
  async createPhotoEvidence(req, res) {
    try {
      const minioClient = getMinioClient();
      const bucket = STORAGE_BUCKET;
      const folder = 'photo-evidence';
  
      // Cambia aquí: usa req.files (array)
      const files = req.files;
      if (!files || !files.length) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
  
      // Procesa cada archivo
      const evidences = [];
      for (const file of files) {
        const originalName = file.originalname;
        const timestamp = Date.now();
        // Sanitize filename to avoid spaces and unsafe characters in object keys/URLs
        const ext = path.extname(originalName).toLowerCase();
        const base = path.basename(originalName, ext);
        const safeBase = base
          .replace(/[^a-zA-Z0-9._-]+/g, '_')
          .replace(/_+/g, '_')
          .slice(0, 100);
        const safeName = `${safeBase}${ext}`;
        // For S3, prepend 'uploads/' prefix since files are stored in uploads/ folder
        const objectName = STORAGE_DRIVER === 's3' 
          ? `uploads/${folder}/${timestamp}-${safeName}`
          : `${folder}/${timestamp}-${safeName}`;
  
        // Verificar bucket (puedes mover esto fuera del loop si quieres)
        let bucketExists = false;
        try {
          bucketExists = await minioClient.bucketExists(bucket);
        } catch (err) {
          console.warn(`Error checking bucket existence: ${err.message}`);
        }
        if (!bucketExists) {
          await minioClient.makeBucket(bucket);
          await minioClient.setBucketPolicy(bucket, JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:GetObject"],
                Resource: [`arn:aws:s3:::${bucket}/*`]
              }
            ]
          }));
        }
  
        // Subir archivo
        await minioClient.putObject(bucket, objectName, file.buffer);
  
        // Construir URL pública usando env o el host de la request
        const minioPublicPrefix = process.env.MINIO_PUBLIC_PREFIX || '/minio';
        const baseUrl = buildPublicBaseUrl(req);
        // Ensure objectName doesn't have trailing slash before encoding
        const cleanObjectName = objectName.replace(/\/$/, '');
        const encodedObjectName = cleanObjectName
          .split('/')
          .map((segment) => encodeURIComponent(segment))
          .join('/');
        const fileUrl = `${baseUrl}${minioPublicPrefix}/${bucket}/${encodedObjectName}`;
  
        // Extraer EXIF (opcional)
        let latitude = req.body.latitude;
        let longitude = req.body.longitude;
        let name = req.body.name;
        let date = req.body.date;
  
        try {
          const parser = exif.create(file.buffer);
          const result = parser.parse();
  
          if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
            latitude = result.tags.GPSLatitude;
            longitude = result.tags.GPSLongitude;
          }
          if (result.tags.ImageDescription) {
            name = result.tags.ImageDescription;
          }
          const exifDate = parseExifDate(result.tags.DateTimeOriginal) || parseExifDate(result.tags.CreateDate);
          if (exifDate) {
            date = exifDate;
          }
        } catch (exifErr) {
          console.warn('No EXIF data or failed to parse:', exifErr.message);
        }
  
        const { ticketStatusId, ticketId, photo, comment, createdBy, updatedBy } = req.body;
  
        // Guardar en base de datos
        const newPhotoEvidence = await PhotoEvidence.create(
          ticketStatusId,
          ticketId,
          name,
          latitude,
          longitude,
          photo,
          date,
          comment,
          fileUrl,
          createdBy,
          updatedBy
        );
  
        evidences.push(newPhotoEvidence);
      }
  
      res.status(201).json(evidences);
    } catch (error) {
      console.error('Error creating PhotoEvidence:', error);
      res.status(500).json({ message: 'Error creating PhotoEvidence', error: error.message });
    }
  },


  async getPhotoEvidenceById(req, res) {
    try {
      const { photoId } = req.params;
      const photoEvidence = await PhotoEvidence.findById(photoId);
      if (!photoEvidence) {
        return res.status(404).json({ message: 'PhotoEvidence not found' });
      }
      const apiBase = buildApiBaseUrl(req);
      res.status(200).json({
        ...photoEvidence,
        fileUrl: `${apiBase}/api/photoevidence/${photoId}/file`
      });
    } catch (error) {
      console.error('Error fetching PhotoEvidence by ID:', error);
      res.status(500).json({ message: 'Error fetching PhotoEvidence', error: error.message });
    }
  },

  async getAllPhotoEvidence(req, res) {
    try {
      const allPhotoEvidence = await PhotoEvidence.findAll();
      const apiBase = buildApiBaseUrl(req);
      const withUrls = allPhotoEvidence.map(p => ({
        ...p,
        fileUrl: `${apiBase}/api/photoevidence/${p.photoid || p.photoId}/file`
      }));
      res.status(200).json(withUrls);
    } catch (error) {
      console.error('Error fetching all PhotoEvidence:', error);
      res.status(500).json({ message: 'Error fetching PhotoEvidence', error: error.message });
    }
  },

  async updatePhotoEvidence(req, res) {
    try {
      const { photoId } = req.params;
      let { ticketStatusId, ticketId, name, latitude, longitude, photo, comment, updatedBy } = req.body;
      let fileUrl = req.body.photoURL;
      let date = req.body.date;

      // If a new file is uploaded, save to MinIO and extract EXIF
        if (req.file) {
          const minioClient = getMinioClient();
          const bucket = STORAGE_BUCKET;
          const folder = 'photo-evidence';
        const originalName = req.file.originalname;
        const timestamp = Date.now();
        const ext = path.extname(originalName).toLowerCase();
        const base = path.basename(originalName, ext);
        const safeBase = base
          .replace(/[^a-zA-Z0-9._-]+/g, '_')
          .replace(/_+/g, '_')
          .slice(0, 100);
        const safeName = `${safeBase}${ext}`;
        // For S3, prepend 'uploads/' prefix since files are stored in uploads/ folder
        const objectName = STORAGE_DRIVER === 's3' 
          ? `uploads/${folder}/${timestamp}-${safeName}`
          : `${folder}/${timestamp}-${safeName}`;

        // Ensure bucket exists
        const bucketExists = await minioClient.bucketExists(bucket).catch(() => false);
        if (!bucketExists) {
          await minioClient.makeBucket(bucket);
        }
        await minioClient.putObject(bucket, objectName, req.file.buffer);
        // Construir URL pública usando env o el host de la request
        const minioPublicPrefix = process.env.MINIO_PUBLIC_PREFIX || '/minio';
        const baseUrl = buildPublicBaseUrl(req);
        // Ensure objectName doesn't have trailing slash before encoding
        const cleanObjectName = objectName.replace(/\/$/, '');
        const encodedObjectName = cleanObjectName
          .split('/')
          .map((segment) => encodeURIComponent(segment))
          .join('/');
        fileUrl = `${baseUrl}${minioPublicPrefix}/${bucket}/${encodedObjectName}`;

        // Extract EXIF metadata
        try {
          const parser = exif.create(req.file.buffer);
          const result = parser.parse();
          if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
            latitude = result.tags.GPSLatitude;
            longitude = result.tags.GPSLongitude;
          }
          if (result.tags.ImageDescription) {
            name = result.tags.ImageDescription;
          }
          let exifDate = parseExifDate(result.tags.DateTimeOriginal) || parseExifDate(result.tags.CreateDate);
          if (exifDate) {
            date = exifDate;
          }
        } catch (exifErr) {
          console.warn('No EXIF data or failed to parse:', exifErr.message);
        }
      }

      const updatedPhotoEvidence = await PhotoEvidence.update(photoId, ticketStatusId, ticketId, name, latitude, longitude, photo, date, comment, fileUrl, updatedBy);
      if (!updatedPhotoEvidence) {
        return res.status(404).json({ message: 'PhotoEvidence not found' });
      }
      res.status(200).json(updatedPhotoEvidence);
    } catch (error) {
      console.error('Error updating PhotoEvidence:', error);
      res.status(500).json({ message: 'Error updating PhotoEvidence', error: error.message });
    }
  },

  async deletePhotoEvidence(req, res) {
    try {
      const { photoId } = req.params;
      const deletedPhotoEvidence = await PhotoEvidence.delete(photoId);
      if (!deletedPhotoEvidence) {
        return res.status(404).json({ message: 'PhotoEvidence not found' });
      }
      res.status(200).json({ message: 'PhotoEvidence deleted successfully' });
    } catch (error) {
      console.error('Error deleting PhotoEvidence:', error);
      res.status(500).json({ message: 'Error deleting PhotoEvidence', error: error.message });
    }
  },
  async getPhotoEvidenceByTicketId(req, res) {
    try {
      const { ticketId } = req.params;
      const photos = await PhotoEvidence.findByTicketId(ticketId);
      const apiBase = buildApiBaseUrl(req);
      const withUrls = photos.map(p => ({
        ...p,
        fileUrl: `${apiBase}/api/photoevidence/${p.photoid || p.photoId}/file`
      }));
      res.status(200).json(withUrls);
    } catch (error) {
      console.error('Error fetching PhotoEvidence by ticketId:', error);
      res.status(500).json({ message: 'Error fetching PhotoEvidence by ticketId', error: error.message });
    }
  },
  async getPhotoFilesBatch(req, res) {
    try {
      const { photoIds } = req.body || {};
      const asZip = String(req.query.zip || '').toLowerCase() === 'true';

      if (!Array.isArray(photoIds) || photoIds.length === 0) {
        return res.status(400).json({ message: 'photoIds must be a non-empty array' });
      }

      if (asZip) {
        // No ZIP library present; return 501 to indicate not implemented
        return res.status(501).json({ message: 'ZIP mode not implemented on server' });
      }

      // Fetch rows and map by id for quick lookup
      const rows = await PhotoEvidence.findByIds(photoIds);
      const idToRow = new Map(rows.map(r => [r.photoid || r.photoId, r]));
      const apiBase = buildApiBaseUrl(req);

      const results = photoIds.map(id => {
        const row = idToRow.get(id);
        if (!row) {
          return { photoId: id, exists: false, error: 'PhotoEvidence not found' };
        }
        const url = `${apiBase}/api/photoevidence/${id}/file`;
        return { photoId: id, exists: true, url };
      });

      const notFoundIds = results.filter(r => !r.exists).map(r => r.photoId);

      return res.status(200).json({ results, notFoundIds });
    } catch (error) {
      console.error('Error in getPhotoFilesBatch:', error);
      return res.status(500).json({ message: 'Error retrieving photo files', error: error.message });
    }
  },
  async downloadPhotoFile(req, res) {
    try {
      const { photoId } = req.params;
      
      // Buscar el registro en la base de datos
      const photoEvidence = await PhotoEvidence.findById(photoId);
      if (!photoEvidence) {
        return res.status(404).json({ message: 'PhotoEvidence not found' });
      }
  
      if (!photoEvidence.photourl) {
        return res.status(404).json({ message: 'No photo URL found' });
      }
  
      const minioClient = getMinioClient();
      const bucket = STORAGE_BUCKET;
  
      // Extraer objectName de la URL de manera más robusta
      // Supports both MinIO URLs (http://host:port/bucket/key) and S3 URLs (https://bucket.s3.region.amazonaws.com/key)
      let objectName;
      
      console.log('🔍 [URL PARSING] Starting URL parsing:');
      console.log('  Original Photo URL:', photoEvidence.photourl);
      console.log('  URL Type Check:', {
        includesS3: photoEvidence.photourl.includes('s3.amazonaws.com') || photoEvidence.photourl.includes('amazonaws.com'),
        includesMinio: photoEvidence.photourl.includes('minio') || photoEvidence.photourl.includes('christba.com'),
        isHttp: photoEvidence.photourl.startsWith('http://'),
        isHttps: photoEvidence.photourl.startsWith('https://')
      });
      
      try {
        const url = new URL(photoEvidence.photourl);
        
        console.log('🔍 [URL PARSING] Parsed URL:');
        console.log('  Protocol:', url.protocol);
        console.log('  Hostname:', url.hostname);
        console.log('  Pathname:', url.pathname);
        console.log('  Full URL:', url.href);
        
        // Check if it's an S3 URL (bucket.s3.region.amazonaws.com or s3.amazonaws.com/bucket/key)
        if (url.hostname.includes('s3.amazonaws.com') || url.hostname.includes('amazonaws.com')) {
          console.log('📌 [URL PARSING] Detected S3 URL format');
          // S3 URL format: https://bucket.s3.region.amazonaws.com/key or https://s3.region.amazonaws.com/bucket/key
          // Extract bucket name from hostname if present (format: bucket.s3.region.amazonaws.com)
          const hostParts = url.hostname.split('.');
          let s3BucketFromHost = null;
          
          // Check if bucket is in hostname (bucket.s3.region.amazonaws.com)
          if (hostParts.length >= 4 && hostParts[1] === 's3') {
            s3BucketFromHost = hostParts[0];
            console.log('  Bucket from hostname:', s3BucketFromHost);
          }
          
          const pathParts = url.pathname.split('/').filter(p => p);
          console.log('  Path parts:', pathParts);
          
          // If bucket is in hostname, pathname is the object key
          if (s3BucketFromHost) {
            objectName = decodeURIComponent(url.pathname.substring(1)); // Remove leading /
            console.log('  Object name (from pathname):', objectName);
          } else if (pathParts.length > 0) {
            // Bucket might be first part of pathname (format: s3.region.amazonaws.com/bucket/key)
            // Check if first part matches our bucket name
            if (pathParts[0] === STORAGE_BUCKET || pathParts[0] === 'uploads') {
              objectName = decodeURIComponent(pathParts.slice(1).join('/'));
              console.log('  Object name (bucket in path):', objectName);
            } else {
              // Assume bucket is first part, rest is key
              objectName = decodeURIComponent(pathParts.slice(1).join('/'));
              console.log('  Object name (assumed bucket in path):', objectName);
            }
          }
          
          // If objectName is still empty, try to extract from pathname directly
          if (!objectName || objectName.length === 0) {
            objectName = decodeURIComponent(url.pathname.substring(1));
            console.log('  Object name (fallback from pathname):', objectName);
          }
        } else {
          console.log('📌 [URL PARSING] Detected MinIO URL format');
          // MinIO URL format: http://host:port/bucket/key or http://host/minio/bucket/key
          const pathParts = url.pathname.split('/').filter(p => p);
          console.log('  Path parts:', pathParts);
          
          // Remove 'minio' prefix if present (e.g., /minio/uploads/photo-evidence/...)
          const minioIndex = pathParts.findIndex(part => part === 'minio');
          if (minioIndex !== -1) {
            console.log('  Found "minio" at index:', minioIndex);
            pathParts.splice(minioIndex, 1); // Remove 'minio' from path
            console.log('  Path parts after removing minio:', pathParts);
          }
          
          const bucketIndex = pathParts.findIndex(part => part === STORAGE_BUCKET || part === 'uploads');
          console.log('  Bucket index:', bucketIndex, 'STORAGE_BUCKET:', STORAGE_BUCKET);
          
          if (bucketIndex === -1) {
            console.error('❌ [URL PARSING] Bucket not found in path');
            console.error('  Path parts:', pathParts);
            console.error('  Looking for:', STORAGE_BUCKET, 'or', 'uploads');
            return res.status(400).json({ 
              message: `Invalid photo URL format: bucket "${STORAGE_BUCKET}" not found`,
              debug: {
                pathParts,
                storageBucket: STORAGE_BUCKET,
                originalUrl: photoEvidence.photourl
              }
            });
          }
          
          objectName = decodeURIComponent(pathParts.slice(bucketIndex + 1).join('/'));
          console.log('  Object name (MinIO format):', objectName);
        }
        
        // If objectName is still empty or invalid, try fallback
        if (!objectName || objectName.length === 0) {
          console.error('❌ [URL PARSING] Could not extract object name from URL');
          throw new Error('Could not extract object name from URL');
        }
        
        console.log('✅ [URL PARSING] Final object name:', objectName);
      } catch (urlError) {
        // Fallback: try to extract from URL string directly
        console.warn('Error parsing URL, trying fallback:', urlError.message);
        console.warn('Photo URL:', photoEvidence.photourl);
        
        // Check if photourl might be just the object key (without URL)
        if (!photoEvidence.photourl.includes('://') && !photoEvidence.photourl.startsWith('http')) {
          // It's likely just the object key
          objectName = photoEvidence.photourl;
          console.log('Treating photourl as object key:', objectName);
        } else {
          // Try parsing as URL string
          const urlParts = photoEvidence.photourl.split('/');
          const bucketIndex = urlParts.findIndex(part => part === STORAGE_BUCKET || part === 'uploads');
          
          if (bucketIndex === -1) {
            // Try S3 format: look for bucket name or key pattern
            const s3Match = photoEvidence.photourl.match(/s3[.\-]([^.]+)\.amazonaws\.com\/(.+)$/);
            if (s3Match) {
              objectName = decodeURIComponent(s3Match[2]);
            } else {
              // Last resort: if photourl looks like it might be just the key after some prefix
              if (photoEvidence.photourl.includes('photo-evidence')) {
                // Try to extract photo-evidence/... part
                const match = photoEvidence.photourl.match(/photo-evidence\/.+$/);
                if (match) {
                  objectName = match[0];
                } else {
                  return res.status(400).json({ 
                    message: 'Invalid photo URL format: could not extract object name',
                    url: photoEvidence.photourl 
                  });
                }
              } else {
                return res.status(400).json({ 
                  message: 'Invalid photo URL format: could not extract object name',
                  url: photoEvidence.photourl 
                });
              }
            }
          } else {
            objectName = decodeURIComponent(urlParts.slice(bucketIndex + 1).join('/'));
          }
        }
      }
      
      // Final validation and ensure uploads/ prefix for S3
      if (!objectName || objectName.length === 0) {
        return res.status(400).json({ 
          message: 'Could not determine object name from photo URL',
          url: photoEvidence.photourl 
        });
      }
      
      // Remove trailing slash if present (S3 objects don't have trailing slashes)
      objectName = objectName.replace(/\/$/, '');
      
      // For S3 storage, ensure objectName has 'uploads/' prefix if it doesn't already
      if (STORAGE_DRIVER === 's3' && !objectName.startsWith('uploads/')) {
        // Check if it starts with a folder name that should be inside uploads/
        if (objectName.startsWith('photo-evidence/') || objectName.startsWith('rtr/') || objectName.startsWith('unified/')) {
          objectName = `uploads/${objectName}`;
          console.log('📝 Prepended uploads/ prefix for S3. New objectName:', objectName);
        }
      }
      
      // Remove trailing slash again after prefix adjustment
      objectName = objectName.replace(/\/$/, '');
  
      // Comprehensive logging for S3 debugging
      const logDetails = {
        photoId,
        bucket,
        objectName,
        originalPhotoUrl: photoEvidence.photourl,
        storageDriver: process.env.STORAGE_DRIVER || 'minio',
        awsRegion: process.env.AWS_REGION,
        awsBucketName: process.env.AWS_BUCKET_NAME,
        awsEndpoint: process.env.AWS_S3_ENDPOINT,
        hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        awsAccessKeyPrefix: process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'not set',
        timestamp: new Date().toISOString()
      };

      console.log('🔍 [S3 DEBUG] Downloading file from storage:');
      console.log('  Photo ID:', logDetails.photoId);
      console.log('  Bucket:', logDetails.bucket);
      console.log('  Object Name:', logDetails.objectName);
      console.log('  Original Photo URL:', logDetails.originalPhotoUrl);
      console.log('  Storage Driver:', logDetails.storageDriver);
      console.log('  AWS Region:', logDetails.awsRegion || 'not set');
      console.log('  AWS Bucket Name (env):', logDetails.awsBucketName || 'not set');
      console.log('  AWS Endpoint:', logDetails.awsEndpoint || 'not set');
      console.log('  AWS Access Key ID:', logDetails.awsAccessKeyPrefix);
      console.log('  Timestamp:', logDetails.timestamp);

      // Verificar que el objeto existe
      try {
        console.log('📡 [S3 DEBUG] Attempting statObject operation...');
        console.log('  Bucket:', bucket);
        console.log('  Object Name:', objectName);
        console.log('  Storage Driver:', logDetails.storageDriver);
        
        const statResult = await minioClient.statObject(bucket, objectName);
        
        console.log('✅ [S3 DEBUG] Object found in storage:');
        console.log('  Size:', statResult.size, 'bytes');
        console.log('  Content Type:', statResult.contentType);
        console.log('  Last Modified:', statResult.lastModified);
        console.log('  ETag:', statResult.etag);
        
        logDetails.statResult = {
          size: statResult.size,
          contentType: statResult.contentType,
          lastModified: statResult.lastModified,
          etag: statResult.etag
        };
        
        // If statObject found a file inside a folder prefix, update objectName
        if (statResult.actualKey) {
          console.log('📁 [S3 DEBUG] File was found inside folder prefix');
          console.log('  Original objectName:', objectName);
          console.log('  Actual key:', statResult.actualKey);
          objectName = statResult.actualKey;
          logDetails.actualKey = statResult.actualKey;
          logDetails.wasFolderPrefix = true;
        }
      } catch (statError) {
        console.error('❌ [S3 DEBUG] Object not found in storage:');
        console.error('  Error Message:', statError.message);
        console.error('  Error Code:', statError.code);
        console.error('  Status Code:', statError.statusCode);
        console.error('  Error Name:', statError.name);
        console.error('  Bucket:', bucket);
        console.error('  Object Name:', objectName);
        console.error('  Original Photo URL:', photoEvidence.photourl);
        console.error('  Storage Driver:', logDetails.storageDriver);
        console.error('  AWS Region:', logDetails.awsRegion);
        console.error('  Stack Trace:', statError.stack);
        
        logDetails.error = {
          message: statError.message,
          code: statError.code,
          statusCode: statError.statusCode,
          name: statError.name,
          stack: statError.stack
        };
        
        // Handle S3-specific errors
        if (statError.code === 'Forbidden' || statError.statusCode === 403) {
          return res.status(403).json({ 
            message: 'Access denied to photo file in storage',
            debug: logDetails,
            suggestion: 'Verify AWS credentials have read permissions for bucket: ' + bucket
          });
        }
        
        return res.status(404).json({ 
          message: 'Photo file not found in storage',
          debug: logDetails
        });
      }
  
      // Descargar el archivo
      try {
        console.log('📥 [S3 DEBUG] Attempting getObject operation...');
        console.log('  Bucket:', bucket);
        console.log('  Object Name:', objectName);
        console.log('  Storage Driver:', logDetails.storageDriver);
        
        const dataStream = minioClient.getObject(bucket, objectName);
        
        console.log('✅ [S3 DEBUG] Stream created successfully');
        
        // Set response headers
        res.setHeader('Content-Type', logDetails.statResult?.contentType || 'application/octet-stream');
        res.setHeader('Content-Length', logDetails.statResult?.size || '');
        res.setHeader('X-Photo-ID', photoId);
        res.setHeader('X-Bucket', bucket);
        res.setHeader('X-Object-Name', objectName);
        res.setHeader('X-Storage-Driver', logDetails.storageDriver);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Pipe the stream to response
        dataStream.pipe(res);
        
        dataStream.on('error', (streamError) => {
          console.error('❌ [S3 DEBUG] Stream error:');
          console.error('  Error:', streamError.message);
          console.error('  Code:', streamError.code);
          console.error('  Bucket:', bucket);
          console.error('  Object Name:', objectName);
          
          if (!res.headersSent) {
            res.status(500).json({
              message: 'Error streaming file from storage',
              debug: {
                ...logDetails,
                streamError: {
                  message: streamError.message,
                  code: streamError.code
                }
              }
            });
          }
        });
        
        dataStream.on('end', () => {
          console.log('✅ [S3 DEBUG] Stream completed successfully');
        });
        
        return; // Don't send response again
      } catch (streamError) {
        console.error('❌ [S3 DEBUG] Error creating stream:');
        console.error('  Error:', streamError.message);
        console.error('  Code:', streamError.code);
        console.error('  Stack:', streamError.stack);
        
        return res.status(500).json({
          message: 'Error accessing file stream',
          debug: {
            ...logDetails,
            streamError: {
              message: streamError.message,
              code: streamError.code
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ [S3 DEBUG] Unexpected error in downloadPhotoFile:');
      console.error('  Photo ID:', photoId);
      console.error('  Error:', error.message);
      console.error('  Stack:', error.stack);
      return res.status(500).json({
        message: 'Unexpected error downloading file',
        debug: {
          error: {
            message: error.message,
            stack: error.stack
          }
        }
      });
    }
  },
};

module.exports = PhotoEvidenceController; 