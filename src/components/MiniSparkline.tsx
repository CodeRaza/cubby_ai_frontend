interface MiniSparklineProps {
  data: number[];
  className?: string;
}

export const MiniSparkline = ({ data, className = "" }: MiniSparklineProps) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const normalize = (value: number) => ((value - min) / range) * 100;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - normalize(value);
    return `${x},${y}`;
  }).join(' ');

  const isPositive = data[data.length - 1] >= data[0];
  const color = isPositive ? 'rgb(46, 204, 113)' : 'rgb(231, 76, 60)';

  return (
    <svg 
      viewBox="0 0 100 20" 
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
