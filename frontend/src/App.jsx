import React, { useState } from 'react';
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

export function AppContent() {
  const [activePage, setActivePage] = useState('landing');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const { user: currentUser, logout } = useAuth();

  const handleNavigate = (pageId) => {
    setActivePage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProposal = (proposal) => {
    setSelectedProposal(proposal);
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        activePage === 'landing' ? '' : 'bg-white dark:bg-[#05080A]'
      } text-black dark:text-white transition-colors duration-300`}
    >
      {/* Sticky Top Navigation */}
      <Navbar
        activePage={activePage}
        setActivePage={handleNavigate}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        onLogout={logout}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activePage === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activePage === 'student' && (
          <StudentDashboard
            onNavigate={handleNavigate}
            onSelectProposal={handleSelectProposal}
          />
        )}

        {activePage === 'wizard' && (
          <ProposalWizard onNavigate={handleNavigate} />
        )}

        {activePage === 'approvals' && (
          <ApprovalInbox
            selectedProposal={selectedProposal}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'finance' && (
          <FinanceDesk onNavigate={handleNavigate} />
        )}

        {activePage === 'calendar' && (
          <ResourceCalendar onNavigate={handleNavigate} />
        )}
      </main>

      {/* Floating Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
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
