import { useState } from 'react';
import { Users, Sparkles, X, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import bgAmbient from '../../assets/bg-ambient.webp';
import ambientAnim from '../../assets/ambient-anim.webp';

const STAGES = [
  { id: 'stage1', label: 'STAGE 1', title: 'Foundation' },
  { id: 'stage2', label: 'STAGE 2', title: 'Transformation' },
  { id: 'stage3', label: 'STAGE 3', title: 'Unity' },
];

function AuthModal({ onClose, onSuccess }) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const displayName = email.split('@')[0];
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-[360px] max-w-[90vw] bg-[#1a1510] rounded-3xl border border-white/10 shadow-2xl p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors">
          <X size={20} />
        </button>
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#d4a843]/30 to-[#d4a843]/5 border border-[#d4a843]/20 flex items-center justify-center mb-3">
            <Users size={22} className="text-[#d4a843]" />
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-100">
            {isSignUp ? 'Join the Field' : 'Welcome Back'}
          </h2>
          <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mt-1 font-bold">
            {isSignUp ? 'Create your spirit account' : 'Sign in to continue'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-9 pr-3 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-[#d4a843]/40 transition-colors" required />
          </div>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-9 pr-10 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-[#d4a843]/40 transition-colors" required minLength={6} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {error && <p className="text-red-400 text-[11px] text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-[#d4a843]/20 hover:bg-[#d4a843]/30 text-[#d4a843] py-3 rounded-xl font-bold tracking-[0.2em] text-xs transition-all border border-[#d4a843]/20 hover:border-[#d4a843]/40 disabled:opacity-50">
            {loading ? 'Connecting...' : isSignUp ? 'ENTER THE FIELD' : 'SIGN IN'}
          </button>
        </form>
        <p className="mt-5 text-center text-[11px] text-stone-500">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-[#d4a843] hover:underline underline-offset-2 font-medium">
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function MemberPracticesPortal({ onEnterField }) {
  const { user, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleStageClick = (stageId) => {
    if (authLoading) return;
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    onEnterField(stageId);
  };

  return (
    <div className="mt-12 w-full animate-fade-in">
      {/* Auth modal (unchanged) */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}

      {/* Stage tabs — Stage 1 highlighted as default */}
      <div className="flex gap-8 mb-5">
        {STAGES.map((stage, i) => (
          <button
            key={stage.id}
            onClick={() => handleStageClick(stage.id)}
            className={`text-[11px] tracking-[0.25em] font-bold transition-colors uppercase ${
              i === 0
                ? 'text-stone-600 underline underline-offset-4 decoration-stone-400/40'
                : 'text-stone-400/70 hover:text-stone-600'
            }`}
          >
            {stage.label}
          </button>
        ))}
      </div>

      {/* Rectangle card with ambient background */}
      <div className="relative h-[135px] rounded-2xl overflow-hidden">
        {/* Ambient background image + overlay */}
        <div className="absolute inset-0">
          <img
            src={bgAmbient}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#d6e4f0]/40 via-[#b8cfe0]/50 to-[#a0bcd4]/60" />
        </div>

        {/* Card content */}
        <div className="relative z-10 px-6 h-full flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 text-[#d4a843] mb-3">
            <Users size={14} />
            <span className="text-[9px] tracking-[0.3em] font-bold uppercase">
              Collective Meditation
            </span>
          </div>
          <h3 className="text-2xl font-serif font-bold text-stone-100 mb-2">
            Member Practices
          </h3>
          <p className="text-[13px] text-stone-400/80 max-w-[260px] leading-relaxed">
            Step into a shared space where practitioners gather in real time.
          </p>
        </div>
      </div>

      {/* Animated WebP — clickable, linked to Stage 1 */}
      <button
        onClick={() => handleStageClick('stage1')}
        className="relative mt-5 w-full block cursor-pointer group"
      >
        <img
          src={ambientAnim}
          alt="Enter Stage 1"
          className="w-full rounded-lg transition-opacity group-hover:opacity-90"
        />
        {/* Play hint overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="size-12 rounded-full bg-[#d4a843]/80 flex items-center justify-center shadow-lg backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5">
              <polygon points="8,5 19,12 8,19" />
            </svg>
          </div>
        </div>
      </button>

      {/* Status line */}
      <div className="mt-3 flex justify-center items-center gap-2 text-[10px] tracking-wider text-stone-400 uppercase font-bold">
        <Sparkles size={12} className="text-[#d4a843]" />
        Synchrony Active · 128 Spirits Online
      </div>
    </div>
  );
}
