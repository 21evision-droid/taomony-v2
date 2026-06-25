import { useAuth } from '../../contexts/AuthContext';
import { MEMBER_SINCE } from '../../data/profileData';

export default function ProfileHeader() {
  const { user, profile } = useAuth();

  const displayName = profile?.display_name || user?.email || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const email = user?.email || '';

  return (
    <div className="flex flex-col items-center py-6">
      {/* Avatar */}
      <div className="flex size-[72px] items-center justify-center rounded-full bg-[#d4a843]/20 text-[28px] font-bold text-[#d4a843] shadow-sm">
        {avatarLetter}
      </div>

      {/* Display Name */}
      <h2 className="mt-4 text-lg font-semibold text-[#2c2416] truncate max-w-[280px] text-center">
        {displayName}
      </h2>

      {/* Email */}
      {email && (
        <p className="mt-0.5 text-sm text-[#5a4a3a] opacity-70 truncate max-w-[280px]">
          {email}
        </p>
      )}

      {/* Member Since */}
      <p className="mt-2 text-xs text-[#5a4a3a] opacity-50 tracking-wide">
        Member since {MEMBER_SINCE}
      </p>
    </div>
  );
}
