import React, { useState } from 'react';
import { Mail, Lock, UserCheck, ShieldAlert, KeyRound, Sparkles } from 'lucide-react';
import Modal from '../common/Modal';
import Input, { Select } from '../common/Input';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { MOCK_ROLES } from '../../data/mockData';

export const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('alex.morgan@university.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState('Student Organizer');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLoginSuccess({
      name:
        selectedRole === 'Student Organizer'
          ? 'Alexandre Morgan'
          : selectedRole === 'Faculty Advisor'
          ? 'Dr. Evelyn Vance'
          : selectedRole === 'Finance Officer'
          ? 'Helena Troy, Bursar'
          : selectedRole === 'Security Officer'
          ? 'Capt. Marcus Kane'
          : 'Dean Katherine Vance',
      email: email,
      role: selectedRole,
      department:
        selectedRole === 'Student Organizer'
          ? 'Computer Science & Engineering Society'
          : 'Institutional Administration',
    });
    onClose();
  };

  const handleQuickPreset = (role, demoEmail) => {
    setSelectedRole(role);
    setEmail(demoEmail);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Institutional Single Sign-On"
      subtitle="Veritas Multi-Role Authentication & Access Control (Module 01)"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Security protocol banner */}
        <div className="p-3 rounded-lg bg-zinc-100 dark:bg-emerald-950/20 border border-zinc-200 dark:border-emerald-500/20 flex items-start gap-2.5 text-xs text-zinc-700 dark:text-slate-300 font-sans">
          <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Hybrid Session-JWT binding active. Server-side revocation enabled with role-gated
            permissions.
          </span>
        </div>

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

        {/* Role Selector (Critical Constraint) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold tracking-wider uppercase text-zinc-700 dark:text-slate-300 font-sans">
            Active Authorization Role
          </label>
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full h-10 px-3 text-sm font-sans rounded transition-all duration-200 outline-none
                bg-white text-zinc-900 border border-zinc-300
                focus:border-black focus:ring-1 focus:ring-black
                dark:bg-[#090D10] dark:text-white dark:border-white/15
                dark:focus:border-emerald-400 dark:focus:ring-1 dark:focus:ring-emerald-400/30"
            >
              {MOCK_ROLES.map((role) => (
                <option key={role} value={role} className="bg-white dark:bg-[#090D10] text-zinc-900 dark:text-white">
                  {role}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-slate-400 font-sans">
            Controls UI permissions and access to approval queues or budget desks.
          </p>
        </div>

        {/* Quick Demo Role Presets */}
        <div className="pt-2 border-t border-zinc-100 dark:border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-slate-400 block mb-2">
            One-Click Quick Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickPreset('Student Organizer', 'alex.morgan@university.edu')}
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
              onClick={() => handleQuickPreset('Faculty Advisor', 'evelyn.vance@university.edu')}
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
              onClick={() => handleQuickPreset('Finance Officer', 'helena.troy@university.edu')}
              className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                selectedRole === 'Finance Officer'
                  ? 'bg-black text-white dark:bg-emerald-500 dark:text-black border-transparent font-bold'
                  : 'bg-zinc-100 dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-slate-300'
              }`}
            >
              Finance Bursar
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Security Officer', 'marcus.kane@university.edu')}
              className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                selectedRole === 'Security Officer'
                  ? 'bg-black text-white dark:bg-emerald-500 dark:text-black border-transparent font-bold'
                  : 'bg-zinc-100 dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-slate-300'
              }`}
            >
              Security
            </button>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-3">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full justify-center text-sm font-bold tracking-wide"
          >
            Authenticate as {selectedRole}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AuthModal;
