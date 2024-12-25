import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface MatchupData {
    archetype_1_wins: number;
    archetype_2_wins: number;
}

interface ResultsData {
    results: Record<string, Record<string, MatchupData>>;
}

interface ArchetypeRecord {
    wins: number;
    losses: number;
}

async function fetchData(): Promise<ResultsData | null> {
    const url = `/api/matchup/cached`
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(errorMessage);
        return null;
    }
}

async function fetchArchetypeWinRate(archetype: string): Promise<ArchetypeRecord | null> {
    const url = `/api/archetype/overallrecord?archetype=${archetype}`
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(errorMessage);
        return null;
    }
}

function MetaMatrix() {
    const [matchupData, setMatchupData] = useState<Record<string, Record<string, MatchupData>>>({});
    const [archetypeRecords, setArchetypeRecords] = useState<Record<string, ArchetypeRecord>>({});
    const archetypes = Object.keys(matchupData).map(name => ({ id: name }));

    const getWinrateColor = (winrate: number) => {
        const normalizedWinrate = winrate / 100;
        const hue = normalizedWinrate * 120;
        return `hsl(${hue}, 70%, 45%)`;
    };

    useEffect(() => {
        const fetchAndSetData = async () => {
            // Fetch matchup data
            const data = await fetchData();
            if (data?.results) {
                setMatchupData(data.results);
                
                // After getting matchup data, fetch win rates for each archetype
                const records: Record<string, ArchetypeRecord> = {};
                for (const archetype of Object.keys(data.results)) {
                    const record = await fetchArchetypeWinRate(archetype);
                    if (record) {
                        records[archetype] = record;
                    }
                }
                setArchetypeRecords(records);
            }
        };
        fetchAndSetData();
    }, []);

    const calculateWinrate = (hero: string, villain: string): { winrate: number, wins: number, losses: number } | null => {
        const matchup = matchupData[hero]?.[villain];
        if (!matchup) return null;
        
        const wins = matchup.archetype_1_wins;
        const losses = matchup.archetype_2_wins;
        const total = wins + losses;
        
        if (total === 0) return null;
        return {
            winrate: (wins / total) * 100,
            wins,
            losses
        };
    };

    if (archetypes.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <Table className='border-collapse'>
            <TableHeader>
                <TableRow>
                    <TableHead className='text-center w-[150px] min-w-[150px] sticky left-0 top-0 z-30 bg-background'>
                        Archetype
                    </TableHead>
                    {archetypes.map(archetype => (
                        <TableHead 
                            className='text-center max-w-[120px] min-w-[120px] sticky top-0 z-20 bg-background text-primary' 
                            key={archetype.id}
                        >
                            {archetype.id}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {archetypes.map(hero => (
                    <TableRow key={hero.id}>
                        <TableCell className='w-[150px] min-w-[150px] h-[80px] sticky left-0 z-10 bg-background'>
                            <div className='text-center'>
                                <p className='font-bold'>{hero.id}</p>
                                {archetypeRecords[hero.id] && (
                                    <p className='text-sm text-gray-500'>
                                        {archetypeRecords[hero.id].wins}W - {archetypeRecords[hero.id].losses}L
                                        <br />
                                        {((archetypeRecords[hero.id].wins / (archetypeRecords[hero.id].wins + archetypeRecords[hero.id].losses)) * 100).toFixed(1)}%
                                    </p>
                                )}
                            </div>
                        </TableCell>
                        {archetypes.map(villain => {
                            if (hero.id === villain.id) {
                                return <TableCell className='bg-gray-500 w-[120px] min-w-[120px] text-center' key={villain.id}></TableCell>;
                            }
                            
                            const result = calculateWinrate(hero.id, villain.id);
                            
                            return (
                                <TableCell 
                                    className='w-[100px] min-w-[100px] text-center p-2' 
                                    key={villain.id}
                                    style={{ 
                                        backgroundColor: result ? getWinrateColor(result.winrate) : undefined,
                                        transition: 'background-color 0.3s ease'
                                    }}
                                >
                                    {result ? (
                                        <>
                                            <h4 className='font-bold'>{result.winrate.toFixed(1)}%</h4>
                                            <p className='text-sm'>{result.wins}W - {result.losses}L</p>
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
    )
}

export default MetaMatrix