import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { TimeFrame } from "@/lib/api-client"

interface TimePeriodSelectorProps {
    selectedTimeFrame: TimeFrame;
    onTimeFrameChange: (timeFrame: TimeFrame) => void;
}

function TimePeriodSelector({ selectedTimeFrame, onTimeFrameChange }: TimePeriodSelectorProps) {
    return (
        <div className="space-y-3">
            <RadioGroup 
                value={selectedTimeFrame} 
                onValueChange={(value) => onTimeFrameChange(value as TimeFrame)}
                className="space-y-2"
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1_month" id="1_month" />
                    <Label htmlFor="1_month" className="text-sm">1 Month</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3_months" id="3_months" />
                    <Label htmlFor="3_months" className="text-sm">3 Months</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="6_months" id="6_months" />
                    <Label htmlFor="6_months" className="text-sm">6 Months</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1_year" id="1_year" />
                    <Label htmlFor="1_year" className="text-sm">1 Year</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all_time" id="all_time" />
                    <Label htmlFor="all_time" className="text-sm">All Time</Label>
                </div>
            </RadioGroup>
        </div>
    )
}

export default TimePeriodSelector