import { supabase } from '../../../lib/supabase';

/**
 * Compresses and resizes a dataURL (or image blob) to an optimized JPEG.
 * Produces clean ~25-45KB photos ideal for database persistence, realtime delivery, and storage.
 */
export async function compressAndResizeImage(
  dataUrl: string, 
  maxDimension = 480, 
  quality = 0.85
): Promise<{ compressedDataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Canvas 2D context not available'));
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

      canvas.toBlob((blob) => {
        if (!blob) {
          return reject(new Error('Failed to create Blob from canvas'));
        }
        resolve({ compressedDataUrl, blob });
      }, 'image/jpeg', quality);
    };

    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}

/**
 * Uploads a visitor photo to Supabase Storage bucket 'visitor-photos'.
 * Implements high-reliability fallbacks:
 * 1. Supabase Storage bucket 'visitor-photos'
 * 2. Express server /api/visitor-photos
 * 3. Direct compressed high-quality JPEG dataURL
 */
export async function uploadVisitorPhoto(
  photoDataUrl: string,
  visitorName = 'visitor'
): Promise<{ success: boolean; url: string; path?: string; error?: string }> {
  if (!photoDataUrl || !photoDataUrl.startsWith('data:image/')) {
    return { success: false, url: '', error: 'No valid image provided' };
  }

  try {
    const { compressedDataUrl, blob } = await compressAndResizeImage(photoDataUrl, 480, 0.82);
    const sanitizedName = visitorName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);
    const filename = `photo_${sanitizedName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
    const filePath = `visitors/${filename}`;

    // 1. Attempt Supabase Storage upload
    try {
      const { data, error } = await supabase.storage
        .from('visitor-photos')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('visitor-photos')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return {
            success: true,
            url: publicUrlData.publicUrl,
            path: filePath
          };
        }
      } else if (error) {
        console.warn('Supabase storage upload notice (attempting server fallback):', error.message);
      }
    } catch (storageErr) {
      console.warn('Supabase storage exception (attempting server fallback):', storageErr);
    }

    // 2. Attempt Express server fallback (/api/visitor-photos)
    try {
      const res = await fetch('/api/visitor-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoData: compressedDataUrl,
          fileName: filename
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.url) {
          return {
            success: true,
            url: json.url,
            path: json.url
          };
        }
      }
    } catch (serverErr) {
      console.warn('Server storage fallback notice:', serverErr);
    }

    // 3. Guaranteed Fallback: Return the high-efficiency compressed dataURL
    // Postgres TEXT column supports up to 1GB, so 30KB dataURL saves with 100% reliability
    return {
      success: true,
      url: compressedDataUrl,
      path: filename
    };
  } catch (err: any) {
    console.warn('Visitor photo processing error:', err);
    return {
      success: false,
      url: '',
      error: err?.message || 'Failed to process visitor photo'
    };
  }
}
