import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Venue } from "@/lib/api-client"

interface VenueFilterProps {
    selectedVenues: Venue[];
    onVenuesChange: (venues: Venue[]) => void;
}

const VENUE_OPTIONS: { value: Venue; label: string }[] = [
    { value: "MTGO", label: "MTGO" },
    { value: "WEBCAM", label: "Webcam" },
    { value: "PAPER", label: "Paper" },
]

function VenueFilter({ selectedVenues, onVenuesChange }: VenueFilterProps) {
    const handleToggle = (venue: Venue, checked: boolean) => {
        if (checked) {
            onVenuesChange([...selectedVenues, venue]);
        } else {
            onVenuesChange(selectedVenues.filter(v => v !== venue));
        }
    };

    return (
        <div className="space-y-3">
            {VENUE_OPTIONS.map(({ value, label }) => (
                <div key={value} className="items-top flex space-x-2">
                    <Checkbox
                        id={`venue-${value}`}
                        checked={selectedVenues.includes(value)}
                        onCheckedChange={(checked) => handleToggle(value, checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <Label htmlFor={`venue-${value}`} className="text-sm">
                            {label}
                        </Label>
                    </div>
                </div>
            ))}
            <p className="text-xs text-muted-foreground">
                Leave all unchecked to include every venue.
            </p>
        </div>
    )
}

export default VenueFilter
