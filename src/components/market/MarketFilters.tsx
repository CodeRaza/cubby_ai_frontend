import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface MarketFiltersProps {
  filters: {
    sport: string;
    grading: string;
    yearFrom: string;
    yearTo: string;
  };
  onFilterChange: (filters: any) => void;
}

export const MarketFilters = ({ filters, onFilterChange }: MarketFiltersProps) => {
  const updateFilter = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      sport: "all",
      grading: "all",
      yearFrom: "",
      yearTo: ""
    });
  };

  const hasActiveFilters = filters.sport !== "all" || 
    filters.grading !== "all" || 
    filters.yearFrom !== "" || 
    filters.yearTo !== "";

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Filters</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sport Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sport</label>
            <Select value={filters.sport} onValueChange={(value) => updateFilter("sport", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                <SelectItem value="Baseball">Baseball</SelectItem>
                <SelectItem value="Basketball">Basketball</SelectItem>
                <SelectItem value="Football">Football</SelectItem>
                <SelectItem value="Hockey">Hockey</SelectItem>
                <SelectItem value="Soccer">Soccer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grading Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Grading</label>
            <Select value={filters.grading} onValueChange={(value) => updateFilter("grading", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Cards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cards</SelectItem>
                <SelectItem value="graded">Graded Only</SelectItem>
                <SelectItem value="raw">Raw Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Year From */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Year From</label>
            <Input
              type="number"
              placeholder="e.g., 1990"
              value={filters.yearFrom}
              onChange={(e) => updateFilter("yearFrom", e.target.value)}
              min="1800"
              max={new Date().getFullYear()}
            />
          </div>

          {/* Year To */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Year To</label>
            <Input
              type="number"
              placeholder="e.g., 2024"
              value={filters.yearTo}
              onChange={(e) => updateFilter("yearTo", e.target.value)}
              min="1800"
              max={new Date().getFullYear()}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
