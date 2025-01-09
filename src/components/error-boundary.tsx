import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
	children: ReactNode
}

interface State {
	hasError: boolean
	error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
	}

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error }
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('Uncaught error:', error, errorInfo)
	}

	public render() {
		if (this.state.hasError) {
			return (
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<h2 className="text-xl font-bold mb-4">Something went wrong</h2>
						<p className="text-red-500">{this.state.error?.message}</p>
						<button
							className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							onClick={() => window.location.reload()}
						>
							Reload Page
						</button>
					</div>
				</div>
			)
		}

		return this.props.children
	}
} 