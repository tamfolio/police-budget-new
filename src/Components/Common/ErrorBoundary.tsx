import { Component, type ReactNode } from 'react'
import { WarningCircle, ArrowCounterClockwise } from '@phosphor-icons/react'
import { getErrorMessage } from '../../utils/errorHandlers'

interface Props {
  children: ReactNode
}

interface State {
  error: unknown
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: unknown) {
    return { error }
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    console.error('Unhandled render error:', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <WarningCircle size={28} className="text-red-500" weight="fill" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">Something went wrong</h3>
          <p className="text-sm text-slate-500 max-w-md mb-4">{getErrorMessage(this.state.error)}</p>
          <button
            onClick={this.reset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <ArrowCounterClockwise size={15} /> Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
