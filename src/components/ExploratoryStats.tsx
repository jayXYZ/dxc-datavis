import { useState } from 'react'
import { DEFAULT_API_BASE_URL } from '@/lib/defaults'

type RecordRow = { archetype: string; total_matches: number; wins: number; losses: number; win_rate: number; relative_score?: number | null; win_rate_change?: number | null; tier?: number | null; experimental_score?: number }
type Period = { start_date: string; end_date: string; records: RecordRow[] }
type Marker = { id: number; name: string; start_date: string; entrant_count: number }
const percent = (n: number | null | undefined) => n == null ? '—' : `${(n * 100).toFixed(1)}%`

export default function ExploratoryStats({ start, end, accessKey }: { start: string; end: string; accessKey: string }) {
  const [interval, setInterval] = useState<'month' | 'quarter'>('quarter')
  const [tiers, setTiers] = useState<RecordRow[] | null>(null)
  const [periods, setPeriods] = useState<Period[] | null>(null)
  const [events, setEvents] = useState<Marker[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const load = async () => {
    setLoading(true); setError(''); setTiers(null); setPeriods(null); setEvents(null)
    const base = import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL
    const get = async (name: string, extra = '') => {
      const query = new URLSearchParams({ start_date: start, end_date: end })
      const response = await fetch(`${base}/analysis/${name}?${query}${extra}`, { headers: { Authorization: `Bearer ${accessKey}` }, cache: 'no-store' })
      if (!response.ok) throw new Error(`Could not load ${name} (${response.status})`)
      return response.json()
    }
    try {
      const [tierResult, trendResult, eventResult] = await Promise.all([
        get('experimental-tiers'), get('win-rate-trends', `&interval=${interval}`), get('event-markers')
      ])
      setTiers(tierResult.records); setPeriods(trendResult.periods); setEvents(eventResult.events)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load reports') }
    finally { setLoading(false) }
  }
  return <section className="space-y-3 border-t pt-5"><h2 className="text-xl font-semibold">Trends and experimental tiers</h2>
    <p className="text-sm text-muted-foreground">Load recorded non-mirror win rates, changes from the preceding period, and events with at least 65 entrants. These reports use all event sizes for win rates.</p>
    <label className="text-sm">Period <select disabled={loading} value={interval} onChange={e => { setInterval(e.target.value as 'month' | 'quarter'); setPeriods(null) }} className="ml-2 rounded border bg-background p-1"><option value="quarter">Quarterly</option><option value="month">Monthly</option></select></label>{' '}
    <button type="button" className="rounded border px-3 py-2 text-sm" disabled={loading || !start || !end || start > end} onClick={load}>{loading ? 'Loading…' : 'Load trends and tiers for selected dates'}</button>
    {error && <p role="alert">{error}</p>}
    {tiers && <><h3 className="font-semibold">Experimental tiers</h3><p className="text-sm text-muted-foreground">An exploratory popularity-weighted score, win rate × log(matches), with a minimum of 10 matches. Cutoffs are arbitrary and the ranking has not been validated as a measure of deck strength.</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Archetype</th><th>Tier</th><th>Wins</th><th>Losses</th><th>Matches</th><th>Win rate</th><th>Score</th><th>Relative score</th></tr></thead><tbody>{tiers.map(row => <tr className="border-t" key={row.archetype}><td>{row.archetype}</td><td>{row.tier ?? '—'}</td><td>{row.wins}</td><td>{row.losses}</td><td>{row.total_matches}</td><td>{percent(row.win_rate)}</td><td>{row.experimental_score?.toFixed(2)}</td><td>{percent(row.relative_score)}</td></tr>)}</tbody></table></div></>}
    {periods && <><h3 className="font-semibold">{interval === 'month' ? 'Monthly' : 'Quarterly'} win rates</h3>{periods.map(period => <details key={period.start_date} className="rounded border p-2"><summary>{period.start_date} to {period.end_date} ({period.records.length} archetypes)</summary>{events?.filter(event => event.start_date.slice(0, 10) >= period.start_date && event.start_date.slice(0, 10) <= period.end_date).map(event => <p className="text-sm text-muted-foreground" key={event.id}>{event.start_date.slice(0, 10)} — {event.name} ({event.entrant_count} entrants)</p>)}<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Archetype</th><th>Matches</th><th>Win rate</th><th>Change</th></tr></thead><tbody>{period.records.map(row => <tr className="border-t" key={row.archetype}><td>{row.archetype}</td><td>{row.total_matches}</td><td>{percent(row.win_rate)}</td><td>{percent(row.win_rate_change)}</td></tr>)}</tbody></table></div></details>)}</>}
    {events && <details className="rounded border p-2"><summary>Large event dates ({events.length})</summary><ul className="text-sm">{events.map(event => <li key={event.id}>{event.start_date.slice(0, 10)} — {event.name} ({event.entrant_count} entrants)</li>)}</ul></details>}
  </section>
}
