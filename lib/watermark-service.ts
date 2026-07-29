export type WatermarkType = 'sample' | 'draft' | 'final';

const WATERMARK_TEXT = 'MO-SELL SAMPLE';

export async function addWatermark(file: File, type: WatermarkType): Promise<Blob> {
  if (type === 'final') return file;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = true;
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not available')); return; }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(16, canvas.width * 0.04)}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(WATERMARK_TEXT, canvas.width - 16, canvas.height - 16);
      ctx.globalAlpha = 1;

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate watermarked frame'));
      }, 'image/jpeg', 0.85);
    };

    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load video')); };
    video.src = url;
  });
}

export function isWatermarked(fileName: string): boolean {
  return fileName.includes('_watermarked') || fileName.includes('-sample');
}
