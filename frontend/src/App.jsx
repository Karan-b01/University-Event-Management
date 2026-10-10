import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertOctagon, X } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import AuthModal from './components/auth/AuthModal';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import ProposalWizard from './pages/ProposalWizard';
import ApprovalInbox from './pages/ApprovalInbox';
import FinanceDesk from './pages/FinanceDesk';
import ResourceCalendar from './pages/ResourceCalendar';
import UserManagement from './pages/UserManagement';

const PATH_TO_PAGE = {
  '/': 'landing',
  '/dashboard': 'student',
  '/student': 'student',
  '/wizard': 'wizard',
  '/submit-proposal': 'wizard',
  '/approvals': 'approvals',
  '/finance': 'finance',
  '/calendar': 'calendar',
  '/users': 'users',
};

const PAGE_TO_PATH = {
  landing: '/',
  student: '/dashboard',
  wizard: '/wizard',
  approvals: '/approvals',
  finance: '/finance',
  calendar: '/calendar',
  users: '/users',
};

function getPageFromPath(path) {
  const normalized = (path || '/').toLowerCase().replace(/\/+$/, '') || '/';
  return PATH_TO_PAGE[normalized] || 'landing';
}

/**
 * ProtectedRoute Component
 * Restricts access to children components based on currentUser and allowedRoles.
 * If unauthorized, immediately calls onUnauthorized to redirect and toast.
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  currentUser,
  pageName,
  onUnauthorized,
}) {
  const isAuthorized = useMemo(() => {
    if (!currentUser) return false;
    if (allowedRoles && allowedRoles.length > 0) {
      const userRoles = currentUser.roles?.length
        ? currentUser.roles
        : currentUser.role
          ? [currentUser.role]
          : [];
      return userRoles.some((role) => allowedRoles.includes(role));
    }
    return true;
  }, [currentUser, allowedRoles]);

  useEffect(() => {
    if (!currentUser) {
      onUnauthorized('landing', 'Authentication required. Please sign in to access this portal.');
    } else if (
      allowedRoles &&
      allowedRoles.length > 0 &&
      !(currentUser.roles?.length ? currentUser.roles : [currentUser.role]).some((role) =>
        allowedRoles.includes(role)
      )
    ) {
      onUnauthorized(
        'student',
        `Unauthorized: You do not have permission to access the ${pageName || 'requested page'}.`
      );
    }
  }, [currentUser, allowedRoles, onUnauthorized, pageName]);

  if (!isAuthorized) {
    return null;
  }

  return children;
}

/**
 * Toast Notification Component for RBAC access denials and security alerts
 */
function ToastNotification({ toast, onDismiss }) {
  if (!toast) return null;

  return (
    <div
      role="alert"
      className="fixed top-20 right-4 z-50 max-w-md w-full p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-slideIn bg-rose-50/95 border-rose-300 text-rose-950 dark:bg-rose-950/90 dark:border-rose-500/60 dark:text-rose-100"
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-rose-200/60 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 shrink-0 mt-0.5">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 font-sans">
            Access Denied • Unauthorized
          </h4>
          <p className="text-xs font-medium font-sans mt-0.5 leading-relaxed">
            {toast.message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-rose-500 hover:text-rose-800 dark:text-rose-400 dark:hover:text-white p-1 rounded-md transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function AppContent() {
  const [activePage, setActivePage] = useState(() => getPageFromPath(window.location.pathname));
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [toast, setToast] = useState(null);
  const { user: currentUser, logout } = useAuth();

  // Keep activePage synced with browser popstate (back / forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setActivePage(getPageFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-dismiss toast timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const handleNavigate = useCallback((pageId) => {
    const targetPath = PAGE_TO_PATH[pageId] || '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setActivePage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleUnauthorized = useCallback((redirectPage = 'student', message = 'Unauthorized: Access restricted.') => {
    const targetPath = PAGE_TO_PATH[redirectPage] || '/dashboard';
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({}, '', targetPath);
    }
    setActivePage(redirectPage);
    showToast(message, 'error');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [showToast]);

  const handleLogout = useCallback(() => {
    logout();
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }
    setActivePage('landing');
  }, [logout]);

  const handleSelectProposal = (proposal) => {
    setSelectedProposal(proposal);
  };

  return (
    <div
      className={`min-h-screen flex flex-col relative ${
        activePage === 'landing' ? '' : 'bg-white dark:bg-[#05080A]'
      } text-black dark:text-white transition-colors duration-300`}
    >
      {/* Toast Banner for RBAC Security & Unauthorized Alerts */}
      <ToastNotification toast={toast} onDismiss={() => setToast(null)} />

      {/* Sticky Top Navigation */}
      <Navbar
        activePage={activePage}
        setActivePage={handleNavigate}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main View Area with Protected Routes */}
      <main className="flex-1">
        {activePage === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activePage === 'student' && (
          <ProtectedRoute
            currentUser={currentUser}
            pageName="Dashboard"
            onUnauthorized={handleUnauthorized}
          >
            <StudentDashboard
              onNavigate={handleNavigate}
              onSelectProposal={handleSelectProposal}
            />
          </ProtectedRoute>
        )}

        {activePage === 'wizard' && (
          <ProtectedRoute
            allowedRoles={['Student Organizer', 'Admin']}
            currentUser={currentUser}
            pageName="Submit Proposal"
            onUnauthorized={handleUnauthorized}
          >
            <ProposalWizard onNavigate={handleNavigate} />
          </ProtectedRoute>
        )}

        {activePage === 'approvals' && (
          <ProtectedRoute
            allowedRoles={['Faculty Advisor', 'Security Officer', 'Finance Officer', 'Admin']}
            currentUser={currentUser}
            pageName="Approval Inbox"
            onUnauthorized={handleUnauthorized}
          >
            <ApprovalInbox
              selectedProposal={selectedProposal}
              onNavigate={handleNavigate}
            />
          </ProtectedRoute>
        )}

        {activePage === 'finance' && (
          <ProtectedRoute
            allowedRoles={['Finance Officer', 'Admin']}
            currentUser={currentUser}
            pageName="Finance Desk"
            onUnauthorized={handleUnauthorized}
          >
            <FinanceDesk onNavigate={handleNavigate} />
          </ProtectedRoute>
        )}

        {activePage === 'calendar' && (
          <ProtectedRoute
            currentUser={currentUser}
            pageName="Venue Calendar"
            onUnauthorized={handleUnauthorized}
          >
            <ResourceCalendar onNavigate={handleNavigate} />
          </ProtectedRoute>
        )}

        {activePage === 'users' && (
          <ProtectedRoute
            allowedRoles={['Admin']}
            currentUser={currentUser}
            pageName="User Access Administration"
            onUnauthorized={handleUnauthorized}
          >
            <UserManagement />
          </ProtectedRoute>
        )}
      </main>

      {/* Floating Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={() => {
          if (activePage === 'landing') {
            handleNavigate('student');
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
