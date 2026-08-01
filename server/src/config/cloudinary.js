import { v2 as cloudinary } from 'cloudinary';
import env from './env.js';

/**
 * Cloudinary is configured lazily; when credentials are absent the app
 * still boots (uploads simply fail gracefully with a clear error).
 */
if (env.cloudinary.cloudName) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

export const isCloudinaryEnabled = Boolean(env.cloudinary.cloudName);
export default cloudinary;
