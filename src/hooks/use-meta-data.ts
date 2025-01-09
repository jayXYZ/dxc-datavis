import { useState, useEffect } from 'react'
import { ResultsData, ArchetypeRecord, MatchupData } from '@/components/MetaMatrix'

interface UseMetaDataReturn {
	matchupData: Record<string, Record<string, MatchupData>>
	archetypeRecords: Record<string, ArchetypeRecord>
	archetypes: string[]
	isLoading: boolean
	error: Error | null
}

const CACHE_DURATION = 1000 * 60 * 5 // 5 minutes
const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000 // 1 second

export function useMetaData(): UseMetaDataReturn {
	const [matchupData, setMatchupData] = useState<Record<string, Record<string, MatchupData>>>({})
	const [archetypeRecords, setArchetypeRecords] = useState<Record<string, ArchetypeRecord>>({})
	const [archetypes, setArchetypes] = useState<string[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	async function fetchWithRetry(url: string, attempts = RETRY_ATTEMPTS): Promise<Response> {
		try {
			const response = await fetch(url)
			if (!response.ok) {
				throw new Error(`Response status: ${response.status}`)
			}
			return response
		} catch (err) {
			if (attempts === 1) throw err
			await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
			return fetchWithRetry(url, attempts - 1)
		}
	}

	useEffect(() => {
		const controller = new AbortController()
		let isMounted = true

		const fetchAndSetData = async () => {
			try {
				setIsLoading(true)
				setError(null)

				// Check cache first
				const cachedData = localStorage.getItem('metaData')
				const cachedTimestamp = localStorage.getItem('metaDataTimestamp')

				if (cachedData && cachedTimestamp) {
					const isValid = Date.now() - Number(cachedTimestamp) < CACHE_DURATION
					if (isValid) {
						const parsed = JSON.parse(cachedData)
						setMatchupData(parsed.matchupData)
						setArchetypeRecords(parsed.archetypeRecords)
						setArchetypes(parsed.archetypes)
						setIsLoading(false)
						return
					}
				}

				// Fetch fresh data
				const response = await fetchWithRetry('https://mtg-data.fly.dev/matchup/cached')
				const data = await response.json()

				if (!isMounted) return

				if (data?.results) {
					const allArchetypes = Object.keys(data.results)
					const records: Record<string, ArchetypeRecord> = {}

					// Fetch all win rates in parallel
					await Promise.all(
						allArchetypes.map(async archetype => {
							const response = await fetchWithRetry(
								`https://mtg-data.fly.dev/archetype/overallrecord?archetype=${archetype}`
							)
							const record = await response.json()
							if (record) {
								records[archetype] = record
							}
						})
					)

					if (!isMounted) return

					const sortedArchetypes = [...allArchetypes].sort((a, b) => {
						const recordA = records[a]
						const recordB = records[b]
						const gamesA = recordA ? recordA.wins + recordA.losses : 0
						const gamesB = recordB ? recordB.wins + recordB.losses : 0
						return gamesB - gamesA
					})

					// Cache the data
					const cacheData = {
						matchupData: data.results,
						archetypeRecords: records,
						archetypes: sortedArchetypes,
					}
					localStorage.setItem('metaData', JSON.stringify(cacheData))
					localStorage.setItem('metaDataTimestamp', Date.now().toString())

					setMatchupData(data.results)
					setArchetypeRecords(records)
					setArchetypes(sortedArchetypes)
				}
			} catch (err) {
				if (isMounted) {
					setError(err instanceof Error ? err : new Error('Unknown error occurred'))
				}
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		fetchAndSetData()

		return () => {
			isMounted = false
			controller.abort()
		}
	}, [])

	return { matchupData, archetypeRecords, archetypes, isLoading, error }
} 