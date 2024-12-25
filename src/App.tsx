import './App.css'
import MetaMatrix, { ResultsData, ArchetypeRecord, MatchupData } from '@/components/MetaMatrix'
import { ThemeProvider } from "@/components/theme-provider"
import { useState, useEffect } from 'react'
import {
  SidebarProvider
} from "@/components/ui/sidebar"
import AppSidebar from '@/components/AppSidebar'

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

function App() {
  const [matchupData, setMatchupData] = useState<Record<string, Record<string, MatchupData>>>({});
  const [archetypeRecords, setArchetypeRecords] = useState<Record<string, ArchetypeRecord>>({});
  const [archetypes, setArchetypes] = useState<string[]>([]);
  const [visibleArchetypes, setVisibleArchetypes] = useState<string[]>([]);
  const [sortMethod, setSortMethod] = useState<'games' | 'winrate' | 'alpha'>('games');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
      return direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
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
        // Fetch matchup data
        const data = await fetchData();
        if (data?.results) {
            setMatchupData(data.results);
            const allArchetypes = Object.keys(data.results);
            setArchetypes(allArchetypes);
            setVisibleArchetypes(allArchetypes);
            
            // After getting matchup data, fetch win rates for each archetype
            const records: Record<string, ArchetypeRecord> = {};
            for (const archetype of allArchetypes) {
                const record = await fetchArchetypeWinRate(archetype);
                if (record) {
                    records[archetype] = record;
                }
            }
            setArchetypeRecords(records);
            
            // Only sort after we have both matchup data and archetype records
            const sortedArchetypes = sortArchetypes('games', 'desc', allArchetypes);
            setArchetypes(sortedArchetypes);
            setVisibleArchetypes(sortedArchetypes);
        }
    };
    fetchAndSetData();
}, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar 
          archetypes={archetypes}
          visibleArchetypes={visibleArchetypes}
          setVisibleArchetypes={handleVisibilityChange}
          sortMethod={sortMethod}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
        <MetaMatrix 
          matchupData={matchupData}
          archetypeRecords={archetypeRecords}
          archetypes={visibleArchetypes}
        />
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App
