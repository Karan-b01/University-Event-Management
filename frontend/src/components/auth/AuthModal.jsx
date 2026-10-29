import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Loader2, User } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import { jsPDF } from 'jspdf';

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
        const registeredUser = await authApi.register({ name, email, password, role_name: 'Student Organizer' });

        // Generate and automatically download welcome PDF for new user registration
        const generateWelcomePdf = (userName) => {
          const doc = new jsPDF();
          doc.text(`Welcome, ${userName}`, 20, 20);
          doc.save(`Welcome_${userName}.pdf`);
        };

        generateWelcomePdf(registeredUser?.name || name);
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
        {errorMessage && (
          <div className="p-3 rounded-lg bg-stone-100 dark:bg-[#1C1616] border border-stone-300 dark:border-rose-900/30 flex items-start gap-2 text-xs text-neutral-800 dark:text-rose-200 font-sans">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-neutral-700 dark:text-rose-300" />
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
        {!isRegistering && <div className="pt-2 border-t border-stone-200 dark:border-[#2A2A2A]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-neutral-400 block mb-2">
            Demo account shortcuts
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickPreset('Student Organizer', 'prakhar.sethi@vit.edu')}
              className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                selectedRole === 'Student Organizer'
                  ? 'bg-neutral-900 text-stone-50 dark:bg-stone-200 dark:text-neutral-900 border-transparent font-bold'
                  : 'bg-stone-50 dark:bg-[#111111] border-stone-200 dark:border-[#2A2A2A] text-neutral-700 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-[#1A1A1A]'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Faculty Advisor', 'advisor@vit.edu')}
              className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                selectedRole === 'Faculty Advisor'
                  ? 'bg-neutral-900 text-stone-50 dark:bg-stone-200 dark:text-neutral-900 border-transparent font-bold'
                  : 'bg-stone-50 dark:bg-[#111111] border-stone-200 dark:border-[#2A2A2A] text-neutral-700 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-[#1A1A1A]'
              }`}
            >
              Faculty Advisor
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Security Officer', 'security@vit.edu')}
              className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                selectedRole === 'Security Officer'
                  ? 'bg-neutral-900 text-stone-50 dark:bg-stone-200 dark:text-neutral-900 border-transparent font-bold'
                  : 'bg-stone-50 dark:bg-[#111111] border-stone-200 dark:border-[#2A2A2A] text-neutral-700 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-[#1A1A1A]'
              }`}
            >
              Security
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Finance Officer', 'finance@vit.edu')}
              className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                selectedRole === 'Finance Officer'
                  ? 'bg-neutral-900 text-stone-50 dark:bg-stone-200 dark:text-neutral-900 border-transparent font-bold'
                  : 'bg-stone-50 dark:bg-[#111111] border-stone-200 dark:border-[#2A2A2A] text-neutral-700 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-[#1A1A1A]'
              }`}
            >
              Finance
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Admin', 'admin@vit.edu')}
              className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                selectedRole === 'Admin'
                  ? 'bg-neutral-900 text-stone-50 dark:bg-stone-200 dark:text-neutral-900 border-transparent font-bold'
                  : 'bg-stone-50 dark:bg-[#111111] border-stone-200 dark:border-[#2A2A2A] text-neutral-700 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-[#1A1A1A]'
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
      <p className="mt-4 text-center text-xs text-stone-500 dark:text-neutral-400">
        {isRegistering ? 'Already registered?' : 'New student organizer?'}{' '}
        <button type="button" className="font-semibold text-neutral-900 dark:text-stone-200 underline" onClick={() => { setIsRegistering((value) => !value); setErrorMessage(null); }}>
          {isRegistering ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </Modal>
  );
};

export default AuthModal;
