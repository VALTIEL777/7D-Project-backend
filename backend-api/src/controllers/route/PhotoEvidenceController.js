const PhotoEvidence = require('../../models/route/PhotoEvidence');
const NotificationService = require('../../services/NotificationService');
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

const PhotoEvidenceController = {
 async createPhotoEvidence(req, res) {
  try {
    const minioClient = getMinioClient(); // <-- Obtienes instancia válida

    const bucket = 'uploads';
    const folder = 'photo-evidence';
    const originalName = req.file.originalname;
    const timestamp = Date.now();
    const objectName = `${folder}/${timestamp}-${originalName}`;

    // Verificar bucket
    let bucketExists = false;
    try {
      bucketExists = await minioClient.bucketExists(bucket);
    } catch (err) {
      console.warn(`Error checking bucket existence: ${err.message}`);
    }

    if (!bucketExists) {
      console.log(`Bucket "${bucket}" does not exist. Creating...`);
      await minioClient.makeBucket(bucket);
    }

    // Subir archivo
    await minioClient.putObject(bucket, objectName, req.file.buffer);

    //const fileUrl = `http://${process.env.MINIO_ENDPOINT?.split(':')[0] || 'localhost'}:9000/${bucket}/${objectName}`;
    const minioHost = process.env.MINIO_ENDPOINT ? process.env.MINIO_ENDPOINT.split(':')[0] : 'localhost';
const fileUrl = `http://${minioHost === 'minio' ? 'localhost' : minioHost}:9000/${bucket}/${objectName}`;


    // Extraer EXIF (opcional)
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let name = req.body.name;
    let date = req.body.date;

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

    res.status(201).json(newPhotoEvidence);
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
      res.status(200).json(photoEvidence);
    } catch (error) {
      console.error('Error fetching PhotoEvidence by ID:', error);
      res.status(500).json({ message: 'Error fetching PhotoEvidence', error: error.message });
    }
  },

  async getAllPhotoEvidence(req, res) {
    try {
      const allPhotoEvidence = await PhotoEvidence.findAll();
      res.status(200).json(allPhotoEvidence);
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
        fileUrl = `http://${process.env.MINIO_ENDPOINT?.split(':')[0] || 'localhost'}:9000/${bucket}/${objectName}`;

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
};

module.exports = PhotoEvidenceController; 