
import React, { useState } from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Loader2, Code2, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Strict Validation Patterns
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.(com|in)$/;
  const passwordRegex = /^\d{6}$/;

  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = passwordRegex.test(password);
  const isFormValid = isEmailValid && isPasswordValid;

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Force lowercase and remove all whitespace automatically while typing
    const val = e.target.value.toLowerCase().trim();
    setEmail(val);
    if (error) setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip non-numeric characters and limit to exactly 6 digits
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPassword(val);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Strict frontend validation check
    if (!isEmailValid) {
      setError('Use a valid .com or .in email address.');
      return;
    }
    if (!isPasswordValid) {
      setError('Access key must be exactly 6 digits.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate network delay for authentication
    await new Promise(resolve => setTimeout(resolve, 800));

    // Double check patterns before final simulation query (backend safety)
    if (!emailRegex.test(email) || !passwordRegex.test(password)) {
      setError('Invalid credential format detected.');
      setIsLoading(false);
      return;
    }

    const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email);
    
    // Simulate credential verification logic
    // Admin: admin@gmail.com / 222222
    // User: user@gmail.com / 111111
    const isValidCreds = 
      (email === 'admin@gmail.com' && password === '222222') ||
      (email === 'user@gmail.com' && password === '111111');

    if (foundUser && isValidCreds) {
      if (foundUser.isBlocked) {
        setError('Security Restriction: Account is blocked.');
        setIsLoading(false);
      } else {
        onLogin(foundUser);
      }
    } else {
      setError('Incorrect email or access key.');
      setIsLoading(false);
    }
  };

  const mailtoLink = `mailto:chakradharchowdarygunnam@gmail.com?subject=Missed My Login Credentials&body=Hello Admin,%0A%0AI forgot my CodeNexus login credentials. Please help me recover my access key.%0A%0AThanks.`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-app px-4">
      <div className="w-full max-w-[380px] animate-fade">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-[12px] flex items-center justify-center text-white dark:text-black mb-6 shadow-sm">
            <Code2 size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">CodeNexus Sign In</h1>
          <p className="text-[13px] text-slate-500 mt-2 font-medium">Verify your credentials to access the platform</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-border p-8 rounded-[12px] shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  {email && !isEmailValid && (
                    <span className="text-[10px] text-red-500 font-bold">.com or .in required</span>
                  )}
                </div>
                <div className="relative">
                  <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${email ? (isEmailValid ? 'text-brand-accent' : 'text-red-400') : 'text-slate-300'}`} size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    autoComplete="email"
                    className={`w-full bg-slate-50 dark:bg-zinc-950 border py-3 pl-11 pr-4 rounded-[10px] text-[14px] transition-all outline-none font-medium ${
                      email && !isEmailValid ? 'border-red-500/50' : 'border-border focus:border-slate-900 dark:focus:border-white'
                    }`}
                    placeholder="engineer@domain.com"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">6-Digit Access Key</label>
                  {password && password.length < 6 && (
                    <span className="text-[10px] text-amber-500 font-bold">{6 - password.length} left</span>
                  )}
                </div>
                <div className="relative">
                  <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${password ? (isPasswordValid ? 'text-brand-accent' : 'text-amber-400') : 'text-slate-300'}`} size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    inputMode="numeric"
                    autoComplete="current-password"
                    maxLength={6}
                    className={`w-full bg-slate-50 dark:bg-zinc-950 border py-3 pl-11 pr-12 rounded-[10px] text-[14px] transition-all outline-none font-mono tracking-widest ${
                      password && !isPasswordValid ? 'border-amber-500/50' : 'border-border focus:border-slate-900 dark:focus:border-white'
                    }`}
                    placeholder="••••••"
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

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-500/20 rounded-[10px] text-[12px] text-red-500 font-bold animate-fade">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className={`w-full py-3.5 rounded-[10px] text-[13px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                isFormValid 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-sm hover:opacity-90' 
                  : 'bg-slate-50 dark:bg-zinc-800 text-slate-400 cursor-not-allowed border border-border'
              }`}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Authenticate <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>
          
          <div className="text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              Forgot your key? <a href={mailtoLink} className="text-brand-accent font-bold hover:underline transition-all">Contact Administrator</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
