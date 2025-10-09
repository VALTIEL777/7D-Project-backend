const PhotoEvidence = require('../../models/route/PhotoEvidence');
const Tickets = require('../../models/ticket-logic/Tickets');
const { getMinioClient } = require('../../config/minio');  // <-- Cambio aquí
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
      const bucket = 'uploads';
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
        const objectName = `${folder}/${timestamp}-${originalName}`;
  
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
        const fileUrl = `${baseUrl}${minioPublicPrefix}/${bucket}/${objectName}`;
  
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
        const bucket = 'uploads';
        const folder = 'photo-evidence';
        const originalName = req.file.originalname;
        const timestamp = Date.now();
        const ext = path.extname(originalName);
        const objectName = `${folder}/${timestamp}-${originalName}`;

        // Ensure bucket exists
        const bucketExists = await minioClient.bucketExists(bucket).catch(() => false);
        if (!bucketExists) {
          await minioClient.makeBucket(bucket);
        }
        await minioClient.putObject(bucket, objectName, req.file.buffer);
        // Construir URL pública usando env o el host de la request
        const minioPublicPrefix = process.env.MINIO_PUBLIC_PREFIX || '/minio';
        const baseUrl = buildPublicBaseUrl(req);
        fileUrl = `${baseUrl}${minioPublicPrefix}/${bucket}/${objectName}`;

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
      const bucket = 'uploads';
  
      // Extraer objectName de la URL de manera más robusta
      let objectName;
      try {
        const url = new URL(photoEvidence.photourl);
        const pathParts = url.pathname.split('/');
        const uploadsIndex = pathParts.findIndex(part => part === 'uploads');
        
        if (uploadsIndex === -1) {
          return res.status(400).json({ message: 'Invalid photo URL format' });
        }
        
        objectName = pathParts.slice(uploadsIndex + 1).join('/');
      } catch (urlError) {
        // Fallback para URLs malformadas
        const urlParts = photoEvidence.photourl.split('/');
        const uploadsIndex = urlParts.findIndex(part => part === 'uploads');
        
        if (uploadsIndex === -1) {
          return res.status(400).json({ message: 'Invalid photo URL format' });
        }
        
        objectName = urlParts.slice(uploadsIndex + 1).join('/');
      }
  
      console.log('🔍 Downloading file from MinIO:');
      console.log('  Bucket:', bucket);
      console.log('  Object Name:', objectName);
      console.log('  Original URL:', photoEvidence.photourl);
  
      // Verificar que el objeto existe
      try {
        await minioClient.statObject(bucket, objectName);
      } catch (statError) {
        console.error('❌ Object not found in MinIO:', statError);
        return res.status(404).json({ message: 'Photo file not found in storage' });
      }
  
      // Descargar el archivo
      const dataStream = await minioClient.getObject(bucket, objectName);
      
      // Configurar headers
      const ext = path.extname(objectName).toLowerCase();
      const contentTypeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.heic': 'image/heic',
        '.heif': 'image/heif'
      };
      
      const contentType = contentTypeMap[ext] || 'image/jpeg';
  
      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  
      // Pipe el stream directamente a la respuesta (más eficiente)
      dataStream.pipe(res);
  
    } catch (error) {
      console.error('❌ Error in downloadPhotoFile:', error);
      res.status(500).json({ 
        message: 'Error downloading photo file', 
        error: error.message 
      });
    }
  },
};

module.exports = PhotoEvidenceController; 