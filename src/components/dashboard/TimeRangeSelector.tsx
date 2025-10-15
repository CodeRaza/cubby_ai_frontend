import { Button } from "@/components/ui/button";

export type TimeRange = '1D' | '1W' | '1M' | '3M' | 'YTD' | 'All';

interface TimeRangeSelectorProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

const timeRanges: TimeRange[] = ['1D', '1W', '1M', '3M', 'YTD', 'All'];

export const TimeRangeSelector = ({ selected, onChange }: TimeRangeSelectorProps) => {
  return (
    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
      {timeRanges.map((range) => (
        <Button
          key={range}
          variant="ghost"
          size="sm"
          onClick={() => onChange(range)}
          className={`
            h-7 px-3 text-xs font-medium transition-all
            ${selected === range 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }
          `}
        >
          {range}
        </Button>
      ))}
    </div>
  );
};