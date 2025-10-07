import { useEffect, useRef, useState } from "react";

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Detection {
  label: string;
  confidence: number;
  bbox?: BoundingBox;
}

interface ImageWithBoundingBoxesProps {
  imageUrl: string;
  detections: Detection[];
  className?: string;
}

export const ImageWithBoundingBoxes = ({ imageUrl, detections, className = "" }: ImageWithBoundingBoxesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (!imageRef.current || !containerRef.current) return;

      const img = imageRef.current;
      const container = containerRef.current;
      
      // Get natural image dimensions
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      const naturalAspect = naturalWidth / naturalHeight;
      
      // Get container dimensions
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const containerAspect = containerWidth / containerHeight;
      
      // Calculate rendered dimensions with object-contain
      let renderedWidth, renderedHeight, offsetX = 0, offsetY = 0;
      
      if (naturalAspect > containerAspect) {
        // Image is wider - constrained by width
        renderedWidth = containerWidth;
        renderedHeight = containerWidth / naturalAspect;
        offsetY = (containerHeight - renderedHeight) / 2;
      } else {
        // Image is taller - constrained by height
        renderedHeight = containerHeight;
        renderedWidth = containerHeight * naturalAspect;
        offsetX = (containerWidth - renderedWidth) / 2;
      }
      
      console.log('Dimension calculation:', {
        natural: { width: naturalWidth, height: naturalHeight, aspect: naturalAspect },
        container: { width: containerWidth, height: containerHeight, aspect: containerAspect },
        rendered: { width: renderedWidth, height: renderedHeight },
        offset: { x: offsetX, y: offsetY }
      });
      
      setImageDimensions({
        width: renderedWidth,
        height: renderedHeight,
        offsetX,
        offsetY
      });
    };

    const img = imageRef.current;
    if (img) {
      if (img.complete) {
        updateDimensions();
      } else {
        img.addEventListener('load', updateDimensions);
      }
    }

    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (img) {
        img.removeEventListener('load', updateDimensions);
      }
    };
  }, [imageUrl]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} style={{ minHeight: '400px' }}>
      <img
        ref={imageRef}
        src={imageUrl} 
        alt="Detected items" 
        className="w-full h-full object-contain rounded-xl"
      />
      {imageDimensions.width > 0 && detections.map((detection, index) => {
        if (!detection.bbox) return null;
        
        const { x, y, width, height } = detection.bbox;
        
        const left = imageDimensions.offsetX + (x * imageDimensions.width);
        const top = imageDimensions.offsetY + (y * imageDimensions.height);
        const boxWidth = width * imageDimensions.width;
        const boxHeight = height * imageDimensions.height;
        
        console.log(`Detection ${index} (${detection.label}):`, {
          bbox: { x, y, width, height },
          imageDimensions,
          calculated: { left, top, width: boxWidth, height: boxHeight }
        });
        
        const colors = [
          'border-primary bg-primary/10',
          'border-secondary bg-secondary/10',
          'border-accent bg-accent/10',
          'border-green-500 bg-green-500/10',
          'border-blue-500 bg-blue-500/10',
          'border-purple-500 bg-purple-500/10',
        ];
        const colorClass = colors[index % colors.length];

        return (
          <div
            key={index}
            className={`absolute border-2 rounded-lg ${colorClass} animate-pulse`}
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${boxWidth}px`,
              height: `${boxHeight}px`,
              animationDelay: `${index * 0.1}s`
            }}
          >
            <div className="absolute -top-8 left-0 bg-card border border-border text-foreground text-xs px-2 py-1 rounded font-medium shadow-lg whitespace-nowrap z-10">
              <div className="flex items-center gap-1">
                <span className="font-semibold">{detection.label}</span>
                <span className="text-muted-foreground">
                  {Math.round(detection.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
