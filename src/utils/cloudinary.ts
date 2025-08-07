// Get environment variables with fallbacks
const getEnvVariable = (key: string, fallback: string = ''): string => {
  if (import.meta.env[`VITE_${key}`]) {
    return import.meta.env[`VITE_${key}`];
  }
  // Fallback to window._env_ if defined
  if (typeof window !== 'undefined' && window._env_ && window._env_[key]) {
    return window._env_[key];
  }
  return fallback;
};

const CLOUDINARY_UPLOAD_PRESET = getEnvVariable('CLOUDINARY_UPLOAD_PRESET', 'your_preset');
const CLOUDINARY_CLOUD_NAME = getEnvVariable('CLOUDINARY_CLOUD_NAME', 'your_cloud');
const CLOUDINARY_API_KEY = getEnvVariable('CLOUDINARY_API_KEY');

export const uploadToCloudinary = async (file: File, folder: string = 'general') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('Upload failed');
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

  return `${base}${transformation}/${imagePath}`;
};
