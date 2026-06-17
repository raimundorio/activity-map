import { useAuth } from './hooks/useAuth'
import { AuthForm } from './components/auth/AuthForm'
import { MapPage } from './pages/MapPage'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    )
  }

  return user ? <MapPage /> : <AuthForm />
}
