import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export type TimePeriod = '1m' | '3m' | '6m' | '1y' | 'all';

interface TimePeriodSelectorProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
}

export function TimePeriodSelector({ value, onChange }: TimePeriodSelectorProps) {
  console.log('Current time period:', value);
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-lg font-semibold">Time Period</Label>
      <RadioGroup
        value={value}
        onValueChange={(val) => {
          console.log('Changing time period to:', val);
          onChange(val as TimePeriod);
        }}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="1m" id="1m" />
          <Label htmlFor="1m">1 Month</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="3m" id="3m" />
          <Label htmlFor="3m">3 Months</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="6m" id="6m" />
          <Label htmlFor="6m">6 Months</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="1y" id="1y" />
          <Label htmlFor="1y">1 Year</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="all" id="all" />
          <Label htmlFor="all">All Time</Label>
        </div>
      </RadioGroup>
    </div>
  )
}