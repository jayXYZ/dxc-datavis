import './App.css'
import MetaMatrix, { ResultsData, ArchetypeRecord, MatchupData } from '@/components/MetaMatrix'
import { ThemeProvider } from "@/components/theme-provider"
import { useState, useEffect } from 'react'
import {
  SidebarProvider
} from "@/components/ui/sidebar"
import AppSidebar from '@/components/AppSidebar'

async function fetchData(): Promise<ResultsData | null> {
  try {
      console.log('Fetching data from sample-data.json...');
      const response = await fetch('/sample-data.json');
      if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
      }
      const rawData = await response.json();
      console.log('Received raw data:', rawData);
      
      // Transform the data into the expected format
      const transformedData: ResultsData = {
          results: Object.fromEntries(
              Object.entries(rawData).map(([archetype1, matches]) => [
                  archetype1,
                  Object.fromEntries(
                      Object.entries(matches as Record<string, any>).map(([archetype2, stats]) => [
                          archetype2,
                          {
                              archetype_1_wins: stats.archetype_1_wins || 0,
                              archetype_2_wins: stats.archetype_2_wins || 0
                          }
                      ])
                  )
              ])
          )
      };
      
      console.log('Transformed data:', transformedData);
      return transformedData;
  } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching data:', errorMessage);
      return null;
  }
}

async function fetchArchetypeWinRate(archetype: string): Promise<ArchetypeRecord | null> {
  try {
      console.log('Fetching win rate for archetype:', archetype);
      const response = await fetch('/sample-data.json');
      if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
      }
      const data = await response.json();
      
      // Extract win rate from the matchup data for visible archetypes only
      const archData = data[archetype];
      if (!archData) return null;
      
      let totalWins = 0;
      let totalLosses = 0;
      
      // Get all visible archetypes from the matchupData state
      const visibleArchetypes = Object.keys(matchupData);
      
      Object.entries(archData).forEach(([opponent, stats]: [string, any]) => {
          // Only count matches against visible archetypes
          if (visibleArchetypes.includes(opponent)) {
              totalWins += stats.archetype_1_wins || 0;
              totalLosses += stats.archetype_2_wins || 0;
          }
      });
      
      console.log('Win rate data for', archetype, ':', { wins: totalWins, losses: totalLosses });
      return {
          wins: totalWins,
          losses: totalLosses
      };
  } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching win rate:', errorMessage);
      return null;
  }
}

function App() {
  const [matchupData, setMatchupData] = useState<Record<string, Record<string, MatchupData>>>({});
  const [archetypeRecords, setArchetypeRecords] = useState<Record<string, ArchetypeRecord>>({});
  const [archetypes, setArchetypes] = useState<string[]>([]);
  const [visibleArchetypes, setVisibleArchetypes] = useState<string[]>([]);
  const [sortMethod, setSortMethod] = useState<'games' | 'winrate' | 'alpha'>('games');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [winrateOption, setWinrateOption] = useState<'total' | 'filtered'>('total');
  const [isLoading, setIsLoading] = useState(true);

  const sortArchetypes = (method: 'games' | 'winrate' | 'alpha', direction: 'asc' | 'desc', archList: string[] = archetypes) => {
    return [...archList].sort((a, b) => {
      if (method === 'games') {
        const recordA = archetypeRecords[a];
        const recordB = archetypeRecords[b];
        const gamesA = recordA ? recordA.wins + recordA.losses : 0;
        const gamesB = recordB ? recordB.wins + recordB.losses : 0;
        return direction === 'asc' ? gamesA - gamesB : gamesB - gamesA;
      }
      if (method === 'winrate') {
        const recordA = archetypeRecords[a];
        const recordB = archetypeRecords[b];
        const winrateA = recordA ? (recordA.wins / (recordA.wins + recordA.losses)) : 0;
        const winrateB = recordB ? (recordB.wins / (recordB.wins + recordB.losses)) : 0;
        return direction === 'asc' ? winrateA - winrateB : winrateB - winrateA;
      }
      // alphabetical
      return direction === 'asc' ? b.localeCompare(a) :  a.localeCompare(b);
    });
  };

  const handleSort = (method: 'games' | 'winrate' | 'alpha') => {
    if (method === sortMethod) {
      // If clicking the same method, toggle direction
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
      const sortedArchetypes = sortArchetypes(method, newDirection);
      setArchetypes(sortedArchetypes);
      setVisibleArchetypes(sortedArchetypes.filter(arch => visibleArchetypes.includes(arch)));
    } else {
      // If clicking a new method, set to descending by default
      setSortMethod(method);
      setSortDirection('desc');
      const sortedArchetypes = sortArchetypes(method, 'desc');
      setArchetypes(sortedArchetypes);
      setVisibleArchetypes(sortedArchetypes.filter(arch => visibleArchetypes.includes(arch)));
    }
  };

  const handleVisibilityChange = (newVisible: string[]) => {
    setVisibleArchetypes(sortArchetypes(sortMethod, sortDirection, newVisible));
  };

  useEffect(() => {
    const fetchAndSetData = async () => {
        setIsLoading(true);
        // Fetch matchup data
        const data = await fetchData();
        if (data?.results) {
            const allArchetypes = Object.keys(data.results);
            
            // Fetch all win rates before showing anything
            const records: Record<string, ArchetypeRecord> = {};
            const fetchPromises = allArchetypes.map(async (archetype) => {
                const record = await fetchArchetypeWinRate(archetype);
                if (record) {
                    records[archetype] = record;
                }
            });

            // Wait for all record fetches to complete
            await Promise.all(fetchPromises);
            
            // Now that we have all the data, set everything at once
            const sortedArchetypes = [...allArchetypes].sort((a, b) => {
                const recordA = records[a];
                const recordB = records[b];
                const gamesA = recordA ? recordA.wins + recordA.losses : 0;
                const gamesB = recordB ? recordB.wins + recordB.losses : 0;
                return gamesB - gamesA; // Default sort: descending by games played
            });

            setMatchupData(data.results);
            setArchetypeRecords(records);
            setArchetypes(sortedArchetypes);
            setVisibleArchetypes(sortedArchetypes);
            setIsLoading(false);
        }
    };
    fetchAndSetData();
}, []);

  if (isLoading) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading data...</div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar 
          archetypes={sortArchetypes('alpha', 'desc', archetypes)}
          visibleArchetypes={visibleArchetypes}
          setVisibleArchetypes={handleVisibilityChange}
          sortMethod={sortMethod}
          sortDirection={sortDirection}
          onSort={handleSort}
          winrateOption={winrateOption}
          setWinrateOption={setWinrateOption}
        />
        <MetaMatrix 
          matchupData={matchupData}
          archetypeRecords={archetypeRecords}
          archetypes={visibleArchetypes}
          winrateOption={winrateOption}
        />
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App
