import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, Loader2, RefreshCw } from 'lucide-react';
import Badge from '../components/common/Badge';
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

  useEffect(() => { refresh(); }, []);

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
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-6 mb-6">
        <div>
          <Badge variant="success">Module 01: User and Role Management</Badge>
          <h1 className="mt-3 font-serif text-3xl font-bold text-zinc-950 dark:text-white">User Access Administration</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-slate-400">Review accounts and assign university system roles.</p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={refresh}>Refresh</Button>
      </div>
      {message && <div role="status" className="mb-5 rounded-lg border border-zinc-200 dark:border-white/10 p-3 text-sm text-zinc-700 dark:text-slate-200">{message}</div>}
      {loading ? <div className="flex items-center gap-2 py-12 text-zinc-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading accounts...</div> : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-white/[0.04] text-zinc-600 dark:text-slate-300"><tr><th className="p-4">Account</th><th className="p-4">Current role</th><th className="p-4">Assign role</th><th className="p-4">Action</th></tr></thead>
            <tbody>{users.map((user) => (
              <tr key={user.id} className="border-t border-zinc-200 dark:border-white/10">
                <td className="p-4"><div className="font-semibold text-zinc-900 dark:text-white">{user.name}</div><div className="text-xs text-zinc-500">{user.email}</div></td>
                <td className="p-4">{(user.roles || []).map((role) => role.role_name).join(', ') || 'No role'}</td>
                <td className="p-4"><select aria-label={`Assign role to ${user.name}`} value={selected[user.id] || ''} onChange={(event) => setSelected((current) => ({ ...current, [user.id]: event.target.value }))} className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-white/15 dark:bg-[#090D10] dark:text-white">{roles.map((role) => <option key={role.id} value={role.role_name}>{role.role_name}</option>)}</select></td>
                <td className="p-4"><Button size="sm" variant="secondary" icon={saving === user.id ? Loader2 : ShieldCheck} disabled={saving === user.id} onClick={() => saveRole(user)}>{saving === user.id ? 'Saving...' : 'Save role'}</Button></td>
              </tr>
            ))}</tbody>
          </table>
          {!users.length && <div className="p-8 text-center text-sm text-zinc-500"><Users className="mx-auto mb-2 h-5 w-5" />No accounts found.</div>}
        </div>
      )}
    </main>
  );
}
