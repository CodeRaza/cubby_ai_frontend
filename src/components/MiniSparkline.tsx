interface MiniSparklineProps {
  data: number[];
  className?: string;
  isNeutral?: boolean;
}

export const MiniSparkline = ({ data, className = "", isNeutral = false }: MiniSparklineProps) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const width = 100;
  const height = 20;
  const normalize = (value: number) => ((value - min) / range) * height;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - normalize(value);
    return `${x},${y}`;
  }).join(' ');

  const startValue = data[0];
  const endValue = data[data.length - 1];
  const isPositive = endValue > startValue;
  const changePercent = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;
  const isSignificantChange = Math.abs(changePercent) > 0.5;
  
  const color = !isSignificantChange || isNeutral
    ? 'hsl(var(--muted-foreground))' 
    : isPositive 
    ? 'hsl(var(--success))' 
    : 'hsl(var(--danger))';

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none" 
      className={`${className}`}
      style={{ width: '100%', height: '24px' }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
