import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.jpg';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  HelpCircle,
  LogIn,
  X,
  Shield,
} from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = useState('Adminclyde');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // If already authenticated, redirect to /dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Invalid username or password.');
      return;
    }

    try {
      setLoading(true);
      await login(username.trim(), password, rememberMe);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Decorative Background Elements */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100/70 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true" 
      />
      <div 
        className="absolute -bottom-36 -right-36 w-[32rem] h-[32rem] bg-indigo-50/80 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute top-1/3 -right-20 w-80 h-80 bg-sky-50/60 rounded-full blur-2xl pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute bottom-1/4 -left-20 w-80 h-80 bg-blue-50/70 rounded-full blur-2xl pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="w-full max-w-[560px] mx-auto relative z-10">
        {/* Logo and Branding Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3 transition-transform hover:scale-105 duration-300">
            <img
              src={logoImg}
              alt="BICOR-Product-Management Logo"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-md"
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            <span className="text-[#102A56]">BICOR</span><span className="text-[#0D6EFD]">-Product-Management</span>
          </h1>

          <p className="mt-2 text-sm text-[#64748B] font-medium">
            Product Inventory Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl py-9 px-6 sm:px-12 rounded-3xl shadow-xl shadow-blue-900/5 border border-[#DBEAFE] transition-all">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm font-semibold text-rose-800 leading-snug">
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-[#102A56] uppercase tracking-wider mb-2"
              >
                ADMINISTRATOR USERNAME
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Adminclyde"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#DBEAFE] bg-[#F8FAFC] text-[#102A56] text-sm font-medium placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#0D6EFD] focus:ring-4 focus:ring-blue-100/60 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-[#102A56] uppercase tracking-wider"
                >
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-[#0D6EFD] hover:text-[#2563EB] transition-colors focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-[#DBEAFE] bg-[#F8FAFC] text-[#102A56] text-sm font-medium placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#0D6EFD] focus:ring-4 focus:ring-blue-100/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#102A56] transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0D6EFD] border-[#DBEAFE] focus:ring-[#0D6EFD] cursor-pointer"
                />
                <span className="text-sm font-medium text-[#64748B]">
                  Remember me on this browser
                </span>
              </label>
            </div>

            {/* Sign In Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#0D6EFD] hover:from-[#1D4ED8] hover:to-[#0B5ED7] active:scale-[0.99] transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-[#DBEAFE]/80 flex items-center justify-center gap-2 text-xs text-[#64748B]">
            <Shield className="w-4 h-4 text-[#0D6EFD] flex-shrink-0" />
            <span>Secure administrative access mapped via Supabase Auth</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#DBEAFE] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-[#102A56] font-bold text-lg">
                <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#0D6EFD] flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span>Password Recovery</span>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-[#64748B] hover:text-[#102A56] p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#64748B] mb-4 leading-relaxed">
              For security, public self-service resets are disabled for the preconfigured administrator account.
            </p>

            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#DBEAFE] text-xs text-[#102A56] space-y-2 mb-6">
              <p>
                <strong>Administrator Account:</strong>{' '}
                <code className="font-mono bg-white px-2 py-0.5 rounded border border-[#DBEAFE] text-[#0D6EFD]">
                  Adminclyde
                </code>
              </p>
              <p className="text-[#64748B]">
                To update your administrator password, run the following CLI command in your project terminal:
              </p>
              <code className="block bg-slate-900 text-slate-100 p-2.5 rounded-xl font-mono text-[11px] overflow-x-auto">
                node server/scripts/createAdmin.js [NewPassword]
              </code>
              <p className="text-[#64748B] text-[11px]">
                Or update it directly in <strong>Supabase Dashboard &rarr; Authentication &rarr; Users</strong>.
              </p>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0D6EFD] text-white text-sm font-semibold hover:from-[#1D4ED8] hover:to-[#0B5ED7] transition-all shadow-md shadow-blue-500/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
