// Get environment variables with fallbacks
const getEnvVariable = (key: string, fallback: string = ''): string => {
  // Try Vite env
  if (import.meta.env && import.meta.env[`VITE_${key}`]) {
    return import.meta.env[`VITE_${key}`];
  }
  // Fallback to window._env_ if defined (for some deployments)
  if (typeof window !== 'undefined' && window._env_ && window._env_[key]) {
    return window._env_[key];
  }
  return fallback;
};

const CLOUDINARY_UPLOAD_PRESET = getEnvVariable('CLOUDINARY_UPLOAD_PRESET', '');
const CLOUDINARY_CLOUD_NAME = getEnvVariable('CLOUDINARY_CLOUD_NAME', '');

// Validate config before upload
export const uploadToCloudinary = async (file: File, folder: string = 'general') => {
  if (!CLOUDINARY_UPLOAD_PRESET || !CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary configuration missing. Please check your .env and deployment environment variables.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      let errorMsg = 'Upload failed';
      try {
        const errData = await response.json();
        if (errData && errData.error && errData.error.message) {
          errorMsg = `Cloudinary: ${errData.error.message}`;
        }
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      publicId: data.public_id,
      format: data.format,
      width: data.width,
      height: data.height
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export const optimizeImage = (url: string, options: { width?: number; height?: number; quality?: number } = {}) => {
  if (!url.includes('cloudinary')) return url;

  const base = url.split('/upload/')[0] + '/upload/';
  const transformations: string[] = [];

  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.quality) transformations.push(`q_${options.quality}`);

  const transformation = transformations.join(',');
  const imagePath = url.split('/upload/')[1];

  return transformation
    ? `${base}${transformation}/${imagePath}`
    : url;
};
