import { useMemo, useState } from 'react'
import { DEFAULT_API_BASE_URL } from '@/lib/defaults'

type RecordRow = {
  archetype: string
  wins: number
  losses: number
  total_matches: number
  win_rate: number
  win_rate_change?: number | null
}
type Period = { start_date: string; end_date: string; records: RecordRow[] }
type Marker = { id: number; name: string; start_date: string; entrant_count: number }
const percent = (n: number | null | undefined) => n == null ? '—' : `${(n * 100).toFixed(1)}%`

export default function ExploratoryStats({ start, end, accessKey }: { start: string; end: string; accessKey: string }) {
  const [interval, setInterval] = useState<'month' | 'quarter'>('quarter')
  const [periods, setPeriods] = useState<Period[] | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [events, setEvents] = useState<Marker[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const load = async (selectedInterval: 'month' | 'quarter') => {
    setLoading(true); setError(''); setPeriods(null); setSelectedPeriod(''); setEvents(null)
    const base = import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL
    const get = async (name: string, extra = '') => {
      const query = new URLSearchParams({ start_date: start, end_date: end })
      const response = await fetch(`${base}/analysis/${name}?${query}${extra}`, { headers: { Authorization: `Bearer ${accessKey}` }, cache: 'no-store' })
      if (!response.ok) throw new Error(`Could not load ${name} (${response.status})`)
      return response.json()
    }
    try {
      const [trendResult, eventResult] = await Promise.all([
        get('win-rate-trends', `&interval=${selectedInterval}`), get('event-markers')
      ])
      const nextPeriods: Period[] = trendResult.periods
      setPeriods(nextPeriods)
      setSelectedPeriod([...nextPeriods].reverse().find(period => period.records.length > 0)?.start_date || nextPeriods[nextPeriods.length - 1]?.start_date || '')
      setEvents(eventResult.events)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load reports') }
    finally { setLoading(false) }
  }
  const period = periods?.find(item => item.start_date === selectedPeriod)
  const tiers = useMemo(() => {
    const ranked = (period?.records || [])
      .filter(record => record.total_matches >= 10)
      .map(record => ({ ...record, score: record.win_rate * Math.log(record.total_matches) }))
    const best = Math.max(0, ...ranked.map(record => record.score))
    return ranked
      .map(record => {
        const relative = best ? record.score / best : null
        return { ...record, relative, tier: relative == null ? null : relative >= 0.8 ? 1 : relative >= 0.6 ? 2 : 3 }
      })
      .sort((a, b) => b.score - a.score || a.archetype.localeCompare(b.archetype))
  }, [period])
  return <section className="space-y-3 border-t pt-5"><h2 className="text-xl font-semibold">Trends and experimental tiers</h2>
    <p className="text-sm text-muted-foreground">Recorded non-mirror win rates and changes from the preceding period. Large event markers have at least 65 entrants; win rates include all event sizes.</p>
    <label className="text-sm">Period <select disabled={loading || !start || !end || start > end} value={interval} onChange={e => { const next = e.target.value as 'month' | 'quarter'; setInterval(next); void load(next) }} className="ml-2 rounded border bg-background p-1"><option value="quarter">Quarterly</option><option value="month">Monthly</option></select></label>{' '}
    <button type="button" className="rounded border px-3 py-2 text-sm" disabled={loading || !start || !end || start > end} onClick={() => void load(interval)}>{loading ? 'Loading…' : 'Load trends and tiers for selected dates'}</button>
    {error && <p role="alert">{error}</p>}
    {periods && <>
      <h3 className="font-semibold">Experimental tiers</h3>
      <p className="text-sm text-muted-foreground">For the selected period only: win rate × log(matches), with a minimum of 10 recorded matches. Tier cutoffs are arbitrary; this ranking has not been validated as a measure of deck strength.</p>
      {periods.length > 0 && <label className="text-sm">Tier period <select className="ml-2 rounded border bg-background p-1" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>{periods.map(item => <option key={item.start_date} value={item.start_date}>{item.start_date} to {item.end_date}</option>)}</select></label>}
      <div className="overflow-x-auto"><table aria-label="Experimental tier ranking" className="w-full text-left text-sm"><thead><tr><th>Archetype</th><th>Tier</th><th>Wins</th><th>Losses</th><th>Matches</th><th>Win rate</th><th>Score</th><th>Relative score</th></tr></thead><tbody>{tiers.map(row => <tr className="border-t" key={row.archetype}><td>{row.archetype}</td><td>{row.tier ?? '—'}</td><td>{row.wins}</td><td>{row.losses}</td><td>{row.total_matches}</td><td>{percent(row.win_rate)}</td><td>{row.score.toFixed(2)}</td><td>{percent(row.relative)}</td></tr>)}</tbody></table>{tiers.length === 0 && <p className="text-sm text-muted-foreground">No archetypes have at least 10 recorded matches in this period.</p>}</div>
      <h3 className="font-semibold">{interval === 'month' ? 'Monthly' : 'Quarterly'} win rates</h3>{periods.map(item => <details key={item.start_date} className="rounded border p-2"><summary>{item.start_date} to {item.end_date} ({item.records.length} archetypes)</summary>{events?.filter(event => event.start_date.slice(0, 10) >= item.start_date && event.start_date.slice(0, 10) <= item.end_date).map(event => <p className="text-sm text-muted-foreground" key={event.id}>{event.start_date.slice(0, 10)} — {event.name} ({event.entrant_count} entrants)</p>)}<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Archetype</th><th>Matches</th><th>Win rate</th><th>Change</th></tr></thead><tbody>{item.records.map(row => <tr className="border-t" key={row.archetype}><td>{row.archetype}</td><td>{row.total_matches}</td><td>{percent(row.win_rate)}</td><td>{percent(row.win_rate_change)}</td></tr>)}</tbody></table></div></details>)}
    </>}
    {events && <details className="rounded border p-2"><summary>Large event dates ({events.length})</summary><ul className="text-sm">{events.map(event => <li key={event.id}>{event.start_date.slice(0, 10)} — {event.name} ({event.entrant_count} entrants)</li>)}</ul></details>}
  </section>
}
