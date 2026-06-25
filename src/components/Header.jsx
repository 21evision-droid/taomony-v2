import { Link } from 'react-router-dom';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { user, profile, signOut } = useAuth();

  return (
    <header
      className="sticky top-0 z-30"
      style={{ background: 'linear-gradient(135deg, #2c2416 0%, #3d3222 100%)' }}
    >
      <div className="mx-auto flex max-w-[480px] items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-[34px] items-center justify-center rounded-full bg-[#d4a843] font-serif text-lg font-bold text-[#2c2416] shrink-0">
            道
          </div>
          <div>
            <h1 className="font-serif text-xl font-semibold tracking-[3px] text-[#faf6ef] leading-tight">
              TAOMONY
            </h1>
            <span className="text-[10px] tracking-[1px] text-[#d4a843] opacity-80">
              Ancient Wisdom · Modern Life
            </span>
          </div>
        </div>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2 no-underline"
              >
                <span className="hidden text-xs text-[#d4a843] sm:block">
                  {profile?.display_name || user.email}
                </span>
                <div className="flex size-[30px] items-center justify-center rounded-full bg-[#d4a843]/20 text-xs text-[#d4a843]">
                  {(profile?.display_name || user.email || '?').charAt(0).toUpperCase()}
                </div>
              </Link>
              <button
                onClick={signOut}
                className="flex cursor-pointer items-center gap-1 text-[10px] text-[#faf6ef] opacity-60 transition-opacity hover:opacity-100 bg-transparent border-none font-sans"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <a
              href="/login"
              className="flex items-center gap-1 text-[11px] text-[#d4a843] no-underline opacity-90 transition-opacity hover:opacity-100"
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
