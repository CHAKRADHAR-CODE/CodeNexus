
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Loader2, Code2, AlertCircle, ShieldAlert, Check } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Security State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [globalError, setGlobalError] = useState('');
  const [successMode, setSuccessMode] = useState(false);

  // Refs for timer management
  const timerRef = useRef<number | null>(null);

  // Email Regex: a-z0-9, .com or .in only
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.(com|in)$/;
  // Access Key Regex: Exactly 6 digits
  const keyRegex = /^[0-9]{6}$/;

  const isEmailValid = email === '' || emailRegex.test(email);
  const isKeyValid = password === '' || /^[0-9]*$/.test(password); // Valid while typing (digits only)
  const isKeyComplete = keyRegex.test(password);

  // Handle Cooldown Timer
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = window.setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [cooldown]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().trim();
    setEmail(val);
    if (globalError) setGlobalError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, ''); // Block non-numeric
    if (val.length <= 6) {
      setPassword(val);
      if (globalError) setGlobalError('');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasteData = e.clipboardData.getData('text');
    if (!/^\d+$/.test(pasteData)) {
      e.preventDefault(); // Block non-numeric paste
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || isLoading) return;

    // Final Validation
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

    // Hardening: Sanitize and wait for UX feel
    const sanitizedEmail = email.trim();
    const sanitizedKey = password.trim();
    await new Promise(resolve => setTimeout(resolve, 1000));

    const foundUser = users.find(u => u.email.toLowerCase() === sanitizedEmail);
    
    if (foundUser && foundUser.password === sanitizedKey) {
      if (foundUser.isBlocked) {
        setGlobalError('Security Restriction: Account access suspended.');
        setIsLoading(false);
      } else {
        setSuccessMode(true);
        setTimeout(() => onLogin(foundUser), 600);
      }
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setIsLoading(false);

      if (newAttempts >= 3) {
        setCooldown(30);
        setFailedAttempts(0);
        setGlobalError('Too many attempts. Try again in 30s.');
      } else {
        setGlobalError(`Incorrect credentials. ${3 - newAttempts} attempts remaining.`);
      }
    }
  };

  const isSubmitDisabled = isLoading || cooldown > 0 || email === '' || password === '' || !emailRegex.test(email) || !isKeyComplete;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-app px-4">
      <div className={`w-full max-w-[380px] transition-all duration-500 ${successMode ? 'opacity-0 translate-y-[-10px]' : 'opacity-100 translate-y-0'}`}>
        
        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-[12px] flex items-center justify-center text-white dark:text-black mb-6 shadow-sm">
            {successMode ? (
              <Check size={24} strokeWidth={3} className="animate-fade" />
            ) : (
              <Code2 size={24} strokeWidth={2.5} />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">CodeNexus Secure</h1>
          <p className="text-[13px] text-slate-500 mt-2 font-medium">Professional Engineering Gateway</p>
        </div>

        {/* Secure Form Container */}
        <div className="bg-white dark:bg-zinc-900 border border-border p-8 rounded-[12px] shadow-sm space-y-6 relative overflow-hidden">
          {successMode && (
            <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-slate-900 dark:text-white" />
                <span className="text-[11px] font-bold uppercase tracking-widest">Redirecting...</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  {!isEmailValid && email !== '' && <span className="text-[9px] font-bold text-red-500 uppercase">Invalid Domain</span>}
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    autoComplete="email"
                    className={`w-full bg-slate-50 dark:bg-zinc-950 border py-3 pl-11 pr-4 rounded-[10px] text-[14px] transition-all outline-none ${
                      !isEmailValid && email !== '' 
                      ? 'border-red-500/30 ring-4 ring-red-500/5' 
                      : 'border-border focus:border-slate-900 dark:focus:border-white'
                    }`}
                    placeholder="engineer@domain.com"
                    required
                  />
                </div>
              </div>

              {/* Access Key Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">6-Digit Access Key</label>
                  {password.length > 0 && !isKeyComplete && <span className="text-[9px] font-bold text-slate-400 uppercase">{password.length}/6</span>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    onPaste={handlePaste}
                    inputMode="numeric"
                    autoComplete="current-password"
                    className={`w-full bg-slate-50 dark:bg-zinc-950 border py-3 pl-11 pr-12 rounded-[10px] text-[14px] font-mono tracking-[0.2em] transition-all outline-none ${
                      !isKeyValid && password !== '' 
                      ? 'border-red-500/30 ring-4 ring-red-500/5' 
                      : 'border-border focus:border-slate-900 dark:focus:border-white'
                    }`}
                    placeholder="••••••"
                    maxLength={6}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors p-1.5"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Feedback */}
            {globalError && (
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-500/20 rounded-[10px] text-[12px] text-red-500 font-bold animate-fade">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>{globalError}</span>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full py-3.5 rounded-[10px] text-white dark:text-black text-[13px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                isSubmitDisabled 
                ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed' 
                : 'bg-slate-900 dark:bg-white hover:opacity-90 shadow-md'
              }`}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : cooldown > 0 ? (
                `Locked (${cooldown}s)`
              ) : (
                <>Sign In <ArrowRight size={16} strokeWidth={2.5} /></>
              )}
            </button>
          </form>
          
          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400 font-medium">
              Enterprise Access Node v2.4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
