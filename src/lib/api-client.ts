const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mtg-data.fly.dev';

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
}

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface WinLossRecord extends ArchetypeRecord {
  archetype: string;
}

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
  getMatchupData: () => fetchJson<ArchetypeMatrix>('/analysis/archetype-matrix'),
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
