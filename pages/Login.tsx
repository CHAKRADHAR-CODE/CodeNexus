
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ApiService } from '../services/api';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Loader2, Code2, ShieldAlert, Check } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [successMode, setSuccessMode] = useState(false);

  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.(com|in)$/;
  const keyRegex = /^[0-9]{6}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!emailRegex.test(email)) {
      setGlobalError('Please enter a valid .com or .in email.');
      return;
    }
    if (!keyRegex.test(password)) {
      setGlobalError('Access Key must be exactly 6 digits.');
      return;
    }

    setIsLoading(true);
    setGlobalError('');

    try {
      // Sub-second authentication call to optimized MongoDB backend
      const user = await ApiService.login(email.trim().toLowerCase(), password.trim());
      setSuccessMode(true);
      onLogin(user);
    } catch (err) {
      setGlobalError('Incorrect credentials or suspended access.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-app px-4">
      <div className={`w-full max-w-[380px] transition-all duration-300 ${successMode ? 'opacity-0 scale-95' : 'opacity-100'}`}>
        <div className="flex flex-col items-center mb-10 text-center animate-premium-entry">
          <div className="w-12 h-12 bg-black dark:bg-white rounded-[14px] flex items-center justify-center text-white dark:text-black mb-6 shadow-xl">
             <Code2 size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-black dark:text-white">CodeNexus Secure</h1>
          <p className="text-[12px] text-zinc-400 mt-2 font-bold uppercase tracking-widest">Professional Engineering Gateway</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-border p-10 rounded-[28px] shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-border py-3 pl-12 pr-4 rounded-xl text-[14px] font-medium outline-none focus:border-black dark:focus:border-white transition-all"
                    placeholder="engineer@domain.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">6-Digit Access Key</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-border py-3 pl-12 pr-12 rounded-xl text-[14px] font-mono tracking-[0.2em] outline-none focus:border-black dark:focus:border-white transition-all"
                    placeholder="••••••"
                    maxLength={6}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-black transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {globalError && (
              <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-500/20 rounded-xl text-[12px] text-rose-500 font-bold">
                <ShieldAlert size={14} />
                <span>{globalError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-xl"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Sign In <ArrowRight size={16} strokeWidth={2.5} /></>}
            </button>
            <div className="text-center">
                <a href="mailto:support@codenexus.io" className="text-[11px] font-bold text-blue-500 hover:underline">Having trouble signing in? Contact Administrator</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
