import { useEffect, useState } from 'react';
import { getPeople, invitePerson, updatePerson, updateAccountStatus } from '../services/api';

const roles = ['CEO', 'HR', 'MANAGER', 'TEAM_HEAD', 'EMPLOYEE', 'VIEWER'];
const emptyForm = { name: '', email: '', accessRole: 'EMPLOYEE', jobTitle: '', department: '', team: '', managerId: '' };

const Team = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canAdmin = ['CEO', 'HR'].includes(currentUser.accessRole || currentUser.role);
  const canEditJobTitles = canAdmin || (currentUser.accessRole || currentUser.role) === 'TEAM_HEAD';
  const [people, setPeople] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showInvite, setShowInvite] = useState(false);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const load = () => getPeople().then(setPeople).catch(err => setError(err.response?.data?.message || 'Could not load employees'));
  useEffect(() => { load(); }, []);
  const managers = people.filter(p => ['CEO', 'HR', 'MANAGER', 'TEAM_HEAD'].includes(p.accessRole));

  const invite = async e => {
    e.preventDefault(); setError(''); setMessage('');
    try {
      const result = await invitePerson(form);
      setMessage(result.emailDelivered ? `Invitation emailed to ${form.email}.` : `Development invitation created: ${result.developmentInviteUrl}`);
      setShowInvite(false); setForm(emptyForm); load();
    } catch (err) { setError(err.response?.data?.message || 'Invitation failed'); }
  };
  const save = async e => {
    e.preventDefault();
    try { await updatePerson(editing._id, editing); setEditing(null); setMessage('Employee details updated.'); load(); }
    catch (err) { setError(err.response?.data?.message || 'Update failed'); }
  };
  const toggleStatus = async person => {
    const next = person.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try { await updateAccountStatus(person._id, next); load(); }
    catch (err) { setError(err.response?.data?.message || 'Status update failed'); }
  };
  const fields = (value, setter, includeIdentity = false) => <>
    {includeIdentity && <><input className="p-2 border-2 border-on-background" placeholder="Full name" value={value.name} onChange={e => setter({ ...value, name: e.target.value })} required /><input className="p-2 border-2 border-on-background" type="email" placeholder="Company email" value={value.email} onChange={e => setter({ ...value, email: e.target.value })} required /></>}
    <select className="p-2 border-2 border-on-background bg-white" value={value.accessRole} onChange={e => setter({ ...value, accessRole: e.target.value })}>{roles.map(r => <option key={r}>{r}</option>)}</select>
    <input className="p-2 border-2 border-on-background" placeholder="Job title (e.g. QA Engineer)" value={value.jobTitle || ''} onChange={e => setter({ ...value, jobTitle: e.target.value })} required />
    <input className="p-2 border-2 border-on-background" placeholder="Department" value={value.department || ''} onChange={e => setter({ ...value, department: e.target.value })} />
    <input className="p-2 border-2 border-on-background" placeholder="Team" value={value.team || ''} onChange={e => setter({ ...value, team: e.target.value })} />
    <select className="p-2 border-2 border-on-background bg-white" value={value.managerId?._id || value.managerId || ''} onChange={e => setter({ ...value, managerId: e.target.value })}><option value="">No reporting manager</option>{managers.filter(m => m._id !== value._id).map(m => <option key={m._id} value={m._id}>{m.name} — {m.accessRole}</option>)}</select>
  </>;

  return <div className="p-margin pb-24"><div className="flex justify-between items-end gap-4 mb-8"><div><h1 className="font-display-lg text-display-lg">People & hierarchy</h1><p className="text-on-surface-variant mt-2">Company access, job titles, reporting lines, and account status.</p></div>{canAdmin && <button onClick={() => setShowInvite(true)} className="rough-border bg-primary-container px-6 py-3 font-bold cursor-pointer">+ Invite employee</button>}</div>
    {message && <div className="p-3 bg-tertiary-container border-2 border-on-background mb-4 break-all">{message}</div>}{error && <div className="p-3 bg-error-container text-on-error-container border-2 border-error mb-4">{error}</div>}
    <div className="rough-border bg-white overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-surface-container border-b-2 border-on-background"><tr>{['Employee','ID','Access','Department / team','Reports to','Status',''].map(h => <th key={h} className="p-4 text-xs uppercase">{h}</th>)}</tr></thead><tbody>{people.map(p => <tr key={p._id} className="border-b border-outline-variant"><td className="p-4"><strong>{p.name}</strong><div className="text-xs text-on-surface-variant">{p.email}<br />{p.jobTitle}</div></td><td className="p-4 text-sm">{p.employeeId}</td><td className="p-4"><span className="bg-primary-container px-2 py-1 text-xs font-bold">{p.accessRole}</span></td><td className="p-4 text-sm">{p.department || '—'} / {p.team || '—'}</td><td className="p-4 text-sm">{p.managerId?.name || '—'}</td><td className="p-4 text-xs font-bold">{p.accountStatus}</td><td className="p-4">{canEditJobTitles && p._id !== currentUser._id && (canAdmin || p.team === currentUser.team) && <div className="flex gap-2"><button onClick={() => setEditing({ ...p, managerId: p.managerId?._id || '' })} className="border border-on-background p-2 cursor-pointer">Edit</button>{canAdmin && <button onClick={() => toggleStatus(p)} className="border border-on-background p-2 cursor-pointer">{p.accountStatus === 'SUSPENDED' ? 'Restore' : 'Suspend'}</button>}</div>}</td></tr>)}</tbody></table></div>
    {(showInvite || editing) && <div className="fixed inset-0 bg-on-background/40 flex items-center justify-center z-50 p-4"><div className="bg-white rough-border p-7 w-full max-w-lg"><div className="flex justify-between mb-5"><h2 className="font-headline-sm text-headline-sm">{editing ? 'Edit employee' : 'Invite employee'}</h2><button onClick={() => { setShowInvite(false); setEditing(null); }} className="cursor-pointer">✕</button></div><form onSubmit={editing ? save : invite} className="grid gap-3">{editing ? (canAdmin ? fields(editing, setEditing) : <input className="p-2 border-2 border-on-background" value={editing.jobTitle || ''} onChange={e => setEditing({...editing, jobTitle:e.target.value})} placeholder="Job title" required />) : fields(form, setForm, true)}<button className="p-3 bg-primary-container border-2 border-on-background font-bold cursor-pointer">{editing ? 'Save changes' : 'Send invitation'}</button></form></div></div>}
  </div>;
};
export default Team;
