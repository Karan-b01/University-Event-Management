import React from 'react';
import { Landmark, ShieldCheck, User, LogIn, ChevronDown } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';
import Button from '../common/Button';

export const Navbar = ({
  activePage,
  setActivePage,
  onOpenAuth,
  currentUser,
  onLogout,
}) => {
  // Role-based link resolution
  const getNavItems = () => {
    if (!currentUser || !currentUser.role) return [];

    const role = currentUser.role;

    if (role === 'Student Organizer' || role === 'Student') {
      return [
        { id: 'student', label: 'Dashboard' },
        { id: 'wizard', label: 'Submit Proposal' },
        { id: 'calendar', label: 'Venue Calendar' },
      ];
    }

    if (role === 'Faculty Advisor' || role === 'Security Officer') {
      return [
        { id: 'student', label: 'Dashboard' },
        { id: 'approvals', label: 'Approval Inbox' },
        { id: 'calendar', label: 'Venue Calendar' },
      ];
    }

    if (role === 'Finance Officer') {
      return [
        { id: 'student', label: 'Dashboard' },
        { id: 'finance', label: 'Finance Desk' },
        { id: 'approvals', label: 'Approval Inbox' },
      ];
    }

    if (role === 'Admin') {
      return [
        { id: 'student', label: 'Dashboard' },
        { id: 'wizard', label: 'Submit Proposal' },
        { id: 'approvals', label: 'Approval Inbox' },
        { id: 'finance', label: 'Finance Desk' },
        { id: 'calendar', label: 'Venue Calendar' },
      ];
    }

    // Default fallback for any other authenticated role
    return [
      { id: 'student', label: 'Dashboard' },
      { id: 'calendar', label: 'Venue Calendar' },
    ];
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-40 w-full border-b transition-colors duration-300
      bg-white/90 backdrop-blur-md border-zinc-200
      dark:bg-[#05080A]/90 dark:backdrop-blur-md dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setActivePage('landing')}
        >
          <div className="w-10 h-10 rounded flex items-center justify-center transition-all duration-300
            bg-black text-white group-hover:bg-zinc-800
            dark:bg-emerald-500/10 dark:border dark:border-emerald-500/40 dark:text-emerald-400 dark:group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg tracking-tight text-zinc-950 dark:text-white">
                UniEvent
              </span>
              <span className="font-serif italic font-normal text-sm text-zinc-500 dark:text-emerald-400/80">
                Veritas
              </span>
            </div>
            <p className="text-[10px] tracking-widest uppercase font-semibold text-zinc-400 dark:text-slate-400 font-sans hidden sm:block">
              Compliance & Event Management
            </p>
          </div>
        </div>

        {/* Navigation Links - Only rendered when authenticated */}
        {currentUser && navItems.length > 0 && (
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded font-sans transition-all duration-200 ${
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30'
                      : 'text-zinc-600 hover:text-black hover:bg-zinc-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right side controls: ThemeToggle + Auth */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-zinc-900 dark:text-white font-sans">
                  {currentUser.name || currentUser.email}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-sans">
                  {currentUser.email ? `${currentUser.email} • ` : ''}
                  <strong className="text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {currentUser.role}
                  </strong>
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={onLogout}
                className="text-xs"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={LogIn}
              onClick={onOpenAuth}
              className="text-xs font-semibold"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Mobile nav pills bar - Only rendered when authenticated */}
      {currentUser && navItems.length > 0 && (
        <div className="lg:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#090D10]">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap rounded font-sans transition-all ${
                  isActive
                    ? 'bg-black text-white dark:bg-emerald-500 dark:text-black font-bold'
                    : 'text-zinc-600 dark:text-slate-400'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default Navbar;
