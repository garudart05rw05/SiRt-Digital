
import React, { useState } from 'react';
import { Page, UserRole } from './types';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FinancePage from './pages/FinancePage';
import JimpitanPage from './pages/JimpitanPage';
import SolidaritasPage from './pages/SolidaritasPage';
import GalleryPage from './pages/GalleryPage';
import OfficialsPage from './pages/OfficialsPage';
import ResidentList from './pages/ResidentList';
import NewsFeed from './pages/NewsFeed';
import ResidentStatistics from './pages/ResidentStatistics';
import GuestbookPage from './pages/GuestbookPage';
import ComplaintPage from './pages/ComplaintPage';
import CloudSettings from './pages/CloudSettings';
import ArchivePage from './pages/ArchivePage';
import InventoryPage from './pages/InventoryPage';
import LettersPage from './pages/LettersPage';
import SchedulePage from './pages/SchedulePage';
import PollsPage from './pages/PollsPage';
import MyProfilePage from './pages/MyProfilePage';
import EmergencyPage from './pages/EmergencyPage';
import MeetingMinutesPage from './pages/MeetingMinutesPage';
import MapPage from './pages/MapPage';
import WelcomeScreen from './pages/WelcomeScreen';
import LoginScreen from './pages/LoginScreen';
import AnnouncementPopup from './components/AnnouncementPopup';
import InstallBanner from './components/InstallBanner';
import AdminPanel from './pages/AdminPanel';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.WELCOME);
  const [role, setRole] = useState<UserRole | null>(null);

  const handleNavigate = (page: Page) => setCurrentPage(page);
  const handleLogout = () => {
    setRole(null);
    setCurrentPage(Page.WELCOME);
  };

  const handleLoginSuccess = (userRole: UserRole) => {
    setRole(userRole);
    setCurrentPage(Page.DASHBOARD);
  };

  if (currentPage === Page.WELCOME) {
    return <WelcomeScreen onStart={() => setCurrentPage(Page.DASHBOARD)} />;
  }

  if (!role) {
    return (
      <LoginScreen 
        onLoginSuccess={handleLoginSuccess} 
        onBack={() => setCurrentPage(Page.WELCOME)} 
      />
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case Page.DASHBOARD: return <Dashboard role={role} onNavigate={handleNavigate} onLogout={handleLogout} />;
      case Page.FINANCE: return <FinancePage role={role} />;
      case Page.JIMPITAN: return <JimpitanPage role={role} />;
      case Page.SOLIDARITAS: return <SolidaritasPage role={role} />;
      case Page.GALLERY: return <GalleryPage role={role} />;
      case Page.OFFICIALS: return <OfficialsPage role={role} />;
      case Page.RESIDENTS: return <ResidentList role={role} />;
      case Page.NEWS: return <NewsFeed role={role} />;
      case Page.STATISTICS: return <ResidentStatistics />;
      case Page.GUESTBOOK: return <GuestbookPage role={role} />;
      case Page.COMPLAINTS: return <ComplaintPage role={role} />;
      case Page.CLOUD_SETTINGS: return <CloudSettings />;
      case Page.ARCHIVE: return <ArchivePage role={role} />;
      case Page.INVENTORY: return <InventoryPage role={role} />;
      case Page.LETTERS: return <LettersPage role={role} />;
      case Page.SCHEDULE: return <SchedulePage role={role} />;
      case Page.POLLS: return <PollsPage role={role} />;
      case Page.MY_PROFILE: return <MyProfilePage />;
      case Page.EMERGENCY: return <EmergencyPage role={role} />;
      case Page.MINUTES: return <MeetingMinutesPage role={role} />;
      case Page.ADMIN_PANEL: return <AdminPanel onNavigate={handleNavigate} />;
      case Page.MAP: return <MapPage />;
      default: return <Dashboard role={role} onNavigate={handleNavigate} onLogout={handleLogout} />;
    }
  };

  return (
    <Layout 
      activePage={currentPage} 
      onPageChange={handleNavigate} 
      role={role} 
      onLogout={handleLogout}
    >
      {renderContent()}
      <AnnouncementPopup />
      <InstallBanner />
    </Layout>
  );
};

export default App;
