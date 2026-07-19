import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { BannedCard, TimeFrame } from "@/lib/api-client"
import CustomDateRangeSelector from "./CustomDateRangeSelector"
import { useState } from "react"

interface TimePeriodSelectorProps {
    selectedTimeFrame: TimeFrame;
    onTimeFrameChange: (timeFrame: TimeFrame) => void;
    customStartDate?: string;
    customEndDate?: string;
    onCustomDateRangeChange: (startDate: string | undefined, endDate: string | undefined) => void;
    bannedCards: BannedCard[];
}

// Returns the day before a YYYY-MM-DD date, so a ban date can be used as
// the inclusive end_date of the "pre-ban" era.
function dayBefore(dateStr: string): string {
    const date = new Date(`${dateStr}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
}

function TimePeriodSelector({
    selectedTimeFrame,
    onTimeFrameChange,
    customStartDate,
    customEndDate,
    onCustomDateRangeChange,
    bannedCards
}: TimePeriodSelectorProps) {
    const [showCustomDates, setShowCustomDates] = useState(false);
    const [activePreset, setActivePreset] = useState<string | null>(null);

    const handleTimeFrameChange = (value: string) => {
        if (value === 'custom') {
            setActivePreset(null);
            setShowCustomDates(true);
            // Don't call onTimeFrameChange for custom, we'll handle it via date changes
            return;
        }

        const banEntry = bannedCards.find(
            (b) => value === `pre_ban:${b.card}` || value === `post_ban:${b.card}`
        );
        if (banEntry) {
            setActivePreset(value);
            setShowCustomDates(false);
            if (value.startsWith('pre_ban:')) {
                onCustomDateRangeChange(undefined, dayBefore(banEntry.banned_date));
            } else {
                onCustomDateRangeChange(banEntry.banned_date, undefined);
            }
            return;
        }

        setActivePreset(null);
        setShowCustomDates(false);
        // Clear custom dates when switching to predefined timeframes
        onCustomDateRangeChange(undefined, undefined);
        onTimeFrameChange(value as TimeFrame);
    };

    const handleCustomDateChange = (startDate: string | undefined, endDate: string | undefined) => {
        setActivePreset(null);
        onCustomDateRangeChange(startDate, endDate);
        // If both dates are provided, we can consider this a valid custom range
        if (startDate && endDate) {
            // The parent component will handle the API call with custom dates
        }
    };

    return (
        <div className="space-y-3">
            <RadioGroup
                value={activePreset ?? (showCustomDates ? 'custom' : selectedTimeFrame)}
                onValueChange={handleTimeFrameChange}
                className="space-y-2"
            >
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
                {bannedCards.map((b) => (
                    <div key={b.card} className="contents">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value={`pre_ban:${b.card}`} id={`pre_ban:${b.card}`} />
                            <Label htmlFor={`pre_ban:${b.card}`} className="text-sm">
                                Pre-Ban ({b.card})
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value={`post_ban:${b.card}`} id={`post_ban:${b.card}`} />
                            <Label htmlFor={`post_ban:${b.card}`} className="text-sm">
                                Post-Ban ({b.card})
                            </Label>
                        </div>
                    </div>
                ))}
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
