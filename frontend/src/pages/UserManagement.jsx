import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, Loader2 } from 'lucide-react';
import Button from '../components/common/Button';
import { usersApi } from '../api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const [userData, roleData] = await Promise.all([usersApi.list(), usersApi.roles()]);
      setUsers(userData);
      setRoles(roleData);
      setSelected(Object.fromEntries(userData.map((user) => [user.id, user.roles?.[0]?.role_name || 'Student Organizer'])));
      setMessage('');
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Could not load users. Sign in with an administrator account.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-sync data fetching on component mount
  useEffect(() => {
    refresh();
  }, []);

  const saveRole = async (user) => {
    setSaving(user.id);
    setMessage('');
    try {
      await usersApi.assignRoles(user.id, [selected[user.id]]);
      await refresh();
      setMessage(`Access role updated for ${user.name}.`);
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Role assignment could not be saved.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 dark:border-[#2A2A2A] pb-6 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900 dark:text-neutral-100">User Access Administration</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Review accounts and assign university system roles.</p>
        </div>
      </div>
      {message && <div role="status" className="mb-5 rounded-lg border border-stone-200 dark:border-[#2A2A2A] bg-stone-100 dark:bg-[#1A1A1A] p-3 text-sm text-neutral-800 dark:text-neutral-200">{message}</div>}
      {loading ? <div className="flex items-center gap-2 py-12 text-neutral-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading accounts...</div> : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-[#2A2A2A] bg-stone-100 dark:bg-[#1A1A1A]">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 dark:bg-[#151515] text-neutral-600 dark:text-neutral-400"><tr><th className="p-4">Account</th><th className="p-4">Current role</th><th className="p-4">Assign role</th><th className="p-4">Action</th></tr></thead>
            <tbody>{users.map((user) => (
              <tr key={user.id} className="border-t border-stone-200 dark:border-[#2A2A2A]">
                <td className="p-4"><div className="font-semibold text-neutral-900 dark:text-neutral-100">{user.name}</div><div className="text-xs text-neutral-500 dark:text-neutral-400">{user.email}</div></td>
                <td className="p-4 text-neutral-700 dark:text-neutral-300">{(user.roles || []).map((role) => role.role_name).join(', ') || 'No role'}</td>
                <td className="p-4"><select aria-label={`Assign role to ${user.name}`} value={selected[user.id] || ''} onChange={(event) => setSelected((current) => ({ ...current, [user.id]: event.target.value }))} className="rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-neutral-900 dark:border-[#2A2A2A] dark:bg-[#111111] dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-stone-400">{roles.map((role) => <option key={role.id} value={role.role_name}>{role.role_name}</option>)}</select></td>
                <td className="p-4"><Button size="sm" variant="secondary" icon={saving === user.id ? Loader2 : ShieldCheck} disabled={saving === user.id} onClick={() => saveRole(user)}>{saving === user.id ? 'Saving...' : 'Save role'}</Button></td>
              </tr>
            ))}</tbody>
          </table>
          {!users.length && <div className="p-8 text-center text-sm text-neutral-500"><Users className="mx-auto mb-2 h-5 w-5" />No accounts found.</div>}
        </div>
      )}
    </main>
  );
}
