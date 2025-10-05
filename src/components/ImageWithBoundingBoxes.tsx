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
  return (
    <div className={`relative ${className}`}>
      <img 
        src={imageUrl} 
        alt="Detected items" 
        className="w-full h-full object-contain rounded-xl"
      />
      {detections.map((detection, index) => {
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
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: `${width * 100}%`,
              height: `${height * 100}%`,
              animationDelay: `${index * 0.1}s`
            }}
          >
            <div className="absolute -top-8 left-0 bg-card border border-border text-foreground text-xs px-2 py-1 rounded font-medium shadow-lg whitespace-nowrap">
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
