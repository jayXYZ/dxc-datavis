import './App.css'
import MetaMatrix from '@/components/MetaMatrix'
import type { ArchetypeRecord, MatchupData } from '@/lib/api-client'
import { ThemeProvider } from "@/components/theme-provider"
import { useState, useEffect } from 'react'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import AppSidebar from '@/components/AppSidebar'
import { api, ArchetypeMatrix, TimeFrame, Venue, WinLossRecord } from '@/lib/api-client'
import { ErrorMessage } from '@/components/ErrorMessage'

interface FetchError {
  message: string;
}

// Cache structure for storing data by time frame
// What sortArchetypes reads; defaults to current state, or a newly loaded dataset's
// values when sorting it before those state updates land
interface SortData {
  records: Record<string, ArchetypeRecord>;
  matrix: Record<string, Record<string, MatchupData>>;
  allArchetypes: string[];
  visible: string[];
}

interface CachedData {
  matrix: Record<string, Record<string, MatchupData>>;
  archetypeRecords: Record<string, ArchetypeRecord>;
  archetypes: string[];
  timeFrame: string;
  startDate?: string;
  endDate?: string;
  minPercentage?: number;
}

async function fetchData(timeFrame?: TimeFrame, minPercentage?: number, startDate?: string, endDate?: string, venues?: Venue[]): Promise<ArchetypeMatrix | FetchError> {
  try {
    return await api.getMatchupData(timeFrame, minPercentage, startDate, endDate, venues);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch matchup data';
    console.error(message);
    return { message };
  }
}

async function fetchAllWinLossRecords(
  timeFrame?: TimeFrame,
  minPercentage?: number,
  startDate?: string,
  endDate?: string,
  venues?: Venue[]
): Promise<WinLossRecord[] | FetchError> {
  try {
    return await api.getAllWinLossRecords(timeFrame, minPercentage, startDate, endDate, venues);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch win/loss records';
    console.error(message);
    return { message };
  }
}

