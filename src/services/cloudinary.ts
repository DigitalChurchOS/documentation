import crypto from 'crypto';
import { getPlatformSettings } from './platformSettings';

export interface CloudinaryCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export async function getPlatformCloudinaryCredentials(type: 'onboarding' | 'content'): Promise<CloudinaryCredentials> {
  const s = getPlatformSettings();
  
  const defaultOnboarding = {
    cloudName: 'pguyn8bv',
    apiKey: '361943296662427',
    apiSecret: 'ssUh1aCybDMpnaMK1-cVs8ik320'
  };

  const onboarding = {
    cloudName: s.cloudinaryCloudName || defaultOnboarding.cloudName,
    apiKey: s.cloudinaryApiKey || defaultOnboarding.apiKey,
    apiSecret: s.cloudinaryApiSecret || defaultOnboarding.apiSecret
  };

  if (type === 'onboarding') {
    return onboarding;
  }

  if (s.cloudinarySeparateContent) {
    return {
      cloudName: s.cloudinaryContentCloudName || onboarding.cloudName,
      apiKey: s.cloudinaryContentApiKey || onboarding.apiKey,
      apiSecret: s.cloudinaryContentApiSecret || onboarding.apiSecret
    };
  }

  return onboarding;
}

export async function uploadToCloudinary(
  fileData: string,
  credentials: CloudinaryCredentials,
  folder: string = 'churchtell'
): Promise<string> {
  const { cloudName, apiKey, apiSecret } = credentials;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials are incomplete');
  }

  const timestamp = Math.round(Date.now() / 1000).toString();
  const params: Record<string, string> = {
    folder,
    timestamp,
  };
  
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + apiSecret;
  const signature = crypto.createHash('sha1').update(paramString).digest('hex');

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  
  const formData = new URLSearchParams();
  formData.append('file', fileData);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('folder', folder);
  formData.append('signature', signature);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errText}`);
  }

  const result = await response.json() as any;
  return result.secure_url;
}
