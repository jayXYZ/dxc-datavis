import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { TimeFrame } from "@/lib/api-client"
import CustomDateRangeSelector from "./CustomDateRangeSelector"
import { useState } from "react"

interface TimePeriodSelectorProps {
    selectedTimeFrame: TimeFrame;
    onTimeFrameChange: (timeFrame: TimeFrame) => void;
    customStartDate?: string;
    customEndDate?: string;
    onCustomDateRangeChange: (startDate: string | undefined, endDate: string | undefined) => void;
}

function TimePeriodSelector({ 
    selectedTimeFrame, 
    onTimeFrameChange,
    customStartDate,
    customEndDate,
    onCustomDateRangeChange
}: TimePeriodSelectorProps) {
    const [showCustomDates, setShowCustomDates] = useState(false);

    const handleTimeFrameChange = (value: string) => {
        if (value === 'custom') {
            setShowCustomDates(true);
            // Don't call onTimeFrameChange for custom, we'll handle it via date changes
        } else {
            setShowCustomDates(false);
            // Clear custom dates when switching to predefined timeframes
            onCustomDateRangeChange(undefined, undefined);
            onTimeFrameChange(value as TimeFrame);
        }
    };

    const handleCustomDateChange = (startDate: string | undefined, endDate: string | undefined) => {
        onCustomDateRangeChange(startDate, endDate);
        // If both dates are provided, we can consider this a valid custom range
        if (startDate && endDate) {
            // The parent component will handle the API call with custom dates
        }
    };

    return (
        <div className="space-y-3">
            <RadioGroup 
                value={showCustomDates ? 'custom' : selectedTimeFrame} 
                onValueChange={handleTimeFrameChange}
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
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="text-sm">Custom Range</Label>
                </div>
            </RadioGroup>
            
            {showCustomDates && (
                <div className="ml-6 mt-2">
                    <CustomDateRangeSelector
                        startDate={customStartDate}
                        endDate={customEndDate}
                        onDateRangeChange={handleCustomDateChange}
                    />
                </div>
            )}
        </div>
    )
}

export default TimePeriodSelector