function App() {
  const [matchupData, setMatchupData] = useState<Record<string, Record<string, MatchupData>>>({});
  const [archetypeRecords, setArchetypeRecords] = useState<Record<string, ArchetypeRecord>>({});
  const [archetypes, setArchetypes] = useState<string[]>([]);
  const [visibleArchetypes, setVisibleArchetypes] = useState<string[]>([]);
  // Archetypes the user unchecked in the filter. Visibility for each new dataset is
  // derived from this, so archetypes new to a dataset show up and an empty dataset
  // doesn't leave the matrix permanently empty.
  const [hiddenArchetypes, setHiddenArchetypes] = useState<string[]>([]);
  const [sortMethod, setSortMethod] = useState<'games' | 'winrate' | 'alpha'>('games');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('all_time');
  const [minPercentage, setMinPercentage] = useState<number | undefined>(2);
  // Default to 'filtered' when a percentage filter is active, otherwise 'total'
  const [winrateOption, setWinrateOption] = useState<'total' | 'filtered'>(
    minPercentage !== undefined && minPercentage > 0 ? 'filtered' : 'total'
  );
  // Matrix view mode: 'filtered_vs_all' shows filtered archetypes vs all above cutoff (default)
  // 'filtered_vs_filtered' shows filtered archetypes vs filtered archetypes only
  const [matrixViewMode, setMatrixViewMode] = useState<'filtered_vs_all' | 'filtered_vs_filtered'>('filtered_vs_all');
  const [customStartDate, setCustomStartDate] = useState<string | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<string | undefined>(undefined);
  const [selectedVenues, setSelectedVenues] = useState<Venue[]>([]);
  const [timeFrameData, setTimeFrameData] = useState<{timeFrame: string, startDate?: string, endDate?: string}>({timeFrame: 'all_time'});
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingInBackground, setIsFetchingInBackground] = useState(false);

  // Cache for storing data by time frame and percentage filter
  const [dataCache, setDataCache] = useState<Record<string, CachedData>>({});

  // Helper function to generate cache keys
  const getCacheKey = (timeFrame: TimeFrame, percentage?: number, startDate?: string, endDate?: string, venues?: Venue[]) => {
    const baseKey = percentage !== undefined ? `${timeFrame}-${percentage}` : `${timeFrame}-none`;
    const venuesKey = venues && venues.length > 0 ? `-venues:${[...venues].sort().join(',')}` : '';
    if (startDate && endDate) {
      return `custom-${startDate}-${endDate}-${baseKey}${venuesKey}`;
    }
    return `${baseKey}${venuesKey}`;
  };

  // A custom date range applies only when both dates are set and in order
  const completeDateRange = (startDate?: string, endDate?: string): [string | undefined, string | undefined] =>
    startDate && endDate && startDate <= endDate ? [startDate, endDate] : [undefined, undefined];

  const sortArchetypes = (
    method: 'games' | 'winrate' | 'alpha',
    direction: 'asc' | 'desc',
    archList: string[] = archetypes,
    data: SortData = { records: archetypeRecords, matrix: matchupData, allArchetypes: archetypes, visible: visibleArchetypes },
  ) => {
    return [...archList].sort((a, b) => {
      if (method === 'games') {
        const recordA = data.records[a];
        const recordB = data.records[b];
        const gamesA = recordA ? recordA.wins + recordA.losses : 0;
        const gamesB = recordB ? recordB.wins + recordB.losses : 0;
        return direction === 'asc' ? gamesA - gamesB : gamesB - gamesA;
      }
      if (method === 'winrate') {
        const getWinrate = (archetype: string): number => {
          if (winrateOption === 'filtered') {
            const columnArchetypes = matrixViewMode === 'filtered_vs_all' ? data.allArchetypes : data.visible;
            let wins = 0;
            let losses = 0;
            for (const villain of columnArchetypes) {
              const matchup = data.matrix[archetype]?.[villain];
              if (matchup) {
                wins += matchup.wins;
                losses += matchup.losses;
              }
            }
            return wins + losses > 0 ? wins / (wins + losses) : 0;
          }
          const record = data.records[archetype];
          return record ? record.wins / (record.wins + record.losses) : 0;
        };
        const winrateA = getWinrate(a);
        const winrateB = getWinrate(b);
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
    // Keep hidden archetypes that aren't in the current dataset hidden for when they return
    setHiddenArchetypes(prevHidden => [
      ...prevHidden.filter(arch => !archetypes.includes(arch)),
      ...archetypes.filter(arch => !newVisible.includes(arch)),
    ]);
    setVisibleArchetypes(sortArchetypes(sortMethod, sortDirection, newVisible));
  };

  // Visible archetypes for a newly loaded dataset: everything the user hasn't hidden
  const visibleFor = (
    datasetArchetypes: string[],
    records: Record<string, ArchetypeRecord>,
    matrix: Record<string, Record<string, MatchupData>>,
  ) => {
    const visible = datasetArchetypes.filter(arch => !hiddenArchetypes.includes(arch));
    return sortArchetypes(sortMethod, sortDirection, visible, { records, matrix, allArchetypes: datasetArchetypes, visible });
  };

  // Function to handle percentage filter changes
  const handlePercentageChange = async (newPercentage: number | undefined) => {
    setMinPercentage(newPercentage);
    
    // When a percentage filter is active, automatically use 'filtered' winrate option
    // to show only matches between filtered archetypes
    if (newPercentage !== undefined && newPercentage > 0) {
      setWinrateOption('filtered');
    }
    
    // Fetch new data in background without showing loading screen
    // Pass the new percentage value directly to avoid using stale state
    fetchAndSetDataInBackground(selectedTimeFrame, newPercentage, ...completeDateRange(customStartDate, customEndDate), selectedVenues);
  };

  // Function to handle venue filter changes
  const handleVenuesChange = async (newVenues: Venue[]) => {
    setSelectedVenues(newVenues);
    fetchAndSetDataInBackground(selectedTimeFrame, minPercentage, ...completeDateRange(customStartDate, customEndDate), newVenues);
  };

  // Function to handle custom date range changes
  const handleCustomDateRangeChange = async (startDate: string | undefined, endDate: string | undefined) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    
    // If both dates are provided and in order, fetch data with custom date range
    // Use 'all_time' as the base timeframe when custom dates are provided
    if (startDate && endDate && startDate <= endDate) {
      fetchAndSetDataInBackground('all_time', minPercentage, startDate, endDate, selectedVenues);
    }
  };

  // New function to handle time frame changes without refresh
  const handleTimeFrameChange = async (newTimeFrame: TimeFrame) => {
    setSelectedTimeFrame(newTimeFrame);
    
    // Clear custom dates when switching to predefined timeframes. Use these local
    // values below: the state updates aren't visible until the next render.
    const [startDate, endDate] = newTimeFrame === 'all_time'
      ? completeDateRange(customStartDate, customEndDate)
      : [undefined, undefined];
    if (!startDate) {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
    
    // Check if we have cached data for this time frame and percentage filter
    const cacheKey = getCacheKey(newTimeFrame, minPercentage, startDate, endDate, selectedVenues);
    if (dataCache[cacheKey]) {
      const cachedData = dataCache[cacheKey];
      
      // Update the matrix in place using cached data
      setMatchupData(cachedData.matrix);
      setArchetypeRecords(cachedData.archetypeRecords);
      setArchetypes(cachedData.archetypes);
      setVisibleArchetypes(visibleFor(cachedData.archetypes, cachedData.archetypeRecords, cachedData.matrix));
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
      fetchAndSetDataInBackground(newTimeFrame, minPercentage, startDate, endDate, selectedVenues);
    }
  };

  const [error, setError] = useState<string | null>(null);

  // Function to fetch data in background without showing loading screen.
  // startDate/endDate are always passed explicitly; undefined means no custom range.
  const fetchAndSetDataInBackground = async (timeFrame: TimeFrame, percentage?: number, startDate?: string, endDate?: string, venues?: Venue[]) => {
    setIsFetchingInBackground(true);
    try {
      // Fetch matchup data with selected time frame and percentage filter
      // Use the passed parameters or fall back to state values
      const data = await fetchData(
        timeFrame,
        percentage !== undefined ? percentage : minPercentage,
        startDate,
        endDate,
        venues !== undefined ? venues : selectedVenues
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
      
      // Fetch all win/loss records in a single API call
      const winLossResult = await fetchAllWinLossRecords(
            timeFrame,
            percentage !== undefined ? percentage : minPercentage,
            startDate,
            endDate,
            venues !== undefined ? venues : selectedVenues
          );
      
      if ('message' in winLossResult) {
        setError(winLossResult.message);
        return;
      }
      
      // Convert array of records to a map for easy lookup
      const records: Record<string, ArchetypeRecord> = {};
      const winLossMap = new Map(winLossResult.map(r => [r.archetype, r]));
      
      // Create records for all archetypes, using fetched data or defaults
      for (const archetype of allArchetypes) {
        const record = winLossMap.get(archetype);
        if (record) {
          records[archetype] = record;
        } else {
          // Create a default record with 0 wins/losses for archetypes with no matches
              records[archetype] = {
                wins: 0,
                losses: 0,
                draws: 0,
                total_matches: 0,
                win_rate: 0.0
              };
        }
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
          startDate,
          endDate,
          venues !== undefined ? venues : selectedVenues
        )]: cacheEntry
      }));

      // Update the current display with the new data
      setMatchupData(matrixData);
      setArchetypeRecords(records);
      setArchetypes(sortedArchetypes);
      setVisibleArchetypes(visibleFor(sortedArchetypes, records, matrixData));
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
    const data = await fetchData(timeFrame, minPercentage, customStartDate, customEndDate, selectedVenues);
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

    // Fetch all win/loss records in a single API call
    const winLossResult = await fetchAllWinLossRecords(timeFrame, minPercentage, customStartDate, customEndDate, selectedVenues);
    
    if ('message' in winLossResult) {
      setError(winLossResult.message);
      setIsLoading(false);
      return;
    }
    
    // Convert array of records to a map for easy lookup
    const records: Record<string, ArchetypeRecord> = {};
    const winLossMap = new Map(winLossResult.map(r => [r.archetype, r]));
    
    // Create records for all archetypes, using fetched data or defaults
    for (const archetype of allArchetypes) {
      const record = winLossMap.get(archetype);
      if (record) {
        records[archetype] = record;
      } else {
        // Create a default record with 0 wins/losses for archetypes with no matches
            records[archetype] = {
              wins: 0,
              losses: 0,
              draws: 0,
              total_matches: 0,
              win_rate: 0.0
            };
      }
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
      [getCacheKey(timeFrame, minPercentage, customStartDate, customEndDate, selectedVenues)]: cacheEntry
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
            matrixViewMode={matrixViewMode}
            setMatrixViewMode={setMatrixViewMode}
            selectedVenues={selectedVenues}
            onVenuesChange={handleVenuesChange}
          />
          <SidebarInset>
            <MetaMatrix 
              key={`matrix-${matrixViewMode}-${visibleArchetypes.length}-${archetypes.length}`}
              matchupData={matchupData}
              archetypeRecords={archetypeRecords}
              rowArchetypes={visibleArchetypes}
              columnArchetypes={matrixViewMode === 'filtered_vs_all' ? archetypes : visibleArchetypes}
              winrateOption={winrateOption}
              timeFrame={timeFrameData.timeFrame}
              startDate={timeFrameData.startDate}
              endDate={timeFrameData.endDate}
              isFetchingInBackground={isFetchingInBackground}
            />
          </SidebarInset>
        </SidebarProvider>
      )}
    </ThemeProvider>
  )
}

export default App
