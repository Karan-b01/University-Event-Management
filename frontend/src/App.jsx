import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import AuthModal from './components/auth/AuthModal';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import ProposalWizard from './pages/ProposalWizard';
import ApprovalInbox from './pages/ApprovalInbox';
import FinanceDesk from './pages/FinanceDesk';
import ResourceCalendar from './pages/ResourceCalendar';
import { MOCK_USER } from './data/mockData';

export function AppContent() {
  const [activePage, setActivePage] = useState('landing');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(MOCK_USER);
  const [selectedProposal, setSelectedProposal] = useState(null);

  const handleNavigate = (pageId) => {
    setActivePage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProposal = (proposal) => {
    setSelectedProposal(proposal);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black dark:bg-[#05080A] dark:text-white transition-colors duration-300">
      {/* Sticky Top Navigation */}
      <Navbar
        activePage={activePage}
        setActivePage={handleNavigate}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
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
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
