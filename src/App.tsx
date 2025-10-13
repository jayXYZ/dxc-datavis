import './App.css'
import MetaMatrix from '@/components/MetaMatrix'
import type { ArchetypeRecord, MatchupData } from '@/lib/api-client'
import { ThemeProvider } from "@/components/theme-provider"
import { useState, useEffect } from 'react'
import { SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from '@/components/AppSidebar'
import { api, ArchetypeMatrix, TimeFrame } from '@/lib/api-client'
import { ErrorMessage } from '@/components/ErrorMessage'

interface FetchError {
  message: string;
}

// Cache structure for storing data by time frame
interface CachedData {
  matrix: Record<string, Record<string, MatchupData>>;
  archetypeRecords: Record<string, ArchetypeRecord>;
  archetypes: string[];
  timeFrame: string;
  startDate?: string;
  endDate?: string;
  minPercentage?: number;
}

async function fetchData(timeFrame?: TimeFrame, minPercentage?: number, startDate?: string, endDate?: string): Promise<ArchetypeMatrix | FetchError> {
  try {
    return await api.getMatchupData(timeFrame, minPercentage, startDate, endDate);
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
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('all_time');
  const [minPercentage, setMinPercentage] = useState<number | undefined>(undefined);
  const [customStartDate, setCustomStartDate] = useState<string | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<string | undefined>(undefined);
  const [timeFrameData, setTimeFrameData] = useState<{timeFrame: string, startDate?: string, endDate?: string}>({timeFrame: 'all_time'});
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingInBackground, setIsFetchingInBackground] = useState(false);
  
  // Cache for storing data by time frame and percentage filter
  const [dataCache, setDataCache] = useState<Record<string, CachedData>>({});

  // Helper function to generate cache keys
  const getCacheKey = (timeFrame: TimeFrame, percentage?: number, startDate?: string, endDate?: string) => {
    const baseKey = percentage !== undefined ? `${timeFrame}-${percentage}` : `${timeFrame}-none`;
    if (startDate && endDate) {
      return `custom-${startDate}-${endDate}-${baseKey}`;
    }
    return baseKey;
  };

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

  // Function to handle percentage filter changes
  const handlePercentageChange = async (newPercentage: number | undefined) => {
    setMinPercentage(newPercentage);
    
    // Fetch new data in background without showing loading screen
    // Pass the new percentage value directly to avoid using stale state
    fetchAndSetDataInBackground(selectedTimeFrame, newPercentage, customStartDate, customEndDate);
  };

  // Function to handle custom date range changes
  const handleCustomDateRangeChange = async (startDate: string | undefined, endDate: string | undefined) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    
    // If both dates are provided, fetch data with custom date range
    // Use 'all_time' as the base timeframe when custom dates are provided
    if (startDate && endDate) {
      fetchAndSetDataInBackground('all_time', minPercentage, startDate, endDate);
    }
  };

  // New function to handle time frame changes without refresh
  const handleTimeFrameChange = async (newTimeFrame: TimeFrame) => {
    setSelectedTimeFrame(newTimeFrame);
    
    // Clear custom dates when switching to predefined timeframes
    if (newTimeFrame !== 'all_time' || !customStartDate || !customEndDate) {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
    
    // Check if we have cached data for this time frame and percentage filter
    const cacheKey = getCacheKey(newTimeFrame, minPercentage, customStartDate, customEndDate);
    if (dataCache[cacheKey]) {
      const cachedData = dataCache[cacheKey];
      
      // Update the matrix in place using cached data
      setMatchupData(cachedData.matrix);
      setArchetypeRecords(cachedData.archetypeRecords);
      setArchetypes(cachedData.archetypes);
      setVisibleArchetypes(cachedData.archetypes);
      setTimeFrameData({
        timeFrame: cachedData.timeFrame,
        startDate: cachedData.startDate,
        endDate: cachedData.endDate
      });
    } else {
      // If no cached data, update the time frame display immediately
      // and fetch data in the background while keeping current matrix visible
      setTimeFrameData({
        timeFrame: newTimeFrame,
        startDate: undefined,
        endDate: undefined
      });
      
      // Fetch data in background
      fetchAndSetDataInBackground(newTimeFrame, minPercentage, customStartDate, customEndDate);
    }
  };

  const [error, setError] = useState<string | null>(null);

  // Function to fetch data in background without showing loading screen
  const fetchAndSetDataInBackground = async (timeFrame: TimeFrame, percentage?: number, startDate?: string, endDate?: string) => {
    setIsFetchingInBackground(true);
    try {
      // Fetch matchup data with selected time frame and percentage filter
      // Use the passed parameters or fall back to state values
      const data = await fetchData(
        timeFrame, 
        percentage !== undefined ? percentage : minPercentage,
        startDate !== undefined ? startDate : customStartDate,
        endDate !== undefined ? endDate : customEndDate
      );
      if ('message' in data) {
        setError(data.message);
        return;
      }

      const allArchetypes = Object.keys(data.matrix);
      
      // Store time frame data
      const timeFrameInfo = {
        timeFrame: data.time_frame,
        startDate: data.start_date,
        endDate: data.end_date
      };
      
      // Fetch all win rates in the background
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

      const matrixData = data.matrix as Record<string, Record<string, MatchupData>>;
      
      // Cache the data for this time frame
      const cacheEntry: CachedData = {
        matrix: matrixData,
        archetypeRecords: records,
        archetypes: sortedArchetypes,
        timeFrame: data.time_frame,
        startDate: data.start_date,
        endDate: data.end_date,
        minPercentage: percentage !== undefined ? percentage : minPercentage
      };
      
      setDataCache(prev => ({
        ...prev,
        [getCacheKey(
          timeFrame, 
          percentage !== undefined ? percentage : minPercentage,
          startDate !== undefined ? startDate : customStartDate,
          endDate !== undefined ? endDate : customEndDate
        )]: cacheEntry
      }));

      // Update the current display with the new data
      setMatchupData(matrixData);
      setArchetypeRecords(records);
      setArchetypes(sortedArchetypes);
      setVisibleArchetypes(sortedArchetypes);
      setTimeFrameData(timeFrameInfo);
    } catch (error) {
      console.error('Error fetching data in background:', error);
      setError('Failed to fetch data in background');
    } finally {
      setIsFetchingInBackground(false);
    }
  };

  const fetchAndSetData = async (timeFrame: TimeFrame = selectedTimeFrame) => {
    setIsLoading(true);
    setError(null);
    
    // Fetch matchup data with selected time frame and percentage filter
    const data = await fetchData(timeFrame, minPercentage, customStartDate, customEndDate);
    if ('message' in data) {
      setError(data.message);
      setIsLoading(false);
      return;
    }

    const allArchetypes = Object.keys(data.matrix);
    
    // Store time frame data
    const timeFrameInfo = {
      timeFrame: data.time_frame,
      startDate: data.start_date,
      endDate: data.end_date
    };
    
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

    const matrixData = data.matrix as Record<string, Record<string, MatchupData>>;
    
    // Cache the data for this time frame
    const cacheEntry: CachedData = {
      matrix: matrixData,
      archetypeRecords: records,
      archetypes: sortedArchetypes,
      timeFrame: data.time_frame,
      startDate: data.start_date,
      endDate: data.end_date,
      minPercentage: minPercentage
    };
    
    setDataCache(prev => ({
      ...prev,
      [getCacheKey(timeFrame, minPercentage, customStartDate, customEndDate)]: cacheEntry
    }));

    setMatchupData(matrixData);
    setArchetypeRecords(records);
    setArchetypes(sortedArchetypes);
    setVisibleArchetypes(sortedArchetypes);
    setTimeFrameData(timeFrameInfo);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAndSetData();
  }, []); // Only run on initial mount

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
            selectedTimeFrame={selectedTimeFrame}
            onTimeFrameChange={handleTimeFrameChange}
            minPercentage={minPercentage}
            onPercentageChange={handlePercentageChange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomDateRangeChange={handleCustomDateRangeChange}
          />
          <MetaMatrix 
            matchupData={matchupData}
            archetypeRecords={archetypeRecords}
            archetypes={visibleArchetypes}
            winrateOption={winrateOption}
            timeFrame={timeFrameData.timeFrame}
            startDate={timeFrameData.startDate}
            endDate={timeFrameData.endDate}
            isFetchingInBackground={isFetchingInBackground}
          />
        </SidebarProvider>
      )}
    </ThemeProvider>
  )
}

export default App
