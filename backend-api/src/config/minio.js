const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT?.split(':')[0] || 'localhost',
  port: parseInt(process.env.MINIO_ENDPOINT?.split(':')[1] || '9000', 10),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'miniosecretkey'
});

module.exports = minioClient;