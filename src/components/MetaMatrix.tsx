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
}

function MetaMatrix({ matchupData, archetypeRecords, archetypes, winrateOption }: MetaMatrixProps) {

    const getWinrateColor = (winrate: number) => {
        const normalizedWinrate = winrate / 100;
        const hue = normalizedWinrate * 120;
        return `hsl(${hue}, 70%, 45%)`;
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

    if (archetypes.length === 0) {
        return <div>Loading...</div>;
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