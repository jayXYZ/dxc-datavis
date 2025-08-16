import './App.css'
import MetaMatrix from '@/components/MetaMatrix'
import type { ArchetypeRecord, MatchupData } from '@/lib/api-client'
import { ThemeProvider } from "@/components/theme-provider"
import { useState, useEffect } from 'react'
import { SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from '@/components/AppSidebar'
import { api, ArchetypeMatrix } from '@/lib/api-client'
import { ErrorMessage } from '@/components/ErrorMessage'

interface FetchError {
  message: string;
}

async function fetchData(): Promise<ArchetypeMatrix | FetchError> {
  try {
    return await api.getMatchupData();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch matchup data';
    console.error(message);
    return { message };
  }
}

async function fetchArchetypeWinRate(archetype: string): Promise<ArchetypeRecord | FetchError> {
  try {
    return await api.getArchetypeWinRate(archetype);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : `Failed to fetch win rate for ${archetype}`;
    console.error(message);
    return { message };
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

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndSetData = async () => {
      setIsLoading(true);
      setError(null);
      
      // Fetch matchup data
      const data = await fetchData();
      if ('message' in data) {
        setError(data.message);
        setIsLoading(false);
        return;
      }

      const allArchetypes = Object.keys(data.matrix);
      
      // Fetch all win rates before showing anything
      const records: Record<string, ArchetypeRecord> = {};
      const errors: string[] = [];
      
      // Fetch win rates in parallel
      await Promise.all(
        allArchetypes.map(async (archetype) => {
          const result = await fetchArchetypeWinRate(archetype);
          if ('message' in result) {
            errors.push(`${archetype}: ${result.message}`);
          } else {
            records[archetype] = result;
          }
        })
      );

      // If there were any errors fetching win rates, show them
      if (errors.length > 0) {
        setError(`Failed to fetch some win rates:\n${errors.join('\n')}`);
        setIsLoading(false);
        return;
      }
      
      // Now that we have all the data, set everything at once
      const sortedArchetypes = [...allArchetypes].sort((a, b) => {
        const recordA = records[a];
        const recordB = records[b];
        const gamesA = recordA ? recordA.wins + recordA.losses : 0;
        const gamesB = recordB ? recordB.wins + recordB.losses : 0;
        return gamesB - gamesA; // Default sort: descending by games played
      });

      setMatchupData(data.matrix as Record<string, Record<string, MatchupData>>);
      setArchetypeRecords(records);
      setArchetypes(sortedArchetypes);
      setVisibleArchetypes(sortedArchetypes);
      setIsLoading(false);
    };
    fetchAndSetData();
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading data...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-screen">
          <ErrorMessage message={error} />
        </div>
      ) : (
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
      )}
    </ThemeProvider>
  )
}

export default App
