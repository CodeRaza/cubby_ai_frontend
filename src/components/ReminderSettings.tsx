import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";

interface ReminderSettingsProps {
  enabled: boolean;
  intervalValue: number;
  intervalUnit: string;
  onEnabledChange: (enabled: boolean) => void;
  onIntervalValueChange: (value: number) => void;
  onIntervalUnitChange: (unit: string) => void;
}

export const ReminderSettings = ({
  enabled,
  intervalValue,
  intervalUnit,
  onEnabledChange,
  onIntervalValueChange,
  onIntervalUnitChange,
}: ReminderSettingsProps) => {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <Label htmlFor="reminder-enabled" className="font-semibold">
            Reminder Notifications
          </Label>
        </div>
        <Switch
          id="reminder-enabled"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      {enabled && (
        <div className="space-y-3 animate-in fade-in-50 duration-200">
          <p className="text-sm text-muted-foreground">
            Set reminders for expiration dates, replenishment, maintenance checks, or any regular review of this item
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="interval-value" className="text-sm">
                Every
              </Label>
              <Input
                id="interval-value"
                type="number"
                min="1"
                value={intervalValue}
                onChange={(e) => onIntervalValueChange(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interval-unit" className="text-sm">
                Period
              </Label>
              <Select value={intervalUnit} onValueChange={onIntervalUnitChange}>
                <SelectTrigger id="interval-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="quarters">Quarters</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
