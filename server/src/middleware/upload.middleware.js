import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary, { isCloudinaryEnabled } from '../config/cloudinary.js';
import AppError from '../utils/AppError.js';

const fileFilter = (_req, file, cb) => {
  if (/^image\/(jpeg|png|webp|avif|gif)$/.test(file.mimetype)) return cb(null, true);
  cb(AppError.badRequest('Only image files are allowed'));
};

const storage = isCloudinaryEnabled
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'restaurant',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
      },
    })
  : multer.memoryStorage();

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
