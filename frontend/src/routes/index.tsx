import { createFileRoute } from '@tanstack/react-router'
import { DealDashboard } from '../components/DealDashboard'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return <DealDashboard />
}
