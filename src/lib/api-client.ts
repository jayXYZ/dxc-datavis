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

const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN || (window as any).JWT_TOKEN;

async function fetchJson<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Debug logging
  console.log('API call:', url);
  console.log('JWT Token available:', !!JWT_TOKEN);
  console.log('JWT Token value:', JWT_TOKEN ? JWT_TOKEN.substring(0, 20) + '...' : 'undefined');
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${JWT_TOKEN}`,
    },
  });
  
  console.log('Response status:', response.status);
  
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
