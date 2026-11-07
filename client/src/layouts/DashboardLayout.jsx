import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import logoImg from '../assets/logo.jpg';
import {
  LayoutDashboard,
  Package,
  Layers,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Shield,
} from 'lucide-react';

export const DashboardLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Categories', path: '/categories', icon: Layers },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const getPageTitle = () => {
    if (location.pathname.startsWith('/products')) return 'Product Management';
    if (location.pathname.startsWith('/categories')) return 'Category Management';
    if (location.pathname.startsWith('/settings')) return 'System Settings';
    return 'Overview Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={logoImg}
            alt="BICOR-Product-Management Logo"
            className="w-9 h-9 object-contain flex-shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-xs font-bold text-slate-900 leading-tight truncate">
              <span className="text-[#102A56]">BICOR</span><span className="text-[#0D6EFD]">-Product-Management</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">Inventory System</p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <img
              src={logoImg}
              alt="BICOR-Product-Management Logo"
              className="w-9 h-9 object-contain flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-[13px] font-bold text-slate-900 leading-snug tracking-tight truncate" title="BICOR-Product-Management">
                <span className="text-[#102A56]">BICOR</span><span className="text-[#0D6EFD]">-Product-Management</span>
              </h2>
              <p className="text-[11px] text-brand-600 font-medium tracking-wide">Inventory Admin</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600 ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === '/dashboard' && location.pathname === '/');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm shadow-brand-100 border border-brand-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-4 bg-brand-600 rounded-full" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-8 items-center justify-between sticky top-0 z-30 shadow-sm/50">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{settings?.application_title || 'BICOR-Product-Management'}</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-900">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
              <Shield className="w-3.5 h-3.5 text-brand-600" />
              <span>Admin: {settings?.admin_full_name || user?.username || 'Adminclyde'}</span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Clean Footer */}
        <footer className="px-6 py-4 border-t border-slate-200 bg-white text-xs text-slate-500 text-center flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Product Inventory Management System &copy; 2026. All rights reserved.</span>
          <span className="text-slate-400">Authenticated via Supabase Auth</span>
        </footer>
      </div>
    </div>
  );
};
