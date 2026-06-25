import { useState, useMemo, useEffect, useRef } from 'react';
import { X, MapPin, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import bgAmbient from '../../assets/bg-ambient.webp';
import CommentsSection from './CommentsSection';

function MeditatingFigure({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="6" r="3.5" />
      <path d="M12 10.5c-3 0-7 2-7.5 5 0 2.5 3 5 7.5 5s7.5-2.5 7.5-5c-.5-3-4.5-5-7.5-5z" />
    </svg>
  );
}

export default function VideoPlayerModal({ practice, embedUrl, onClose, stage }) {
  const { user } = useAuth();
  const [roomNumber] = useState(1);
  const [mySeatId, setMySeatId] = useState(null);
  const [otherUsers, setOtherUsers] = useState([]);
  const [hasStarted, setHasStarted] = useState(false);
  const channelRef = useRef(null);
  const mySeatRef = useRef(null);
  const TOTAL_SEATS = 30;
  const PHANTOM_COUNT = 15;

  const seats = useMemo(() => {
    return Array.from({ length: TOTAL_SEATS }).map((_, i) => {
      const angleDeg = (360 / TOTAL_SEATS) * i + 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      const radiusX = 175;
      const radiusY = 65;
      const x = Math.cos(angleRad) * radiusX;
      const y = Math.sin(angleRad) * radiusY;
      const yFactor = Math.sin(angleRad);
      const scale = 0.8 + yFactor * 0.4;
      const opacity = 0.6 + ((yFactor + 1) / 2) * 0.4;
      const zIndex = Math.floor((yFactor + 2) * 10);
      const colors = [
        'text-purple-400',
        'text-indigo-400',
        'text-blue-400',
        'text-teal-400',
      ];
      const glowColor = colors[i % colors.length];
      const isPhantom = i % 2 === 0;
      return { id: i + 1, x, y, scale, zIndex, opacity, glowColor, isPhantom };
    });
  }, []);

  // Ambient particles for atmosphere
  const particles = useMemo(() => {
    const items = [];
    // Stars (35)
    for (let i = 0; i < 35; i++) {
      items.push({
        type: 'star',
        x: 2 + Math.random() * 96,
        y: 2 + Math.random() * 65,
        size: 1 + Math.random() * 2,
        duration: 3 + Math.random() * 5,
        delay: Math.random() * 10,
      });
    }
    // Clouds (3)
    for (let i = 0; i < 3; i++) {
      items.push({
        type: 'cloud',
        x: -10 - Math.random() * 20,
        y: 15 + Math.random() * 45,
        width: 180 + Math.random() * 200,
        height: 30 + Math.random() * 40,
        duration: 30 + Math.random() * 20,
        delay: Math.random() * 25,
      });
    }
    // Ripples (3)
    for (let i = 0; i < 3; i++) {
      items.push({
        type: 'ripple',
        duration: 7 + Math.random() * 3,
        delay: i * 3.5,
      });
    }
    // Petals (7)
    for (let i = 0; i < 7; i++) {
      items.push({
        type: 'petal',
        x: 5 + Math.random() * 90,
        size: 5 + Math.random() * 3,
        duration: 10 + Math.random() * 8,
        delay: Math.random() * 18,
      });
    }
    return items;
  }, []);

  // Map seat ID to other user for quick lookup
  const otherUserBySeat = useMemo(() => {
    const map = {};
    otherUsers.forEach((u) => {
      map[u.seat_id] = u;
    });
    return map;
  }, [otherUsers]);

  // Supabase Realtime Presence subscription
  useEffect(() => {
    if (!user) return;

    const channelName = `room:stage${stage}-${roomNumber}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Shared handler: reads the latest presence state from the channel and
    // updates React state. Used both on 'presence.sync' events (user joins/leaves)
    // and as a force-init in the subscribe callback (ensures presence data is
    // captured even if the sync event doesn't fire on re-subscription).
    const processPresence = (ch) => {
      const state = ch.presenceState();
      const users = [];
      Object.values(state).forEach((entries) => {
        entries.forEach((entry) => {
          if (entry.user_id && entry.user_id !== user.id) {
            users.push(entry);
          }
        });
      });
      setOtherUsers(users);

      // Conflict resolution: if someone else has my seat, auto-reassign
      const myCurrentSeat = mySeatRef.current;
      if (myCurrentSeat) {
        const hasConflict = users.some((u) => u.seat_id === myCurrentSeat);
        if (hasConflict) {
          const occupiedSeats = new Set(users.map((u) => u.seat_id));
          let newSeat = null;
          for (let i = 2; i <= TOTAL_SEATS; i += 2) {
            if (!occupiedSeats.has(i) && i !== myCurrentSeat) {
              newSeat = i;
              break;
            }
          }
          if (newSeat) {
            mySeatRef.current = newSeat;
            ch.untrack();
            ch.track({
              user_id: user.id,
              seat_id: newSeat,
              display_name: user.email?.split('@')[0] || 'Spirit',
            });
            setMySeatId(newSeat);
          }
        }
      }
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        processPresence(channel);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          processPresence(channel);
          // Re-track on every (re)subscription — the Realtime client fires this
          // callback each time the WebSocket reconnects and re-subscribes.
          // Without this, a reconnect would leave the user's presence entry
          // orphaned until the next heartbeat (up to 20 s), by which time the
          // server may have already timed it out.
          const seat = mySeatRef.current;
          if (seat) {
            channel.track({
              user_id: user.id,
              seat_id: seat,
              display_name: user.email?.split('@')[0] || 'Spirit',
            });
          }
        }
      });

    channelRef.current = channel;

    // Periodic heartbeat: re-track presence every 20 s so the server doesn't
    // expire our presence entry. Only re-tracks if the user has joined (seat set).
    const heartbeat = setInterval(() => {
      const seat = mySeatRef.current;
      if (seat) {
        channel.track({
          user_id: user.id,
          seat_id: seat,
          display_name: user.email?.split('@')[0] || 'Spirit',
        });
      }
    }, 20000);

    return () => {
      clearInterval(heartbeat);
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
      // Note: mySeatRef is deliberately NOT reset here. The effect can re-run
      // (e.g. when |user| reference changes after a Supabase token refresh) and
      // the subscribe callback uses mySeatRef.current to re-track the user's
      // presence on the new channel. Resetting it here would orphan the user's
      // seat until they manually leave and rejoin.
    };
  }, [stage, roomNumber, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Username rotation: cycles through all real users every 5 s ---
  const [highlightedUserId, setHighlightedUserId] = useState(null);

  useEffect(() => {
    // Ordered list: self first (if joined), then other users
    const userIds = [];
    if (mySeatId && user) userIds.push(user.id);
    otherUsers.forEach((u) => userIds.push(u.user_id));

    if (userIds.length === 0) {
      setHighlightedUserId(null);
      return;
    }

    // Keep current highlight if still valid
    setHighlightedUserId((prev) => {
      if (prev && userIds.includes(prev)) return prev;
      return userIds[0];
    });

    const interval = setInterval(() => {
      setHighlightedUserId((prev) => {
        const idx = prev ? userIds.indexOf(prev) : -1;
        if (idx === -1 || idx + 1 >= userIds.length) return userIds[0];
        return userIds[idx + 1];
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [mySeatId, otherUsers, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const findAvailableSeat = () => {
    // Use the live channel presence state (not the React state which may be stale)
    const liveState = channelRef.current?.presenceState() || {};
    const occupiedSeats = new Set();
    Object.values(liveState).forEach((entries) => {
      entries.forEach((entry) => {
        if (entry.seat_id && entry.user_id !== user?.id) {
          occupiedSeats.add(entry.seat_id);
        }
      });
    });
    // Assign real users to EVEN-numbered seats (2,4,6,...,30).
    // Odd-numbered seats (1,3,5,...,29) are reserved for phantom figures.
    for (let i = 2; i <= TOTAL_SEATS; i += 2) {
      if (!occupiedSeats.has(i)) return i;
    }
    return null;
  };

  const handleToggleJoin = () => {
    if (!user || !channelRef.current) return;

    if (mySeatId) {
      // Leave
      channelRef.current.untrack();
      mySeatRef.current = null;
      setMySeatId(null);
      setHasStarted(false);
    } else {
      // Find an available even seat (using live channel state, not stale React state)
      const availableSeat = findAvailableSeat();
      if (!availableSeat) return; // Room full

      mySeatRef.current = availableSeat;
      setMySeatId(availableSeat);
      setHasStarted(true);

      channelRef.current.track({
        user_id: user.id,
        seat_id: availableSeat,
        display_name: user.email?.split('@')[0] || 'Spirit',
      });
    }
  };

  if (!practice) return null;

  const realUserCount = otherUsers.length + (mySeatId ? 1 : 0);
  const totalConnected = PHANTOM_COUNT + realUserCount;

  return (
    <div className="absolute inset-0 z-50 flex flex-col animate-fade-in overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={bgAmbient}
          alt=""
          className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
        />
        {hasStarted && (
          <iframe
            src={`${embedUrl}&autoplay=1&mute=1&controls=0&loop=1`}
            className="w-full h-full object-cover scale-[3.0] opacity-30 blur-3xl"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/75 to-black/95" />
      </div>

      {/* Ambient atmosphere */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {/* Particles */}
        {particles.map((p, i) => {
          switch (p.type) {
            case 'star':
              return (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: p.size,
                    height: p.size,
                    background: 'rgba(255,255,255,0.7)',
                    animation: `twinkle ${p.duration}s ease-in-out infinite`,
                    animationDelay: `${p.delay}s`,
                  }}
                />
              );
            case 'cloud':
              return (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: p.width,
                    height: p.height,
                    background: 'radial-gradient(ellipse, rgba(200,215,240,0.2) 0%, transparent 70%)',
                    filter: 'blur(25px)',
                    animation: `cloud-drift ${p.duration}s ease-in-out infinite`,
                    animationDelay: `${p.delay}s`,
                  }}
                />
              );
            case 'ripple':
              return (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: 350,
                    height: 130,
                    marginLeft: -175,
                    marginTop: -65,
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    animation: `ripple-expand ${p.duration}s ease-out infinite`,
                    animationDelay: `${p.delay}s`,
                  }}
                />
              );
            case 'petal':
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${p.x}%`,
                    top: '-3%',
                    width: p.size,
                    height: p.size,
                    borderRadius: '50% 0 50% 0',
                    background: 'rgba(255,200,190,0.45)',
                    boxShadow: '0 0 6px rgba(255,200,190,0.15)',
                    animation: `petal-fall ${p.duration}s ease-in-out infinite`,
                    animationDelay: `${p.delay}s`,
                  }}
                />
              );
            default:
              return null;
          }
        })}
      </div>

      {/* Top bar */}
      <div className="relative z-50 flex justify-between items-center p-6 w-full">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-mono text-slate-200">
            <MapPin size={12} className="text-amber-400" />
            ROOM #{roomNumber}
          </div>
          <div className="text-white/80 text-[10px] font-bold tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {totalConnected} SPIRITS
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-white/40 hover:text-white transition-colors"
        >
          <X size={28} />
        </button>
      </div>

      {/* Main field — now scrollable, containing everything after top bar */}
      <div className="relative flex-1 w-full flex flex-col items-center overflow-y-auto scrollbar-hide pb-8">
        {/* Center: guider video */}
        <div className="mt-2 relative z-10 flex flex-col items-center justify-center">
          <div className="absolute w-[220px] h-[220px] rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 60%)' }} />
          <div className="relative w-48 h-48 flex items-center justify-center">
            <div
              className="w-full h-full absolute inset-0 rounded-full overflow-hidden border border-white/5 shadow-[0_0_30px_rgba(255,255,255,0.03)] flex items-center justify-center"
              style={{
                maskImage: hasStarted
                  ? 'radial-gradient(circle, black 40%, transparent 75%)'
                  : undefined,
                WebkitMaskImage: hasStarted
                  ? 'radial-gradient(circle, black 40%, transparent 75%)'
                  : undefined,
              }}
            >
              {hasStarted ? (
                <iframe
                  src={`${embedUrl}&autoplay=1&modestbranding=1&rel=0`}
                  className="w-full h-full object-cover scale-[2.5]"
                  allow="autoplay; encrypted-media"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-white/40">
                  <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-white/10 animate-pulse" />
                  </div>
                  <span className="text-[9px] tracking-[0.3em] uppercase font-bold">
                    Awaiting
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-[-25px] text-[10px] tracking-[0.4em] text-[#d4a843] font-bold uppercase z-20">
            GUIDER: {practice.user_name}
          </div>
          <div className="mt-2 text-white/80 font-serif italic text-sm">
            {practice.title}
          </div>
        </div>

        {/* Seats */}
        <div
          className="mt-4 relative"
          style={{ width: '350px', height: '130px' }}
        >
          <div className="absolute inset-0 rounded-[100%] shadow-[0_0_60px_rgba(255,255,255,0.05)] bg-white/5 backdrop-blur-[2px]" />
          {seats.map((seat) => {
            const isMe = seat.id === mySeatId;
            const otherUser = otherUserBySeat[seat.id];
            const isOccupied = seat.isPhantom || isMe || !!otherUser;

            // Rotating username display
            let seatUserId = null;
            let seatDisplayName = '';
            if (isMe) {
              seatUserId = user?.id;
              seatDisplayName = user?.email?.split('@')[0] || 'Spirit';
            } else if (otherUser) {
              seatUserId = otherUser.user_id;
              seatDisplayName = otherUser.display_name || 'Spirit';
            }
            const isNameShowing = seatUserId !== null && seatUserId === highlightedUserId;

            const labelColor = isMe
              ? 'text-teal-200'
              : 'text-amber-200';
            return (
              <div
                key={seat.id}
                className="absolute flex items-center justify-center transition-all duration-1000"
                style={{
                  left: 175 + seat.x,
                  top: 65 + seat.y,
                  transform: `translate(-50%, -50%) scale(${seat.scale})`,
                  zIndex: seat.zIndex + 20,
                  opacity: seat.opacity,
                }}
              >
                {isOccupied ? (
                  <div className="relative group flex flex-col items-center">
                    <div
                      className={`w-12 h-12 transition-all duration-500 ${
                        isMe
                          ? 'text-teal-300 drop-shadow-[0_0_20px_#2dd4bf]'
                          : otherUser
                            ? 'text-amber-300 drop-shadow-[0_0_15px_#fbbf24]'
                            : seat.glowColor +
                              ' opacity-90 drop-shadow-[0_0_15px_currentColor]'
                      }`}
                    >
                      <MeditatingFigure className="w-full h-full" />
                    </div>
                    <div className="w-8 h-2 bg-black/60 blur-[3px] rounded-full mt-[-4px]" />
                    {seatUserId !== null && (
                      <div
                        className="absolute flex flex-col items-center z-50 transition-all duration-700"
                        style={{ top: '-38px', opacity: isNameShowing ? 1 : 0 }}
                      >
                        <span className="text-[11px] leading-none mb-[2px] drop-shadow-lg animate-thumb-bounce">👍</span>
                        <div className={`${labelColor} text-[9px] tracking-wider whitespace-nowrap animate-thumb-bounce`}>
                          {seatDisplayName}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={handleToggleJoin}
                    className="w-3 h-3 rounded-full border border-white/20 bg-white/10 hover:bg-white/40 transition-all cursor-pointer shadow-sm active:scale-150"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Quote + action button */}
        <div className="w-full flex flex-col items-center gap-6 mt-12 mb-6 z-50">
          <div className="text-stone-400 font-serif italic text-[11px] tracking-[0.2em] opacity-60">
            &ldquo;All beings practice together, returning to the one.&rdquo;
          </div>
          {mySeatId ? (
            <button
              onClick={handleToggleJoin}
              className="text-white/60 hover:text-white text-[10px] tracking-[0.3em] uppercase font-bold transition-all border-b border-transparent hover:border-white/40 pb-1"
            >
              LEAVE FIELD
            </button>
          ) : (
            <button
              onClick={handleToggleJoin}
              className="bg-white/10 hover:bg-white/20 text-white px-12 py-3.5 rounded-full font-bold tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all text-[10px] flex items-center gap-3 backdrop-blur-md border border-white/20"
            >
              <Play size={12} fill="currentColor" /> JOIN COLLECTIVE
            </button>
          )}
        </div>

        {/* Comments */}
        <CommentsSection canPost={!!mySeatId} />
      </div>
    </div>
  );
}
