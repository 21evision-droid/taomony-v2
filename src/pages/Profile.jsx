import { useAuth } from '../contexts/AuthContext';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileStats from '../components/profile/ProfileStats';
import RankingTimeline from '../components/profile/RankingTimeline';
import CommentActivity from '../components/profile/CommentActivity';

export default function Profile() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="pb-6 pt-2">
        <div className="flex items-center justify-center py-20">
          <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-3 border-[#e0d5c0] border-t-[#b8860b]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pb-6 pt-2">
        <div className="px-4" style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="py-16 text-center text-sm text-[#5a4a3a] opacity-50">
            <div className="mb-3 text-5xl opacity-30">👤</div>
            <p>Please sign in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8 pt-2">
      <div className="px-4" style={{ maxWidth: 480, margin: '0 auto' }}>
        <ProfileHeader />
        <ProfileStats />
        <RankingTimeline />
        <CommentActivity />
      </div>
    </div>
  );
}
