'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useFlag } from '../context/FeatureFlagContext';
import AnnouncementBanner from './AnnouncementBanner';

export default function Navbar({ onAuthClick, rightContent }) {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const passportEnabled = useFlag('passport_page');
  const buddyEnabled    = useFlag('travel_buddy');
  const exploreEnabled  = useFlag('explore_page');
  const paymentsEnabled = useFlag('payments_enabled');

  const navLinks = [
    ...(exploreEnabled  ? [{ href: '/explore',      label: 'Explore' }]       : []),
    { href: '/my-trips',   label: 'My Trips' },
    ...(passportEnabled ? [{ href: '/passport',     label: 'Passport' }]      : []),
    ...(buddyEnabled    ? [{ href: '/travel-buddy', label: 'Travel Buddy' }]  : []),
  ];

  return (
    <>
      <AnnouncementBanner />
      <header className="border-b border-line bg-paper/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-5 py-3.5 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center shadow-warm-sm group-hover:bg-ink-soft transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="2.5" fill="#F97316" />
                <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2" stroke="#FAF6EE" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M3.6 3.6l1.4 1.4M11 11l1.4 1.4M11 3.6l-1.4 1.4M5 11l-1.4 1.4" stroke="#FAF6EE" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <span className="font-serif text-lg font-semibold text-ink tracking-tight">Journeo</span>
              <p className="text-[10px] text-ink-muted leading-none hidden sm:block font-mono tracking-wider mt-0.5">AI TRAVEL PLANNER</p>
            </div>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 mr-auto ml-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-ink-muted hover:text-ink px-3 py-1.5 rounded-lg hover:bg-line-soft transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {rightContent}

            {loading ? null : user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 bg-paper-warm hover:bg-line border border-line rounded-xl transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-saffron flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-ink-soft max-w-[130px] truncate">{user.email}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-xs px-3 py-2 rounded-lg bg-paper-warm hover:bg-line border border-line text-ink-muted hover:text-ink transition-all"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => onAuthClick?.('login')}
                  className="text-sm px-3 py-2 rounded-lg text-ink-muted hover:text-ink transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => onAuthClick?.('register')}
                  className="text-sm px-4 py-2 rounded-xl bg-ink hover:bg-ink-soft text-paper font-medium transition-colors shadow-warm-sm"
                >
                  Get started
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden flex flex-col items-center justify-center w-9 h-9 rounded-xl bg-paper-warm border border-line transition-colors hover:bg-line"
              aria-label="Menu"
            >
              <span className={`block w-4 h-0.5 bg-ink rounded transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-[3px]' : ''}`} />
              <span className={`block w-4 h-0.5 bg-ink rounded my-[3px] transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-4 h-0.5 bg-ink rounded transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-[3px]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-line bg-paper px-4 py-4 space-y-1 animate-slide-down">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center px-3 py-2.5 rounded-xl text-sm text-ink-soft hover:text-ink hover:bg-paper-warm transition-all"
              >
                {link.label}
              </Link>
            ))}

            {!loading && (
              <div className="border-t border-line pt-3 mt-3">
                {user ? (
                  <div className="space-y-1">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-paper-warm transition-all"
                    >
                      <div className="w-7 h-7 rounded-full bg-saffron flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink truncate max-w-[200px]">{user.email}</p>
                        <p className="text-[11px] text-ink-muted">{paymentsEnabled ? 'View profile & subscription' : 'View profile'}</p>
                      </div>
                    </Link>
                    {paymentsEnabled && (
                      <Link
                        href="/pricing"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center px-3 py-2.5 rounded-xl text-sm text-ink-soft hover:text-ink hover:bg-paper-warm transition-all"
                      >
                        ★ Pricing & Pro
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-ink-muted hover:text-rose hover:bg-rose-subtle transition-all"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onAuthClick?.('login'); setMenuOpen(false); }}
                      className="flex-1 text-sm py-2.5 rounded-xl text-ink-soft bg-paper-warm border border-line hover:bg-line transition-colors text-center"
                    >
                      Sign in
                    </button>
                    <button
                      onClick={() => { onAuthClick?.('register'); setMenuOpen(false); }}
                      className="flex-1 text-sm py-2.5 rounded-xl text-paper bg-ink font-medium transition-colors text-center"
                    >
                      Get started
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}
