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
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (!imageRef.current) return;

      const img = imageRef.current;
      
      // Since the image uses object-contain with only width constraint,
      // the displayed dimensions directly match what we need
      setImageDimensions({
        width: img.clientWidth,
        height: img.clientHeight
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
    <div className={`relative inline-block ${className}`}>
      <img
        ref={imageRef}
        src={imageUrl} 
        alt="Detected items" 
        className="w-full object-contain rounded-xl"
      />
      {imageDimensions.width > 0 && detections.map((detection, index) => {
        if (!detection.bbox) return null;
        
        const { x, y, width, height } = detection.bbox;
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
              left: `${x * imageDimensions.width}px`,
              top: `${y * imageDimensions.height}px`,
              width: `${width * imageDimensions.width}px`,
              height: `${height * imageDimensions.height}px`,
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
