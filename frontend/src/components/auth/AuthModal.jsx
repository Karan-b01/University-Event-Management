import React, { useState } from 'react';
import { Mail, Lock, KeyRound, AlertCircle, Loader2, User } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';

export const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const { login: updateAuthContext } = useAuth();
  const [email, setEmail] = useState('prakhar.sethi@vit.edu');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState('Student Organizer');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (isRegistering) {
        await authApi.register({ name, email, password, role_name: 'Student Organizer' });
      }
      const data = await authApi.login(email, password);
      
      // Extract JWT from response and store in localStorage
      if (data && data.access_token) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('unievent_token', data.access_token);
      }

      // Update React Auth Context
      updateAuthContext(data);

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
      onClose();
    } catch (err) {
      console.warn('[AuthModal] Authentication request failed:', err);
      const detail =
        err.response?.data?.detail ||
        err.message || 'Could not connect to the authentication service.';
      setErrorMessage(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPreset = (role, demoEmail) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMessage(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRegistering ? 'Create Organizer Account' : 'Sign In'}
      subtitle="University Event Management and Compliance Engine"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegistering && <Input label="Full name" icon={User} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />}
        {/* Security protocol banner */}
        <div className="p-3 rounded-lg bg-zinc-100 dark:bg-emerald-950/20 border border-zinc-200 dark:border-emerald-500/20 flex items-start gap-2.5 text-xs text-zinc-700 dark:text-slate-300 font-sans">
          <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Hybrid Session-JWT binding active. Credentials authenticate directly against
            FastAPI authenticates your account and loads its assigned access roles.
          </span>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200 font-sans">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Email Input */}
        <Input
          label="Institutional Email / NetID"
          icon={Mail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@university.edu"
          required
        />

        {/* Password Input */}
        <Input
          label="Password / Token"
          icon={Lock}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter institutional credentials"
          required
        />

        {/* Quick Demo Role Presets */}
        {!isRegistering && <div className="pt-2 border-t border-zinc-100 dark:border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-slate-400 block mb-2">
            Demo account shortcuts
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickPreset('Student Organizer', 'prakhar.sethi@vit.edu')}
              className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                selectedRole === 'Student Organizer'
                  ? 'bg-black text-white dark:bg-emerald-500 dark:text-black border-transparent font-bold'
                  : 'bg-zinc-100 dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-slate-300'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Faculty Advisor', 'advisor@vit.edu')}
              className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                selectedRole === 'Faculty Advisor'
                  ? 'bg-black text-white dark:bg-emerald-500 dark:text-black border-transparent font-bold'
                  : 'bg-zinc-100 dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-slate-300'
              }`}
            >
              Faculty Advisor
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Security Officer', 'security@vit.edu')}
              className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                selectedRole === 'Security Officer'
                  ? 'bg-black text-white dark:bg-emerald-500 dark:text-black border-transparent font-bold'
                  : 'bg-zinc-100 dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-slate-300'
              }`}
            >
              Security
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Finance Officer', 'finance@vit.edu')}
              className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                selectedRole === 'Finance Officer'
                  ? 'bg-black text-white dark:bg-emerald-500 dark:text-black border-transparent font-bold'
                  : 'bg-zinc-100 dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-slate-300'
              }`}
            >
              Finance
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Admin', 'admin@vit.edu')}
              className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                selectedRole === 'Admin'
                  ? 'bg-black text-white dark:bg-emerald-500 dark:text-black border-transparent font-bold'
                  : 'bg-zinc-100 dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-slate-300'
              }`}
            >
              Admin
            </button>
          </div>
        </div>}

        {/* Submit Action */}
        <div className="pt-3">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="w-full justify-center text-sm font-bold tracking-wide"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isRegistering ? 'Creating account...' : 'Signing in...'}</span>
              </span>
            ) : (
              isRegistering ? 'Create account' : 'Sign in'
            )}
          </Button>
        </div>
      </form>
      <p className="mt-4 text-center text-xs text-zinc-500 dark:text-slate-400">
        {isRegistering ? 'Already registered?' : 'New student organizer?'}{' '}
        <button type="button" className="font-semibold text-emerald-600 dark:text-emerald-400" onClick={() => { setIsRegistering((value) => !value); setErrorMessage(null); }}>
          {isRegistering ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </Modal>
  );
};

export default AuthModal;
