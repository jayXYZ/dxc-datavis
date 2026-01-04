import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"

interface PercentageFilterProps {
    minPercentage: number | undefined;
    onPercentageChange: (percentage: number | undefined) => void;
}

function PercentageFilter({ minPercentage, onPercentageChange }: PercentageFilterProps) {
    const [inputValue, setInputValue] = useState<string>("")

    // Update input value when prop changes
    useEffect(() => {
        if (minPercentage !== undefined) {
            setInputValue(minPercentage.toString())
        } else {
            setInputValue("")
        }
    }, [minPercentage])

    const handleInputChange = (value: string) => {
        setInputValue(value)
        
        // Parse the input value
        const numValue = parseFloat(value)
        
        // Update the parent component
        if (value === "" || isNaN(numValue)) {
            onPercentageChange(undefined)
        } else if (numValue >= 0 && numValue <= 100) {
            onPercentageChange(numValue)
        }
    }

    const handleBlur = () => {
        // Validate and clean up on blur
        const numValue = parseFloat(inputValue)
        if (isNaN(numValue) || numValue < 0) {
            setInputValue("")
            onPercentageChange(undefined)
        } else if (numValue > 100) {
            setInputValue("100")
            onPercentageChange(100)
        }
    }

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <Label htmlFor="percentage-filter" className="text-sm">
                    Minimum Frequency
                </Label>
                <div className="flex items-center space-x-2">
                    <Input
                        id="percentage-filter"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="e.g., 5 or 1.2"
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onBlur={handleBlur}
                        className="w-32 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                    Archetypes appearing below this percentage of total matches during the selected time periodwill be excluded.
                    <br />
                    <br />
                    Percentages must be between 0 and 100, and specified either as a whole number or in .1 increments.
                </p>
            </div>
        </div>
    )
}

export default PercentageFilter
