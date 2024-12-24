import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const archetypes = [
    {id: "Goblins", deckname: "Goblins"},
    {id: "Sligh", deckname: "Sligh"},
    {id: "Black/White Control", deckname: "Black/White Control"},
    {id: "Elves", deckname: "Elves"},
    {id: "Enchantress", deckname: "Enchantress"},
    {id: "Gro-a-tog", deckname: "Gro-a-tog"},
    {id: "Landstill", deckname: "Landstill"},
    {id: "Machine Head", deckname: "Machine Head"},
    {id: "Mono Blue Dreadnought", deckname: "Mono Blue Dreadnought"},
    {id: "Reanimator", deckname: "Reanimator"},
    {id: "Replenish", deckname: "Replenish"},
    {id: "Red/Green Oath Ponza", deckname: "Red/Green Oath Ponza"},
    {id: "The Rock", deckname: "The Rock"},
    {id: "Stasis", deckname: "Stasis"},
    {id: "Survival Madness", deckname: "Survival Madness"}, 
    {id: "Survival Rock", deckname: "Survival Rock"},
    {id: "Terrageddon", deckname: "Terrageddon"},
    {id: "Blue/Black Psychatog", deckname: "Blue/Black Psychatog"},
    {id: "Blue/White Dreadnought", deckname: "Blue/White Dreadnought"}
]

interface MatchupResponse {
    archetype_1_wins: number;
    archetype_2_wins: number;
}

async function fetchWinrate(herodeck: string, villaindeck: string): Promise<MatchupResponse | null> {
    const url = `/api/matchup?archetype=${herodeck}&opponent=${villaindeck}`
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
    
        const data = await response.json() as MatchupResponse;
        const totalGames = data.archetype_1_wins + data.archetype_2_wins;
        if (totalGames === 0) return null;
        return data;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(errorMessage);
        return null
    }
}

function MetaMatrix() {
    const [winrates, setWinrates] = useState<Record<string, Record<string, number>>>({});

    // Add a function to calculate the background color
    const getWinrateColor = (winrate: number) => {
        // Convert winrate to a number between 0 and 1
        const normalizedWinrate = winrate / 100;
        // Use HSL to interpolate between red (0deg) through yellow (60deg) to green (120deg)
        const hue = normalizedWinrate * 120; // This will go from 0 (red) to 120 (green)
        return `hsl(${hue}, 75%, 65%)`;
    };

    useEffect(() => {
        // Fetch all winrates when component mounts
        const fetchAllWinrates = async () => {
            const rates: Record<string, Record<string, number>> = {};
            for (const hero of archetypes) {
                rates[hero.id] = {};
                for (const villain of archetypes) {
                    const winrate = await fetchWinrate(hero.id, villain.id);
                    rates[hero.id][villain.id] = winrate?.archetype_1_wins ?? 0;
                }
            }
            setWinrates(rates);
        };

        fetchAllWinrates();
    }, []);

    return (
        <>
            <Table className='w-[500px]'>
                <TableHeader>
                    <TableRow>
                        <TableHead className='text-center'>Archetype</TableHead>
                        {archetypes.map(archetype => (
                            <TableHead className='text-center' key={archetype.id}>{archetype.deckname}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {archetypes.map(hero => (
                        <TableRow key={hero.id}>
                            <TableCell>
                                {hero.deckname}
                            </TableCell>
                            {archetypes.map(villain => {
                                if (hero.deckname === villain.deckname) {
                                    return <TableCell className='bg-gray-500 w-[130px]' key={villain.id}></TableCell>;
                                }
                                
                                const heroWins = winrates[hero.id]?.[villain.id] || 0;
                                const villainWins = winrates[villain.id]?.[hero.id] || 0;
                                const totalGames = heroWins + villainWins;
                                const winrate = totalGames > 0 ? (heroWins / totalGames * 100) : 0;
                                
                                return (
                                    <TableCell 
                                        className='relative w-[130px]' 
                                        key={villain.id}
                                        style={{ 
                                            backgroundColor: getWinrateColor(winrate),
                                            transition: 'background-color 0.3s ease'
                                        }}
                                    >
                                        <h4>{winrate.toFixed(1) + '%' || 'Loading...'}</h4>
                                        <p>{heroWins}W - {villainWins}L</p>
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    )
}

export default MetaMatrix