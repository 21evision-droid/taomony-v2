import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate('/home');
      } else {
        await signUp(email, password, displayName);
        // After signup, Supabase sends a confirmation email by default
        setError(''); // clear any errors
        setMode('check-email');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // After signup, show confirmation message
  if (mode === 'check-email') {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{ background: '#f5efe6' }}
      >
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#d4a843] text-3xl text-white">
            ✉
          </div>
          <h2 className="mb-2 font-serif text-xl font-bold text-[#2c2416]">
            Check Your Email
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-[#5a4a3a] opacity-70">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
            Please verify your email to complete registration.
          </p>
          <button
            onClick={() => { setMode('login'); setEmail(''); setPassword(''); }}
            className="w-full cursor-pointer rounded-full bg-[#2c2416] px-4 py-3 text-sm font-medium text-[#faf6ef] transition-colors hover:bg-[#b8860b] border-none font-sans"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{ background: '#f5efe6' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-[#d4a843] font-serif text-2xl font-bold text-[#2c2416]">
            道
          </div>
          <h1 className="font-serif text-xl font-bold tracking-wider text-[#2c2416]">
            TAOMONY
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white px-6 py-8 shadow-xl">
          <h2 className="mb-6 text-center font-serif text-lg font-semibold text-[#2c2416]">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>

          {mode === 'signup' && (
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-[#5a4a3a]">Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How would you like to be called?"
                className="w-full rounded-lg border border-[#e0d5c0] bg-[#faf6ef] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#d4a843] focus:bg-white font-sans"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-[#5a4a3a]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-[#e0d5c0] bg-[#faf6ef] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#d4a843] focus:bg-white font-sans"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-xs font-medium text-[#5a4a3a]">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-[#e0d5c0] bg-[#faf6ef] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#d4a843] focus:bg-white font-sans"
            />
          </div>

          {error && (
            <p className="mb-4 text-center text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-full bg-[#2c2416] px-4 py-3 text-sm font-semibold text-[#faf6ef] transition-colors hover:bg-[#b8860b] disabled:opacity-50 font-sans border-none"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p className="mt-4 text-center text-xs text-[#5a4a3a] opacity-60">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); }}
                  className="cursor-pointer bg-transparent text-[#b8860b] underline border-none font-sans text-xs"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="cursor-pointer bg-transparent text-[#b8860b] underline border-none font-sans text-xs"
                >
                  Sign In
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
