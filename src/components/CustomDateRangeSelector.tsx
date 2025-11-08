import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface CustomDateRangeSelectorProps {
    startDate?: string;
    endDate?: string;
    onDateRangeChange: (startDate: string | undefined, endDate: string | undefined) => void;
}

function CustomDateRangeSelector({ 
    startDate, 
    endDate, 
    onDateRangeChange 
}: CustomDateRangeSelectorProps) {
    const [localStartDate, setLocalStartDate] = useState(startDate || '');
    const [localEndDate, setLocalEndDate] = useState(endDate || '');

    const handleStartDateChange = (value: string) => {
        setLocalStartDate(value);
        onDateRangeChange(value || undefined, localEndDate || undefined);
    };

    const handleEndDateChange = (value: string) => {
        setLocalEndDate(value);
        onDateRangeChange(localStartDate || undefined, value || undefined);
    };

    const clearDates = () => {
        setLocalStartDate('');
        setLocalEndDate('');
        onDateRangeChange(undefined, undefined);
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm">Start Date</Label>
                <Input
                    id="start-date"
                    type="date"
                    value={localStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="text-sm"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm">End Date</Label>
                <Input
                    id="end-date"
                    type="date"
                    value={localEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="text-sm"
                />
            </div>
            {(localStartDate || localEndDate) && (
                <button
                    onClick={clearDates}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                    Clear dates
                </button>
            )}
        </div>
    )
}

export default CustomDateRangeSelector

