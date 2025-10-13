const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mtg-data-ai.fly.dev';

export interface ArchetypeRecord {
  wins: number;
  losses: number;
  draws: number;
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
export type TimeFrame = '1_month' | '3_months' | '6_months' | '1_year' | 'all_time';

const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN;

async function fetchJson<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${JWT_TOKEN}`,
    },
  });
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Authentication required. Please check your JWT token.');
    }
    throw new Error(`API error: ${response.status}`);
  }
  return await response.json();
}

export const api = {
  getMatchupData: (timeFrame?: TimeFrame, minPercentage?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (timeFrame && timeFrame !== 'all_time') {
      params.append('time_frame', timeFrame);
    }
    if (minPercentage !== undefined && minPercentage > 0) {
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
  getArchetypeWinRate: (archetype: string) => 
    fetchJson<WinLossRecord[]>(`/analysis/win-loss-records?archetype=${archetype}`)
    .then(records => {
      // Find the record for the requested archetype
      const record = records.find(r => r.archetype === archetype);
      if (!record) {
        throw new Error(`No record found for archetype: ${archetype}`);
      }
      return record;
    }),
};
