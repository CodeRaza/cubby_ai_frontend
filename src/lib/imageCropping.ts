export const cropImageFromBoundingBox = async (
  imageUrl: string,
  bbox: { x: number; y: number; width: number; height: number }
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Calculate actual pixel coordinates from normalized bbox
      const x = bbox.x * img.naturalWidth;
      const y = bbox.y * img.naturalHeight;
      const width = bbox.width * img.naturalWidth;
      const height = bbox.height * img.naturalHeight;

      // Set canvas size to cropped dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw the cropped portion
      ctx.drawImage(
        img,
        x, y, width, height,  // source rectangle
        0, 0, width, height   // destination rectangle
      );

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob from canvas"));
          }
        },
        "image/jpeg",
        0.9
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageUrl;
  });
};
