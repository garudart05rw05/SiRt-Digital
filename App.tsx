
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import Dashboard from './pages/Dashboard.tsx';
import NewsFeed from './pages/NewsFeed.tsx';
import ResidentList from './pages/ResidentList.tsx';
import GalleryPage from './pages/GalleryPage.tsx';
import FinancePage from './pages/FinancePage.tsx';
import AdminPanel from './pages/AdminPanel.tsx';
import WelcomeScreen from './pages/WelcomeScreen.tsx';
import LoginScreen from './pages/LoginScreen.tsx';
import OfficialsPage from './pages/OfficialsPage.tsx';
import ResidentStatistics from './pages/ResidentStatistics.tsx';
import GuestbookPage from './pages/GuestbookPage.tsx';
import ComplaintPage from './pages/ComplaintPage.tsx';
import CloudSettings from './pages/CloudSettings.tsx';
import SocialMediaPage from './pages/SocialMediaPage.tsx';
import ArchivePage from './pages/ArchivePage.tsx';
import InventoryPage from './pages/InventoryPage.tsx';
import LettersPage from './pages/LettersPage.tsx';
import SchedulePage from './pages/SchedulePage.tsx';
import PollsPage from './pages/PollsPage.tsx';
import MyProfilePage from './pages/MyProfilePage.tsx';
import EmergencyPage from './pages/EmergencyPage.tsx';
import MeetingMinutesPage from './pages/MeetingMinutesPage.tsx';
import JimpitanPage from './pages/JimpitanPage.tsx';
import MapPage from './pages/MapPage.tsx';
import InstallBanner from './components/InstallBanner.tsx';
import { Page, UserRole } from './types.ts';
import { storage } from './services/storageService.ts';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>('WARGA');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>(Page.WELCOME);
  const [showLogin, setShowLogin] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const savedLogin = localStorage.getItem('rt_session_active');
    const savedRole = localStorage.getItem('rt_session_role');
    if (savedLogin === 'true' && savedRole) {
      setRole(savedRole as UserRole);
      setIsLoggedIn(true);
      setCurrentPage(Page.DASHBOARD);
      handleInitialSync();
    }
  }, []);

  const handleInitialSync = async () => {
    setIsSyncing(true);
    await storage.syncAllFromCloud();
    setIsSyncing(false);
  };

  const handleLoginSuccess = async (userRole: UserRole) => {
    setRole(userRole);
    setIsLoggedIn(true);
    setShowLogin(false);
    setCurrentPage(Page.DASHBOARD);
    localStorage.setItem('rt_session_active', 'true');
    localStorage.setItem('rt_session_role', userRole);
    handleInitialSync();
  };

  const handleLogout = () => {
    if (window.confirm("Keluar dari aplikasi?")) {
      setIsLoggedIn(false);
      setRole('WARGA');
      setCurrentPage(Page.WELCOME);
      localStorage.removeItem('rt_session_active');
      localStorage.removeItem('rt_session_role');
    }
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginInitiation = () => setShowLogin(true);

  const renderContent = () => {
    switch (currentPage) {
      case Page.DASHBOARD: 
        return <Dashboard role={role} onNavigate={handleNavigate} />;
      case Page.FINANCE: 
        return <FinancePage role={role} />;
      case Page.JIMPITAN: 
        return <JimpitanPage role={role} />;
      case Page.GALLERY: 
        return <GalleryPage role={role} />;
      case Page.OFFICIALS: 
        return <OfficialsPage role={role} />;
      case Page.STATISTICS: 
        return <ResidentStatistics />;
      case Page.GUESTBOOK: 
        return <GuestbookPage role={role} />;
      case Page.COMPLAINTS: 
        return <ComplaintPage role={role} />;
      case Page.CLOUD_SETTINGS: 
        return <CloudSettings />;
      case Page.SOCIAL_MEDIA: 
        return <SocialMediaPage />;
      case Page.ARCHIVE: 
        return <ArchivePage />;
      case Page.INVENTORY: 
        return <InventoryPage role={role} />;
      case Page.LETTERS: 
        return <LettersPage role={role} />;
      case Page.SCHEDULE: 
        return <SchedulePage role={role} />;
      case Page.POLLS: 
        return <PollsPage role={role} />;
      case Page.MY_PROFILE: 
        return <MyProfilePage />;
      case Page.EMERGENCY: 
        return <EmergencyPage role={role} />;
      case Page.MINUTES: 
        return <MeetingMinutesPage role={role} />;
      case Page.ADMIN_PANEL: 
        return <AdminPanel onNavigate={handleNavigate} />;
      case Page.NEWS: 
        return <NewsFeed role={role} />;
      case Page.RESIDENTS: 
        return <ResidentList role={role} />;
      case Page.MAP:
        return <MapPage />;
      default: 
        return <Dashboard role={role} onNavigate={handleNavigate} />;
    }
  };

  if (!isLoggedIn) {
    if (showLogin) {
      return (
        <LoginScreen 
          onLoginSuccess={handleLoginSuccess} 
          onBack={() => setShowLogin(false)} 
        />
      );
    }
    return (
      <>
        <WelcomeScreen onStart={handleLoginInitiation} />
        <InstallBanner />
      </>
    );
  }

  return (
    <Layout 
      activePage={currentPage} 
      onPageChange={handleNavigate} 
      role={role}
      onLogout={handleLogout}
    >
      <InstallBanner />
      {isSyncing && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 border border-white/10 backdrop-blur-md">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          Sinkronisasi Data Cloud...
        </div>
      )}
      <div key={currentPage} className="animate-page-enter">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
