import { Outlet, Link } from 'react-router-dom'
import { User as UserIcon, LogIn } from 'lucide-react'
import BottomNav from './components/BottomNav'
import DevPanel from './components/DevPanel'
import { useAuth } from './contexts/AuthContext'

function Layout() {
  const { user, profile } = useAuth()

  return (
    <div className="app-container">
      {/* Floating profile — top-right, no header bar */}
      <div className="absolute top-[52px] right-4 z-40">
        {user ? (
          <Link
            to="/profile"
            className="flex items-center justify-center size-[32px] rounded-full bg-black/30 backdrop-blur-sm text-white/60 hover:text-white/90 hover:bg-black/50 transition-all border border-white/10"
            title={profile?.display_name || user.email}
          >
            <span className="text-xs font-bold">
              {(profile?.display_name || user.email || '?').charAt(0).toUpperCase()}
            </span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center size-[32px] rounded-full bg-black/30 backdrop-blur-sm text-white/60 hover:text-white/90 hover:bg-black/50 transition-all border border-white/10"
            title="Sign In"
          >
            <LogIn size={14} />
          </Link>
        )}
      </div>

      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <Outlet />
      </main>
      <BottomNav />
      {import.meta.env.DEV && <DevPanel />}
    </div>
  )
}

export default Layout
