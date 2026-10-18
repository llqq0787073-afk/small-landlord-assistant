import React, { useState, useEffect } from 'react';
import { I18nProvider, useI18n } from './lib/i18n';
import { AppProvider, useAppStore } from './lib/store';
import { Navbar } from './components/common/Navbar';
import { MobileNav } from './components/common/MobileNav';
import { LiveNotificationToast } from './components/common/LiveNotificationToast';
import { LandlordDashboard } from './components/landlord/LandlordDashboard';
import { RealTimeAnalytics } from './components/landlord/RealTimeAnalytics';
import { PropertyManagement } from './components/landlord/PropertyManagement';
import { RentLedger } from './components/landlord/RentLedger';
import { MaintenanceTracker } from './components/landlord/MaintenanceTracker';
import { TaskManagement } from './components/landlord/TaskManagement';
import { InspectionEvidence } from './components/landlord/InspectionEvidence';
import { TenantCommunication } from './components/landlord/TenantCommunication';
import { LegalResourcesCenter } from './components/landlord/LegalResourcesCenter';
import { TenantPortal } from './components/tenant/TenantPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { AddPropertyModal } from './components/modals/AddPropertyModal';
import { RecordPaymentModal } from './components/modals/RecordPaymentModal';
import { NewMaintenanceModal } from './components/modals/NewMaintenanceModal';

// Version 1.2 Authentication & User Management Pages (Section 31 - 37)
import { LandingPage } from './components/auth/LandingPage';
import { LandlordRegister } from './components/auth/LandlordRegister';
import { TenantRegister } from './components/auth/TenantRegister';
import { UnifiedLogin } from './components/auth/UnifiedLogin';
import { MFAVerification } from './components/auth/MFAVerification';
import { RoleSwitcher } from './components/auth/RoleSwitcher';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { ResetPassword } from './components/auth/ResetPassword';
import { VerifyEmail } from './components/auth/VerifyEmail';
import { ProfileSettings } from './components/auth/ProfileSettings';

const AppContent: React.FC = () => {
  const { currentRole, activeRoute, setActiveRoute, isAuthenticated } = useAppStore();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Sync hash routing if user manually accesses URLs
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash.startsWith('/')) {
        setActiveRoute(hash);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setActiveRoute]);

  // Keep window hash synced with activeRoute
  useEffect(() => {
    if (activeRoute && window.location.hash !== `#${activeRoute}`) {
      window.location.hash = activeRoute;
    }
  }, [activeRoute]);

  // Modals state
  const [isAddPropOpen, setIsAddPropOpen] = useState(false);
  const [isRecordPayOpen, setIsRecordPayOpen] = useState(false);
  const [isNewMaintOpen, setIsNewMaintOpen] = useState(false);

  // Dedicated Full-Page Auth Routes (Section 37)
  if (activeRoute === '/') {
    return (
      <>
        <LandingPage />
        <LiveNotificationToast />
      </>
    );
  }

  if (activeRoute === '/register/landlord') {
    return (
      <>
        <LandlordRegister />
        <LiveNotificationToast />
      </>
    );
  }

  if (activeRoute === '/register/tenant') {
    return (
      <>
        <TenantRegister />
        <LiveNotificationToast />
      </>
    );
  }

  if (activeRoute === '/login') {
    return (
      <>
        <UnifiedLogin />
        <LiveNotificationToast />
      </>
    );
  }

  if (activeRoute === '/auth/mfa') {
    return (
      <>
        <MFAVerification />
        <LiveNotificationToast />
      </>
    );
  }

  if (activeRoute === '/select-role') {
    return (
      <>
        <RoleSwitcher />
        <LiveNotificationToast />
      </>
    );
  }

  if (activeRoute === '/forgot-password') {
    return (
      <>
        <ForgotPassword />
        <LiveNotificationToast />
      </>
    );
  }

  if (activeRoute === '/reset-password') {
    return (
      <>
        <ResetPassword />
        <LiveNotificationToast />
      </>
    );
  }

  if (activeRoute === '/verify-email') {
    return (
      <>
        <VerifyEmail />
        <LiveNotificationToast />
      </>
    );
  }

  if (activeRoute === '/settings/profile') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar activeTab="profile_settings" setActiveTab={setActiveTab} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12">
          <ProfileSettings />
        </main>
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <LiveNotificationToast />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar (strict 3-zone contract) */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12">
        {/* Landlord Portal Views */}
        {currentRole === 'landlord' && (
          <>
            {activeTab === 'dashboard' && (
              <LandlordDashboard
                setActiveTab={setActiveTab}
                openAddPropertyModal={() => setIsAddPropOpen(true)}
                openRecordPaymentModal={() => setIsRecordPayOpen(true)}
                openNewMaintenanceModal={() => setIsNewMaintOpen(true)}
              />
            )}
            {activeTab === 'analytics' && <RealTimeAnalytics />}
            {activeTab === 'properties' && (
              <PropertyManagement
                openAddPropertyModal={() => setIsAddPropOpen(true)}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === 'rent_ledger' && (
              <RentLedger openRecordPaymentModal={() => setIsRecordPayOpen(true)} />
            )}
            {activeTab === 'maintenance' && (
              <MaintenanceTracker openNewMaintenanceModal={() => setIsNewMaintOpen(true)} />
            )}
            {activeTab === 'tasks' && <TaskManagement />}
            {activeTab === 'inspections' && <InspectionEvidence />}
            {activeTab === 'invitations' && <PropertyManagement openAddPropertyModal={() => setIsAddPropOpen(true)} setActiveTab={setActiveTab} />}
            {activeTab === 'messages' && <TenantCommunication />}
            {activeTab === 'legal_resources' && <LegalResourcesCenter />}
            {activeTab === 'profile_settings' && <ProfileSettings />}
            {activeTab === 'role_select' && <RoleSwitcher />}
          </>
        )}

        {/* Tenant Portal Views */}
        {currentRole === 'tenant' && (
          <>
            {(activeTab === 'my_home' || activeTab === 'tenant_maintenance' || activeTab === 'tenant_inspection' || activeTab === 'dashboard') && (
              <TenantPortal />
            )}
            {activeTab === 'messages' && <TenantCommunication />}
            {activeTab === 'legal_resources' && <LegalResourcesCenter />}
            {activeTab === 'profile_settings' && <ProfileSettings />}
            {activeTab === 'role_select' && <RoleSwitcher />}
          </>
        )}

        {/* Admin Portal Views */}
        {currentRole === 'admin' && (
          <>
            {activeTab === 'admin' && <AdminPortal />}
            {activeTab === 'legal_resources' && <LegalResourcesCenter />}
            {activeTab === 'dashboard' && <AdminPortal />}
            {activeTab === 'profile_settings' && <ProfileSettings />}
            {activeTab === 'role_select' && <RoleSwitcher />}
          </>
        )}
      </main>

      {/* Mobile PWA Bottom Navigation Bar */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Real-time Toast Notifications */}
      <LiveNotificationToast />

      {/* Interactive Global Modals */}
      <AddPropertyModal
        isOpen={isAddPropOpen}
        onClose={() => setIsAddPropOpen(false)}
      />
      <RecordPaymentModal
        isOpen={isRecordPayOpen}
        onClose={() => setIsRecordPayOpen(false)}
      />
      <NewMaintenanceModal
        isOpen={isNewMaintOpen}
        onClose={() => setIsNewMaintOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <I18nProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </I18nProvider>
  );
}
