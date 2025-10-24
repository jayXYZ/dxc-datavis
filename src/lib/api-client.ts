const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mtg-data-ai.fly.dev';

export interface ArchetypeRecord {
  wins: number;
  losses: number;
  draws: number;
  total_matches: number;
  win_rate: number;
}

export interface MatchupData {
  wins: number;
  losses: number;
  draws: number;
}

export interface ArchetypeMatrix {
  archetypes: string[];
  matrix: Record<string, Record<string, MatchupData>>;
  time_frame: string;
  start_date?: string;
  end_date?: string;
  min_percentage?: number;
}

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface WinLossRecord {
  archetype: string;
  wins: number;
  losses: number;
  draws: number;
  total_matches: number;
  win_rate: number;
}

// Time frame options
export type TimeFrame = '3_months' | '6_months' | '1_year' | 'all_time';

// Secure token management - only use environment variable, no fallback to window
const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN;

// Validate that we have a token
if (!JWT_TOKEN) {
  console.error('VITE_JWT_TOKEN environment variable is required but not set');
}

async function fetchJson<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Only log API calls in development, never expose token information
  if (import.meta.env.DEV) {
    console.log('API call:', url);
  }
  
  // Check if token is available before making request
  if (!JWT_TOKEN) {
    throw new Error('Authentication token not configured. Please set VITE_JWT_TOKEN environment variable.');
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${JWT_TOKEN}`,
    },
  });
  
  if (import.meta.env.DEV) {
    console.log('Response status:', response.status);
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', response.status, errorText);
    if (response.status === 403) {
      throw new Error('Authentication required. Please check your JWT token.');
    }
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }
  return await response.json();
}

export const api = {
  getMatchupData: (timeFrame?: TimeFrame, minPercentage?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (timeFrame && timeFrame !== 'all_time') {
      params.append('time_frame', timeFrame);
    }
    if (minPercentage !== undefined) {
      params.append('min_percentage', minPercentage.toString());
    }
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }
    const queryString = params.toString();
    const endpoint = `/analysis/archetype-matrix${queryString ? `?${queryString}` : ''}`;
    return fetchJson<ArchetypeMatrix>(endpoint);
  },
  getArchetypeWinRate: (archetype: string, timeFrame?: TimeFrame, minPercentage?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    params.append('archetype', archetype);
    if (timeFrame && timeFrame !== 'all_time') {
      params.append('time_frame', timeFrame);
    }
    if (minPercentage !== undefined) {
      params.append('min_percentage', minPercentage.toString());
    }
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }
    const queryString = params.toString();
    const endpoint = `/analysis/win-loss-records?${queryString}`;
    
    return fetchJson<WinLossRecord[]>(endpoint)
    .then(records => {
      // Find the record for the requested archetype
      const record = records.find(r => r.archetype === archetype);
      if (!record) {
        throw new Error(`No record found for archetype: ${archetype}`);
      }
      return record;
    });
  },
};
