import { useState, useEffect, useRef } from 'react';
import { User, Resident, MaintenanceRecord, Complaint, Booking } from './types';
import { initialResidents, initialMaintenance, initialComplaints, initialBookings } from './data';
import { societyService } from './lib/societyService';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import TopHeader from './components/TopHeader';
import DashboardModulesGrid from './components/DashboardModulesGrid';
import AdminDashboard from './components/AdminDashboard';
import ResidentDashboard from './components/ResidentDashboard';
import TenantDashboard from './components/TenantDashboard';
import SecurityDashboard from './components/SecurityDashboard';
import NoticeBoard from './components/NoticeBoard';
import CommunicationCenter from './components/CommunicationCenter';
import { Toaster } from 'sonner';
import { Users, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // App State
  const [residents, setResidents] = useState<Resident[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const isFetchingRef = useRef(false);

  // Fetch data from Supabase or fallback
  const fetchData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const [resData, mainData, compData, bookingData] = await Promise.all([
        societyService.getResidents(),
        societyService.getMaintenance(),
        societyService.getComplaints(),
        societyService.getBookings()
      ]);

      if (resData && resData.length > 0) {
        const uniqueResidents = resData.map(r => {
          const flatType = r.flat_type || (r.bhk === '1 BHK' ? 'Smart 1 BHK' : r.bhk === '3 BHK' ? 'Premium 3 BHK' : 'Smart 2 BHK');
          const bhk = r.bhk || (flatType.includes('1 BHK') ? '1 BHK' : flatType.includes('3 BHK') ? '3 BHK' : '2 BHK');
          const sqft = r.square_feet || (flatType === 'Smart 1 BHK' ? 520 : flatType === 'Premium 2 BHK' ? 720 : flatType === 'Premium 3 BHK' ? 920 : 620);
          return {
            ...r,
            role: (r.role || r.occupancy_type || (r.tenant_id ? 'Tenant' : 'Owner')) as 'Owner' | 'Tenant',
            occupancy_type: (r.occupancy_type || r.role || (r.tenant_id ? 'Tenant' : 'Owner')) as 'Owner' | 'Tenant',
            status: (r.status ? (r.status.toLowerCase() === 'active' ? 'Active' : 'Inactive') : 'Active') as 'Active' | 'Inactive',
            owner_id: r.owner_id || null,
            tenant_id: r.tenant_id || null,
            bhk,
            flat_type: flatType,
            square_feet: sqft
          };
        }).filter(r => r.name?.toLowerCase() !== 'dhilipan');

        const resMap = new Map(uniqueResidents.map(r => [r.resident_id, r.name]));
        const rawMaintenance = mainData || [];
        const mappedMaintenance = rawMaintenance.map(m => ({
          ...m,
          resident_name: resMap.get(m.resident_id) || m.resident_name || 'Resident Not Found'
        }));

        setResidents(uniqueResidents);
        setMaintenance(mappedMaintenance);
        setComplaints(compData || []);
        setBookings(bookingData || []);
        setLoading(false);
        return;
      }

      const mapResidentDefaults = (r: Resident) => {
        const flatType = r.flat_type || (r.bhk === '1 BHK' ? 'Smart 1 BHK' : r.bhk === '3 BHK' ? 'Premium 3 BHK' : 'Smart 2 BHK');
        const bhk = r.bhk || (flatType.includes('1 BHK') ? '1 BHK' : flatType.includes('3 BHK') ? '3 BHK' : '2 BHK');
        const sqft = r.square_feet || (flatType === 'Smart 1 BHK' ? 520 : flatType === 'Premium 2 BHK' ? 720 : flatType === 'Premium 3 BHK' ? 920 : 620);
        return {
          ...r,
          role: (r.role || r.occupancy_type || (r.tenant_id ? 'Tenant' : 'Owner')) as 'Owner' | 'Tenant',
          occupancy_type: (r.occupancy_type || r.role || (r.tenant_id ? 'Tenant' : 'Owner')) as 'Owner' | 'Tenant',
          status: (r.status ? (r.status.toLowerCase() === 'active' ? 'Active' : 'Inactive') : 'Active') as 'Active' | 'Inactive',
          owner_id: r.owner_id || null,
          tenant_id: r.tenant_id || null,
          bhk,
          flat_type: flatType,
          square_feet: sqft
        };
      };

      const defaultResidents = initialResidents.map(mapResidentDefaults).filter(r => r.name?.toLowerCase() !== 'dhilipan');
      const defaultResMap = new Map(defaultResidents.map(r => [r.resident_id, r.name]));
      const mappedDefaultMaintenance = initialMaintenance.map(m => ({
        ...m,
        resident_name: defaultResMap.get(m.resident_id) || m.resident_name || 'Resident Not Found'
      }));

      setResidents(defaultResidents);
      setMaintenance(mappedDefaultMaintenance);
      setComplaints(initialComplaints);
      setBookings(initialBookings);
    } catch (error: unknown) {
      console.warn('Notice: Using local society dataset:', error);
      const mapResidentDefaults = (r: Resident) => {
        const flatType = r.flat_type || (r.bhk === '1 BHK' ? 'Smart 1 BHK' : r.bhk === '3 BHK' ? 'Premium 3 BHK' : 'Smart 2 BHK');
        const bhk = r.bhk || (flatType.includes('1 BHK') ? '1 BHK' : flatType.includes('3 BHK') ? '3 BHK' : '2 BHK');
        const sqft = r.square_feet || (flatType === 'Smart 1 BHK' ? 520 : flatType === 'Premium 2 BHK' ? 720 : flatType === 'Premium 3 BHK' ? 920 : 620);
        return {
          ...r,
          role: (r.role || r.occupancy_type || (r.tenant_id ? 'Tenant' : 'Owner')) as 'Owner' | 'Tenant',
          occupancy_type: (r.occupancy_type || r.role || (r.tenant_id ? 'Tenant' : 'Owner')) as 'Owner' | 'Tenant',
          status: (r.status ? (r.status.toLowerCase() === 'active' ? 'Active' : 'Inactive') : 'Active') as 'Active' | 'Inactive',
          owner_id: r.owner_id || null,
          tenant_id: r.tenant_id || null,
          bhk,
          flat_type: flatType,
          square_feet: sqft
        };
      };
      const defaultResidents = initialResidents.map(mapResidentDefaults).filter(r => r.name?.toLowerCase() !== 'dhilipan');
      const defaultResMap = new Map(defaultResidents.map(r => [r.resident_id, r.name]));
      const mappedDefaultMaintenance = initialMaintenance.map(m => ({
        ...m,
        resident_name: defaultResMap.get(m.resident_id) || m.resident_name || 'Resident Not Found'
      }));

      setResidents(defaultResidents);
      setMaintenance(mappedDefaultMaintenance);
      setComplaints(initialComplaints);
      setBookings(initialBookings);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchData();
    // Conservative auto-refresh every 60 seconds only when tab is active
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchData();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'security') {
      setActiveTab('security');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleUserUpdate = (updatedUser: Partial<User | Resident>) => {
    setUser(prev => {
      if (!prev) return null;
      const { role, ...rest } = updatedUser as any;
      const validRole = (role === 'admin' || role === 'security' || role === 'resident') ? role : prev.role;
      return { ...prev, ...rest, role: validRole };
    });
  };

  // Scroll to top on tab change or login
  useEffect(() => {
    globalThis.scrollTo?.(0, 0);
  }, [activeTab, user?.id]);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const foundResident = user.resident_id 
    ? (
        residents.find(r => r.resident_id === user.resident_id) ||
        (user.tenant_id ? residents.find(r => r.tenant_id === user.tenant_id) : null) ||
        residents.find(r => r.tenant_id === user.resident_id)
      ) 
    : null;

  const currentResident: Resident | null = foundResident ? {
    ...foundResident,
    flat: foundResident.flat || user.flat || '',
    tower: foundResident.tower || user.tower || '',
    role: (foundResident.role || foundResident.occupancy_type || user.occupancy_type || (foundResident.tenant_id ? 'Tenant' : 'Owner')) as 'Owner' | 'Tenant',
    occupancy_type: (foundResident.occupancy_type || foundResident.role || user.occupancy_type || (foundResident.tenant_id ? 'Tenant' : 'Owner')) as 'Owner' | 'Tenant',
    tenant_id: foundResident.tenant_id || user.tenant_id || null,
    owner_id: foundResident.owner_id || user.owner_id || null,
    status: (foundResident.status || user.status || 'Active') as 'Active' | 'Inactive',
    password: foundResident.password || user.password || 'resident123',
    resident_id: foundResident.resident_id || user.resident_id || ''
  } : (user.resident_id ? { 
    ...(user as unknown as Resident), 
    role: (user.occupancy_type || (user.tenant_id ? 'Tenant' : 'Owner')) as 'Owner' | 'Tenant',
    occupancy_type: (user.occupancy_type || (user.tenant_id ? 'Tenant' : 'Owner')) as 'Owner' | 'Tenant', 
    tenant_id: user.tenant_id || null,
    owner_id: user.owner_id || null,
    status: (user.status || 'Active') as 'Active' | 'Inactive',
    password: user.password || 'resident123' 
  } : null);

  const isAdmin = user.role === 'admin' || !!user.admin_id;

  return (
    <div className="min-h-screen bg-[#f3f6fa] font-sans text-slate-900 flex w-full min-w-0">
      <Toaster position="top-center" richColors />
      
      {/* Responsive Sidebar on the Left (Figma Dash Theme) */}
      <Sidebar 
        isAdmin={isAdmin} 
        userRole={user.role} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Workspace Column with TopHeader */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <TopHeader 
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 overflow-y-auto">
          {/* Main Dashboard Module Grid View */}
          {activeTab === 'dashboard' ? (
            <DashboardModulesGrid 
              user={user}
              setActiveTab={setActiveTab}
              residents={residents}
              maintenance={maintenance}
              complaints={complaints}
              bookings={bookings}
            />
          ) : (
            <div className="space-y-6">
              {/* Top Back Navigation Bar for Module Views */}
              <div className="flex items-center justify-between bg-white p-3.5 px-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1d72fe] hover:bg-blue-600 text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-white" />
                  <span>Back to Dashboard</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1d72fe] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    {activeTab === 'security' ? 'VISITOR MANAGEMENT' : activeTab === 'notices' ? 'NOTICE MANAGEMENT' : activeTab === 'communication' ? 'COMMUNICATION' : activeTab === 'financial' ? 'FINANCIAL MANAGEMENT' : activeTab.toUpperCase()} MODULE
                  </span>
                </div>
              </div>

            {/* Active Module Content */}
            {user.role === 'security' && activeTab === 'notices' ? (
              <NoticeBoard 
                user={user}
                onSwitchTab={(tab) => setActiveTab(tab)}
                onRefresh={fetchData}
              />
            ) : user.role === 'security' && activeTab === 'communication' ? (
              <CommunicationCenter 
                user={user}
                onSwitchTab={(tab) => setActiveTab(tab)}
                onRefresh={fetchData}
              />
            ) : user.role === 'security' || activeTab === 'security' ? (
              <SecurityDashboard 
                user={user}
                residents={residents}
                onLogout={handleLogout}
                onUserUpdate={handleUserUpdate}
              />
            ) : (user.admin_id || user.role === 'admin') ? (
              <AdminDashboard 
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                residents={residents}
                maintenance={maintenance}
                complaints={complaints}
                bookings={bookings}
                onRefresh={fetchData}
                onUserUpdate={handleUserUpdate}
              />
            ) : currentResident ? (
              activeTab === 'financial' ? (
                <div className="bg-white rounded-3xl p-12 border border-rose-100 shadow-sm text-center max-w-2xl mx-auto my-12">
                  <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Access Denied / Unauthorized</h2>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
                    The Financial module is strictly restricted to Society Administrators. You do not have permission to view or manage society balance sheets, expenses, or financial ledgers.
                  </p>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md"
                  >
                    Return to Dashboard
                  </button>
                </div>
              ) : (currentResident.role === 'Tenant' || currentResident.occupancy_type === 'Tenant' || user.occupancy_type === 'Tenant') ? (
                <TenantDashboard 
                  activeTab={activeTab}
                  resident={currentResident}
                  residents={residents}
                  maintenance={maintenance}
                  complaints={complaints}
                  bookings={bookings}
                  onRefresh={fetchData}
                  setActiveTab={setActiveTab}
                  onLogout={handleLogout}
                  onUserUpdate={handleUserUpdate}
                />
              ) : (
                <ResidentDashboard 
                  activeTab={activeTab}
                  resident={currentResident}
                  residents={residents}
                  maintenance={maintenance}
                  complaints={complaints}
                  bookings={bookings}
                  onRefresh={fetchData}
                  setActiveTab={setActiveTab}
                  onLogout={handleLogout}
                  onUserUpdate={handleUserUpdate}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Profile Not Found</h3>
                <p className="text-slate-500 max-w-md">
                  We couldn't find your user profile in the database. Please contact your society administrator.
                </p>
                <button 
                  onClick={handleLogout}
                  className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                  Logout & Try Again
                </button>
              </div>
            )}
          </div>
        )}
        </main>
      </div>
    </div>
  );
}

