import { Activity, CircleDot, Home, Moon, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Home', Icon: Home, to: '/home' },
  { label: 'Meditate', Icon: CircleDot, to: '/meditate' },
  { label: 'Sleep', Icon: Moon, to: '/sleep' },
  { label: 'Taomony Eating', Icon: Activity, to: '/tao-weight' },
  { label: 'Resonance', Icon: Users, to: '/harmony-resonance' },
]

function BottomNav() {
  return (
    <nav
      className="sticky bottom-0 z-10 border-t border-black/5 bg-white/80 backdrop-blur-lg"
      aria-label="Primary"
    >
      <ul className="flex">
        {navItems.map(({ label, Icon, to }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end
              className={({ isActive }) =>
                [
                  'flex w-full flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] transition-colors',
                  isActive
                    ? 'border-t-2 border-stone-900 text-stone-900'
                    : 'border-t-2 border-transparent text-stone-400',
                ].join(' ')
              }
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default BottomNav
