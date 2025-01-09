import './App.css'
import MetaMatrix from '@/components/MetaMatrix'
import { ThemeProvider } from '@/components/theme-provider'
import { useState, useCallback, useMemo } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import AppSidebar from '@/components/AppSidebar'
import { useMetaData } from '@/hooks/use-meta-data'
import { ErrorBoundary } from '@/components/error-boundary'

function App() {
	const { matchupData, archetypeRecords, archetypes, isLoading, error } = useMetaData()
	const [visibleArchetypes, setVisibleArchetypes] = useState<string[]>(archetypes)
	const [sortMethod, setSortMethod] = useState<'games' | 'winrate' | 'alpha'>('games')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

	const sortArchetypes = useCallback(
		(method: 'games' | 'winrate' | 'alpha', direction: 'asc' | 'desc', archList: string[] = archetypes) => {
			return [...archList].sort((a, b) => {
				if (method === 'games') {
					const recordA = archetypeRecords[a]
					const recordB = archetypeRecords[b]
					const gamesA = recordA ? recordA.wins + recordA.losses : 0
					const gamesB = recordB ? recordB.wins + recordB.losses : 0
					return direction === 'asc' ? gamesA - gamesB : gamesB - gamesA
				}
				if (method === 'winrate') {
					const recordA = archetypeRecords[a]
					const recordB = archetypeRecords[b]
					const winrateA = recordA ? recordA.wins / (recordA.wins + recordA.losses) : 0
					const winrateB = recordB ? recordB.wins / (recordB.wins + recordB.losses) : 0
					return direction === 'asc' ? winrateA - winrateB : winrateB - winrateA
				}
				return direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
			})
		},
		[archetypeRecords, archetypes]
	)

	const handleSort = useCallback(
		(method: 'games' | 'winrate' | 'alpha') => {
			if (method === sortMethod) {
				const newDirection = sortDirection === 'asc' ? 'desc' : 'asc'
				setSortDirection(newDirection)
				const sortedArchetypes = sortArchetypes(method, newDirection)
				setVisibleArchetypes(sortedArchetypes.filter(arch => visibleArchetypes.includes(arch)))
			} else {
				setSortMethod(method)
				setSortDirection('desc')
				const sortedArchetypes = sortArchetypes(method, 'desc')
				setVisibleArchetypes(sortedArchetypes.filter(arch => visibleArchetypes.includes(arch)))
			}
		},
		[sortMethod, sortDirection, sortArchetypes, visibleArchetypes]
	)

	const handleVisibilityChange = useCallback(
		(newVisible: string[]) => {
			setVisibleArchetypes(sortArchetypes(sortMethod, sortDirection, newVisible))
		},
		[sortArchetypes, sortMethod, sortDirection]
	)

	const sortedVisibleArchetypes = useMemo(
		() => sortArchetypes(sortMethod, sortDirection, visibleArchetypes),
		[sortArchetypes, sortMethod, sortDirection, visibleArchetypes]
	)

	if (error) {
		return (
			<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-lg text-red-500">Error loading data: {error.message}</div>
				</div>
			</ThemeProvider>
		)
	}

	if (isLoading) {
		return (
			<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-lg">Loading data...</div>
				</div>
			</ThemeProvider>
		)
	}

	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<ErrorBoundary>
				<SidebarProvider>
					<AppSidebar
						archetypes={archetypes}
						visibleArchetypes={visibleArchetypes}
						setVisibleArchetypes={handleVisibilityChange}
						sortMethod={sortMethod}
						sortDirection={sortDirection}
						onSort={handleSort}
					/>
					<MetaMatrix
						matchupData={matchupData}
						archetypeRecords={archetypeRecords}
						archetypes={sortedVisibleArchetypes}
					/>
				</SidebarProvider>
			</ErrorBoundary>
		</ThemeProvider>
	)
}

export default App
