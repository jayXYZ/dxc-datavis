import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
//@ts-ignore
import wilson from 'wilson-score-interval'

export interface MatchupData {
    wins: number;
    losses: number;
    draws: number;
}

export interface ResultsData {
    results: Record<string, Record<string, MatchupData>>;
}

export interface ArchetypeRecord {
    wins: number;
    losses: number;
}

interface MetaMatrixProps {
    matchupData: Record<string, Record<string, MatchupData>>;
    archetypeRecords: Record<string, ArchetypeRecord>;
    archetypes: string[];
    winrateOption: string;
    timeFrame?: string;
    startDate?: string;
    endDate?: string;
    isFetchingInBackground?: boolean;
}

function MetaMatrix({ 
    matchupData, 
    archetypeRecords, 
    archetypes, 
    winrateOption,
    timeFrame,
    startDate,
    endDate,
    isFetchingInBackground
}: MetaMatrixProps) {

    const getWinrateColor = (winrate: number) => {
        const normalizedWinrate = winrate / 100;
        const hue = normalizedWinrate * 120;
        return `hsl(${hue}, 70%, 45%)`;
    };

    const formatTimeFrame = (tf?: string) => {
        if (!tf) return '';
        const frameMap: Record<string, string> = {
            '1_month': '1 Month',
            '3_months': '3 Months',
            '6_months': '6 Months',
            '1_year': '1 Year',
            'all_time': 'All Time'
        };
        return frameMap[tf] || tf;
    };

    const getTimeFrameDisplay = () => {
        if (startDate && endDate) {
            return 'Custom Range';
        }
        return formatTimeFrame(timeFrame);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString();
        } catch {
            return dateStr;
        }
    };

    const calculateWinrate = (hero: string, villain: string): { winrate: number, wins: number, losses: number, wilsonLower: number, wilsonUpper: number } | null => {
        const matchup = matchupData[hero]?.[villain];
        if (!matchup) return null;
        
        const wins = matchup.wins;
        const losses = matchup.losses;
        const total = wins + losses;

        const wilsonCI = wilson(wins, total)
        
        if (total === 0) return null;
        return {
            winrate: (wins / total) * 100,
            wins,
            losses,
            wilsonLower: wilsonCI.left * 100,
            wilsonUpper: wilsonCI.right * 100
            
        };
    };

    // If we have no archetypes and we're not fetching in background, show loading
    if (archetypes.length === 0 && !isFetchingInBackground) {
        return <div>Loading...</div>;
    }
    
    // If we have no archetypes but we are fetching in background, show a message
    if (archetypes.length === 0 && isFetchingInBackground) {
        return (
            <div className="max-h-[100vh] max-w-[100vw] overflow-auto relative border-2">
                <div className="bg-muted p-3 border-b text-center">
                    <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
                        {getTimeFrameDisplay()}
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60"></div>
                    </h3>
                </div>
                <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p>Loading {getTimeFrameDisplay()} data...</p>
                    </div>
                </div>
            </div>
        );
    }

    const filteredWinrate = (hero: string): {winrate: number, wins: number, losses: number} | null => {
        let wins = 0;
        let losses = 0;

        for (let villain of archetypes) {
            const matchup = matchupData[hero]?.[villain];
            if (matchup) {
                wins += matchup.wins;
                losses += matchup.losses;
            }
        }

        if (wins + losses === 0) return null;

        return {
            winrate: (wins / (wins + losses)) * 100,
            wins, 
            losses
        };
    };

    return (
        <div className="max-h-[100vh] max-w-[100vw] overflow-auto relative border-2">
            {/* Time Frame Header */}
            {timeFrame && (
                <div className="bg-muted p-3 border-b text-center">
                    <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
                        {getTimeFrameDisplay()}
                        {isFetchingInBackground && (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60"></div>
                        )}
                    </h3>
                    {startDate && endDate && (
                        <p className="text-sm text-muted-foreground">
                            {formatDate(startDate)} - {formatDate(endDate)}
                        </p>
                    )}
                </div>
            )}
            <Table className='border-collapse'>
                <TableHeader>
                    <TableRow>
                        <TableHead className='text-center w-[150px] min-w-[150px] sticky left-0 top-0 z-30 bg-background'>
                            Archetype
                        </TableHead>
                        {archetypes.map(archetype => (
                            <TableHead 
                                className='text-center max-w-[120px] min-w-[120px] sticky top-0 z-20 bg-background text-primary' 
                                key={archetype}
                            >
                                {archetype}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {archetypes.map(hero => (
                        <TableRow key={hero}>
                            <TableCell className='w-[150px] min-w-[150px] h-[120px] sticky left-0 z-10 bg-background'>
                                <div className='text-center'>
                                    <p className='font-bold'>{hero}</p>
                                    {archetypeRecords[hero] && (
                                        <p className='text-sm text-gray-500'>
                                            {winrateOption === 'filtered' ?  
                                                `${filteredWinrate(hero)?.wins}W - ${filteredWinrate(hero)?.losses}L` :
                                                `${archetypeRecords[hero].wins}W - ${archetypeRecords[hero].losses}L`
                                            }
                                            <br />
                                            {winrateOption === 'filtered' ? 
                                                `${filteredWinrate(hero)?.winrate.toFixed(1)}%` :
                                                `${((archetypeRecords[hero].wins / (archetypeRecords[hero].wins + archetypeRecords[hero].losses)) * 100).toFixed(1)}%`
                                            }
                                        </p>
                                    )}
                                </div>
                            </TableCell>
                            {archetypes.map(villain => {
                                if (hero === villain) {
                                    return <TableCell className='bg-gray-500 w-[120px] min-w-[120px] text-center' key={villain}></TableCell>;
                                }
                                
                                const result = calculateWinrate(hero, villain);
                                
                                return (
                                    <TableCell 
                                        className='text-center p-2' 
                                        key={villain}
                                        style={{ 
                                            backgroundColor: result ? getWinrateColor(result.winrate) : undefined,
                                            transition: 'background-color 0.3s ease'
                                        }}
                                    >
                                        {result ? (
                                            <>
                                                <p className="text-xs">({result.wilsonLower.toFixed(1)}% - {result.wilsonUpper.toFixed(1)}%)</p>
                                                <h4 className='font-bold text-xl'>{result.winrate.toFixed(1)}%</h4>
                                                <p className='text-m'>{result.wins}W - {result.losses}L</p>
                                            </>
                                        ) : (
                                            <h4>Loading...</h4>
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>    
        </div>
        
    )
}

export default MetaMatrix