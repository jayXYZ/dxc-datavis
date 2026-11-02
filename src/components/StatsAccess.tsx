import { useState, type FormEvent } from 'react'
import Stats from '@/components/Stats'
import { DEFAULT_API_BASE_URL } from '@/lib/defaults'

export default function StatsAccess() {
  const [input, setInput] = useState('')
  const [accessKey, setAccessKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const authenticate = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const base = import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL
      const response = await fetch(`${base}/analysis/stats-access`, {
        headers: { Authorization: `Bearer ${input}` }, cache: 'no-store',
      })
      if (response.status === 404) throw new Error('Statistics access is not available on this server.')
      if (response.status === 503) throw new Error('Statistics access is not configured.')
      if (!response.ok) throw new Error('Could not authenticate with that access key.')
      setAccessKey(input)
      setInput('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not authenticate.')
    } finally { setLoading(false) }
  }
  if (accessKey) return <main className="min-h-screen bg-background text-foreground">
    <nav className="flex gap-4 border-b px-4 py-3"><a href="/">Matchups</a><button type="button" onClick={() => setAccessKey(null)}>Sign out</button></nav>
    <Stats accessKey={accessKey} />
  </main>
  return <main className="min-h-screen bg-background p-6 text-foreground">
    <a href="/" className="text-sm underline">Back to matchups</a>
    <form onSubmit={authenticate} className="mt-8 max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Statistics access</h1>
      <label className="block text-sm" htmlFor="stats-key">Access key</label>
      <input id="stats-key" type="password" autoComplete="off" required value={input} onChange={event => setInput(event.target.value)} className="w-full rounded border bg-background p-2" />
      {error && <p role="alert" className="text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="rounded border px-3 py-2 text-sm">{loading ? 'Checking…' : 'Unlock statistics'}</button>
    </form>
  </main>
}
