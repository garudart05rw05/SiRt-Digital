
import React, { useState, useEffect } from 'react';
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
import SocialMediaPage from './pages/SocialMediaPage';
import WelcomeScreen from './pages/WelcomeScreen';
import LoginScreen from './pages/LoginScreen';
import AnnouncementPopup from './components/AnnouncementPopup';
import InstallBanner from './components/InstallBanner';
import AdminPanel from './pages/AdminPanel';
import LogoutWizard from './components/LogoutWizard';
import YouthFundPage from './pages/YouthFundPage';
import YouthOfficialsPage from './pages/YouthOfficialsPage';
import GuestbookEditor from './components/GuestbookEditor';
import { storage, STORAGE_KEYS } from './services/storageService';
import { notificationService } from './services/notificationService';
import { db } from './services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.WELCOME);
  const [role, setRole] = useState<UserRole | null>(null);
  const [showLogoutWizard, setShowLogoutWizard] = useState(false);
  const [isSubmittingGuest, setIsSubmittingGuest] = useState(false);

  useEffect(() => {
    const handleGlobalVibration = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a')) {
        if ('vibrate' in navigator) {
          navigator.vibrate(15);
        }
      }
    };
    document.addEventListener('mousedown', handleGlobalVibration);
    return () => document.removeEventListener('mousedown', handleGlobalVibration);
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (currentPage === Page.WELCOME) return;
      
      if (showLogoutWizard) {
        setShowLogoutWizard(false);
        window.history.pushState({ page: currentPage }, '');
        return;
      }

      if (currentPage === Page.DASHBOARD || currentPage === Page.PUBLIC_GUEST) {
        setShowLogoutWizard(true);
        window.history.pushState({ page: currentPage }, '');
      } else {
        handleNavigate(Page.DASHBOARD);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage, showLogoutWizard]);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    window.history.pushState({ page }, '');
  };

  const handleLogoutInitiate = () => {
    setShowLogoutWizard(true);
  };

  const handleFinalLogout = () => {
    setRole(null);
    setShowLogoutWizard(false);
    setCurrentPage(Page.WELCOME);
  };

  const handleLoginSuccess = (userRole: UserRole) => {
    setRole(userRole);
    setCurrentPage(Page.DASHBOARD);
    window.history.pushState({ page: Page.DASHBOARD }, '');
  };

  const handlePublicGuestSave = async (data: any) => {
    setIsSubmittingGuest(true);
    const guests = storage.get(STORAGE_KEYS.GUESTBOOK, []);
    const settings = storage.get(STORAGE_KEYS.SETTINGS, {});
    
    const newEntry = {
      id: `T-${Date.now().toString().slice(-6)}`,
      ...data,
      status: 'Proses',
      checkIn: new Date().toISOString(),
      checkOut: null
    };

    const saved = await storage.set(STORAGE_KEYS.GUESTBOOK, [newEntry, ...guests]);
    if (saved) {
      await notificationService.sendEmail(settings, newEntry, 'guest');
      alert("Registrasi Berhasil! Pengurus telah menerima notifikasi kedatangan Anda. Silakan menunggu di depan gerbang.");
      setCurrentPage(Page.WELCOME);
    }
    setIsSubmittingGuest(false);
  };

  if (currentPage === Page.WELCOME) {
    return <WelcomeScreen onStart={() => setCurrentPage(Page.DASHBOARD)} />;
  }

  // KHUSUS HALAMAN PUBLIC GUEST (TANPA LOGIN)
  if (currentPage === Page.PUBLIC_GUEST) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col p-6 animate-page-enter">
         {isSubmittingGuest && (
            <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center">
               <div className="bg-white px-10 py-8 rounded-[44px] flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-black text-[10px] uppercase text-slate-800">Menghubungkan Ke Sistem...</p>
               </div>
            </div>
         )}
         <div className="max-w-xl mx-auto w-full py-10 space-y-8">
            <div className="text-center space-y-2">
               <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Portal Tamu</h2>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Silakan isi data kunjungan Anda</p>
            </div>
            <GuestbookEditor onSave={handlePublicGuestSave} onCancel={() => setCurrentPage(Page.WELCOME)} />
         </div>
      </div>
    );
  }

  if (!role) {
    return (
      <LoginScreen 
        onLoginSuccess={handleLoginSuccess} 
        onBack={() => setCurrentPage(Page.WELCOME)} 
        onGuestAccess={() => setCurrentPage(Page.PUBLIC_GUEST)}
      />
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case Page.DASHBOARD: return <Dashboard role={role} onNavigate={handleNavigate} onLogout={handleLogoutInitiate} />;
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
      case Page.SOCIAL_MEDIA: return <SocialMediaPage />;
      case Page.YOUTH_FUND: return <YouthFundPage role={role} />;
      case Page.YOUTH_OFFICIALS: return <YouthOfficialsPage role={role} />;
      default: return <Dashboard role={role} onNavigate={handleNavigate} onLogout={handleLogoutInitiate} />;
    }
  };

  return (
    <Layout 
      activePage={currentPage} 
      onPageChange={handleNavigate} 
      role={role} 
      onLogout={handleLogoutInitiate}
    >
      {renderContent()}
      <AnnouncementPopup />
      <InstallBanner />
      {showLogoutWizard && (
        <LogoutWizard 
          onConfirm={handleFinalLogout} 
          onCancel={() => setShowLogoutWizard(false)} 
        />
      )}
    </Layout>
  );
};

export default App;
