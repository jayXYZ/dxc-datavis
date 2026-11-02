import { useEffect, useState } from 'react'
import { DEFAULT_API_BASE_URL } from '@/lib/defaults'
import ExploratoryStats from '@/components/ExploratoryStats'

type Row = { archetype: string; [key: string]: string | number | boolean | null }
type Report = { archetypes: Row[]; eligible_events: number; [key: string]: unknown }
const pct = (value: unknown) => typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '—'
const number = (value: unknown) => typeof value === 'number' ? value.toLocaleString() : '—'
const yesNo = (value: unknown) => typeof value === 'boolean' ? (value ? 'Yes' : 'No') : '—'

export default function Stats() {
  const [start, setStart] = useState('2024-01-01')
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10))
  const [allEvents, setAllEvents] = useState(false)
  const [reports, setReports] = useState<Report[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!start || !end || start > end) return
    const controller = new AbortController()
    const base = import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL
    const load = async () => {
      setReports(null)
      setError('')
      try {
        const urls = ['top-eight', 'field-metagame', 'winners-metagame'].map(name => {
          const query = new URLSearchParams({ start_date: start, end_date: end, min_entrants: String(allEvents ? (name === 'field-metagame' ? 1 : 0) : 65) })
          return `${base}/analysis/${name}?${query}`
        })
        const results = await Promise.all(urls.map(async url => {
          const response = await fetch(url, { signal: controller.signal })
          if (!response.ok) throw new Error(`Could not load statistics (${response.status})`)
          return response.json() as Promise<Report>
        }))
        setReports(results)
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Could not load statistics')
      }
    }
    void load()
    return () => controller.abort()
  }, [start, end, allEvents])
  const [top, field, winners] = reports || []
  const table = (rows: Row[], columns: [string, string, (value: unknown) => string][]) => (
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Archetype</th>{columns.map(([key, label]) => <th className="p-2" key={key}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr className="border-t" key={row.archetype}><td className="p-2">{row.archetype}</td>{columns.map(([key, , format]) => <td className="p-2" key={key}>{format(row[key])}</td>)}</tr>)}</tbody></table>{rows.length === 0 && <p className="p-2 text-sm text-muted-foreground">No data for this selection.</p>}</div>
  )
  return <section className="space-y-6 p-4 sm:p-6">
    <h1 className="text-2xl font-semibold">Metagame statistics</h1>
    <div className="flex flex-wrap items-end gap-4"><label className="text-sm">From <input className="ml-2 rounded border bg-background p-1" type="date" value={start} onChange={e => setStart(e.target.value)} /></label><label className="text-sm">Through <input className="ml-2 rounded border bg-background p-1" type="date" value={end} onChange={e => setEnd(e.target.value)} /></label><label className="text-sm"><input type="checkbox" checked={allEvents} onChange={e => setAllEvents(e.target.checked)} /> Include events with fewer than 65 entrants</label></div>
    {start > end && <p role="alert">The start date must be before the end date.</p>}
    {error && <p role="alert">{error}</p>}
    {!reports && !error && start <= end && <p role="status">Loading statistics…</p>}
    {top && field && winners && <>
      <section className="space-y-2"><h2 className="text-xl font-semibold">Verified playoff top eight</h2><p className="text-sm text-muted-foreground">{number((top.event_ids as number[]).length)} of {number(top.eligible_events)} selected events have a complete verified bracket; {number(top.known_top_eight)} of {number(top.top_eight_slots)} slots have classified decks. The top 4 and top 8 columns count those eliminated in that round. Placement points are 8 / 4 / 2 / 1 by finish; playoff wins and losses are inferred from finish. Conversion uses only completely classified fields.</p><p className="text-sm">Gini: {typeof top.top_eight_gini === 'number' ? top.top_eight_gini.toFixed(3) : '—'} · Gini–Simpson: {typeof top.top_eight_gini_simpson === 'number' ? top.top_eight_gini_simpson.toFixed(3) : '—'}</p>{table(top.archetypes, [['finish_1', '1st', number], ['finish_2', '2nd', number], ['finish_4', 'Top 4', number], ['finish_8', 'Top 8', number], ['top_eight', 'Total top eight', number], ['top_eight_share', 'Share', pct], ['placement_points', 'Placement points', number], ['top_eight_conversion', 'Conversion', pct], ['playoff_wins', 'Playoff wins', number], ['playoff_losses', 'Playoff losses', number], ['playoff_win_rate', 'Playoff win rate', pct]])}</section>
      <section className="space-y-2"><h2 className="text-xl font-semibold">Field metagame</h2><p className="text-sm text-muted-foreground">Only fully classified fields contribute to shares: {number(field.complete_field_entrants)} of {number(field.entrants)} selected entrants. Spice means less than 2% of this field.</p><p className="text-sm">Gini: {typeof field.gini === 'number' ? field.gini.toFixed(3) : '—'} · Gini–Simpson: {typeof field.gini_simpson === 'number' ? field.gini_simpson.toFixed(3) : '—'} · Spice share: {pct(field.spice_field_share)}</p>{table(field.archetypes, [['entrants', 'Entrants', number], ['field_share', 'Field share', pct], ['is_spice', 'Spice', yesNo]])}</section>
      <section className="space-y-2"><h2 className="text-xl font-semibold">Winner’s metagame</h2><p className="text-sm text-muted-foreground">Positive recorded match wins minus losses per player and event, including mirrors. Shares use classified net wins only; missing matches may change results. {number(winners.recorded_matches)} recorded matches; {number(winners.unclassified_net_wins)} unclassified and {number(winners.unregistered_net_wins)} unregistered net wins excluded.</p>{table(winners.archetypes, [['net_wins', 'Net wins', number], ['winner_share', 'Share', pct]])}</section>
      <p className="text-sm text-muted-foreground">Gini measures inequality among observed archetype counts; Gini–Simpson measures diversity. Both depend on how decks are classified.</p>
    </>}
    <ExploratoryStats key={`${start}-${end}`} start={start} end={end} />
  </section>
}
