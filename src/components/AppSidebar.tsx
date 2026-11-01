import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar-context"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ArrowDown, ArrowUp, ArrowDownUp, Filter, Eye, CalendarDays, Percent, MapPin } from "lucide-react"
import swampLogo from "@/assets/swamp-white.svg"
import TimePeriodSelector from "./TimePeriodSelector"
import PercentageFilter from "./PercentageFilter"
import VenueFilter from "./VenueFilter"
import { TimeFrame, Venue } from "@/lib/api-client"

interface AppSidebarProps {
    archetypes: string[];
    visibleArchetypes: string[];
    setVisibleArchetypes: (archetypes: string[]) => void;
    sortMethod: 'games' | 'winrate' | 'alpha';
    sortDirection: 'asc' | 'desc';
    onSort: (method: 'games' | 'winrate' | 'alpha') => void;
    winrateOption: 'total' | 'filtered';
    setWinrateOption: (method: 'total' | 'filtered') => void;
    selectedTimeFrame: TimeFrame;
    onTimeFrameChange: (timeFrame: TimeFrame) => void;
    minPercentage: number | undefined;
    onPercentageChange: (percentage: number | undefined) => void;
    customStartDate?: string;
    customEndDate?: string;
    onCustomDateRangeChange: (startDate: string | undefined, endDate: string | undefined) => void;
    matrixViewMode: 'filtered_vs_all' | 'filtered_vs_filtered';
    setMatrixViewMode: (mode: 'filtered_vs_all' | 'filtered_vs_filtered') => void;
    selectedVenues: Venue[];
    onVenuesChange: (venues: Venue[]) => void;
}

function AppSidebar({ 
    archetypes, 
    visibleArchetypes, 
    setVisibleArchetypes,
    sortMethod,
    sortDirection,
    onSort,
    winrateOption,
    setWinrateOption,
    selectedTimeFrame,
    onTimeFrameChange,
    minPercentage,
    onPercentageChange,
    customStartDate,
    customEndDate,
    onCustomDateRangeChange,
    matrixViewMode,
    setMatrixViewMode,
    selectedVenues,
    onVenuesChange
}: AppSidebarProps) {
    const { setOpen, toggleSidebar } = useSidebar();

    const handleCheckboxChange = (deckname: string, checked: boolean) => {
        if (checked) {
            setVisibleArchetypes([...visibleArchetypes, deckname]);
        } else {
            setVisibleArchetypes(visibleArchetypes.filter(arch => arch !== deckname));
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setVisibleArchetypes([...archetypes]);
        } else {
            setVisibleArchetypes([]);
        }
    };

    const allSelected = archetypes.length === visibleArchetypes.length;

    const getSortIcon = (method: 'games' | 'winrate' | 'alpha') => {
        if (method !== sortMethod) return null;
        return sortDirection === 'asc' ? <ArrowUp className="ml-auto" /> : <ArrowDown className="ml-auto" />;
    };

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={toggleSidebar} className="mb-4">
                            <img src={swampLogo} alt="Swamp Logo" className="h-8 w-8" />
                            <span>DxC: Project Metagame</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="group-data-[collapsible=icon]:px-2">
                <SidebarMenu>
                    <Collapsible className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton onClick={() => setOpen(true)} tooltip="Sort">
                                    <ArrowDownUp />
                                    <span className="group-data-[collapsible=icon]:sr-only">Sort</span>
                                    <ChevronDown className="ml-auto transition-transform group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-180" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton onClick={() => onSort('games')}>
                                            Games Played
                                            {getSortIcon('games')}
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton onClick={() => onSort('winrate')}>
                                            Win Rate
                                            {getSortIcon('winrate')}
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton onClick={() => onSort('alpha')}>
                                            A to Z
                                            {getSortIcon('alpha')}
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                    <Collapsible className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton onClick={() => setOpen(true)} tooltip="Filter">
                                    <Filter />
                                    <span className="group-data-[collapsible=icon]:sr-only">Filter</span>
                                    <ChevronDown className="ml-auto transition-transform group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-180" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton>
                                            <div className="items-top flex space-x-2">
                                                <Checkbox 
                                                    id="selectall" 
                                                    checked={allSelected}
                                                    onCheckedChange={handleSelectAll}
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <label htmlFor="selectall">
                                                        Select All
                                                    </label>
                                                </div>
                                            </div>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    {archetypes.map((deckname) => (
                                        <SidebarMenuSubItem key={deckname}>
                                            <SidebarMenuSubButton>
                                                <div className="items-top flex space-x-2">
                                                    <Checkbox 
                                                        id={deckname}
                                                        checked={visibleArchetypes.includes(deckname)}
                                                        onCheckedChange={(checked) => handleCheckboxChange(deckname, checked as boolean)}
                                                    />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <label htmlFor={deckname}>
                                                            {deckname}
                                                        </label>
                                                    </div>
                                                </div>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                    <Collapsible className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton onClick={() => setOpen(true)} tooltip="Display Options">
                                    <Eye />
                                    <span className="group-data-[collapsible=icon]:sr-only">Display Options</span>
                                    <ChevronDown className="ml-auto transition-transform group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-180" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Winrate Display</Label>
                                                <RadioGroup value={winrateOption} onValueChange={(value) => setWinrateOption(value as 'total' | 'filtered')}>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="total" id="total" />
                                                        <Label htmlFor="total">Total Winrate</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="filtered" id="filtered" />
                                                        <Label htmlFor="filtered">Filtered Winrate</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Matrix View</Label>
                                                <RadioGroup value={matrixViewMode} onValueChange={(value) => setMatrixViewMode(value as 'filtered_vs_all' | 'filtered_vs_filtered')}>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="filtered_vs_all" id="filtered_vs_all" />
                                                        <Label htmlFor="filtered_vs_all">Filtered vs All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="filtered_vs_filtered" id="filtered_vs_filtered" />
                                                        <Label htmlFor="filtered_vs_filtered">Filtered vs Filtered</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                        </div>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                    <Collapsible className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton onClick={() => setOpen(true)} tooltip="Time Period">
                                    <CalendarDays />
                                    <span className="group-data-[collapsible=icon]:sr-only">Time Period</span>
                                    <ChevronDown className="ml-auto transition-transform group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-180" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <TimePeriodSelector
                                            selectedTimeFrame={selectedTimeFrame}
                                            onTimeFrameChange={onTimeFrameChange}
                                            customStartDate={customStartDate}
                                            customEndDate={customEndDate}
                                            onCustomDateRangeChange={onCustomDateRangeChange}
                                        />
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                    <Collapsible className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton onClick={() => setOpen(true)} tooltip="Percentage Filter">
                                    <Percent />
                                    <span className="group-data-[collapsible=icon]:sr-only">Percentage Filter</span>
                                    <ChevronDown className="ml-auto transition-transform group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-180" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <PercentageFilter
                                            minPercentage={minPercentage}
                                            onPercentageChange={onPercentageChange}
                                        />
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                    <Collapsible className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton onClick={() => setOpen(true)} tooltip="Venue">
                                    <MapPin />
                                    <span className="group-data-[collapsible=icon]:sr-only">Venue</span>
                                    <ChevronDown className="ml-auto transition-transform group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-180" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <VenueFilter
                                            selectedVenues={selectedVenues}
                                            onVenuesChange={onVenuesChange}
                                        />
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter />
            <SidebarRail />
        </Sidebar>
    )
}

export default AppSidebar
