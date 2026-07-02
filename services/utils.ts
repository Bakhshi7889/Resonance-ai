
export const downloadImage = async (url: string, filename: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
        console.error('Download failed, falling back to new tab', e);
        window.open(url, '_blank');
    }
};

export const performVisualAudit = async (imageUrl: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(false);
      const w = 10, h = 10;
      canvas.width = w; canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let flagged = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        if (r > 95 && g > 40 && b > 20 && (Math.max(r, g, b) - Math.min(r, g, b) > 15) && Math.abs(r - g) > 15 && r > g && r > b) flagged++;
      }
      resolve((flagged / (w * h)) > 0.45);
    };
    img.onerror = () => resolve(false);
  });
};

export const uploadToMediaStorage = async (imageUrl: string, apiKey: string): Promise<string> => {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Failed to fetch image for upload');
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append('file', blob, 'image.jpg');
        
        const uploadResponse = await fetch('https://media.pollinations.ai/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });
        
        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
        }
        
        const data = await uploadResponse.json();
        const finalUrl = data.url || (data.hash ? `https://media.pollinations.ai/${data.hash}` : null);
        if (!finalUrl) {
            throw new Error('No URL or hash returned from upload endpoint');
        }
        return finalUrl;
    } catch (e) {
        console.error('Media upload failed:', e);
        return imageUrl;
    }
};

