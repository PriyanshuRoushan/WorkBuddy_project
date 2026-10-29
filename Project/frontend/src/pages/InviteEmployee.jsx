import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getPeople, invitePerson } from '../services/api';

const roles = [
  ['EMPLOYEE', 'Standard access to assigned team and projects'],
  ['TEAM_HEAD', 'Leads a team and manages project work'],
  ['MANAGER', 'Manages departments, teams, and assigned projects'],
  ['HR', 'Manages people and can access every company workspace'],
  ['CEO', 'Full company access, billing, and administration'],
  ['VIEWER', 'Read-only access to assigned work']
];
const roleLevels = { CEO: 50, HR: 40, MANAGER: 30, TEAM_HEAD: 30, EMPLOYEE: 20, VIEWER: 10 };
const initial = { name:'', email:'', accessRole:'EMPLOYEE', jobTitle:'', department:'', team:'', managerId:'' };

const InviteEmployee = () => {
  const current = JSON.parse(localStorage.getItem('user') || '{}');
  const currentRole = current.accessRole || current.role;
  const allowed = ['CEO','HR'].includes(currentRole);
  const assignableRoles = roles.filter(([role]) => roleLevels[currentRole] > roleLevels[role]);
  const [form,setForm]=useState(initial); const [people,setPeople]=useState([]); const [loading,setLoading]=useState(false); const [error,setError]=useState(''); const [result,setResult]=useState(null);
  useEffect(()=>{if(allowed)getPeople().then(setPeople).catch(err=>setError(err.response?.data?.message||'Could not load reporting managers.'));},[allowed]);
  if(!allowed)return <Navigate to="/team" replace/>;
  const managers=people.filter(person=>['CEO','HR','MANAGER','TEAM_HEAD'].includes(person.accessRole)&&person.accountStatus!=='SUSPENDED');
  const submit=async e=>{e.preventDefault();setError('');try{setLoading(true);setResult(await invitePerson(form));}catch(err){setError(err.response?.data?.message||'Could not send invitation.');}finally{setLoading(false);}};
  if(result)return <div className="p-margin max-w-3xl mx-auto"><div className="rough-border bg-surface p-10 text-center mt-10"><span className="material-symbols-outlined text-6xl text-tertiary">mark_email_read</span><h1 className="font-headline-md text-headline-md mt-4">Invitation created</h1><p className="mt-3 text-on-surface-variant">{result.emailDelivered?`An invitation was emailed to ${result.user.email}.`:`Email delivery is not configured. Use the development invitation link below.`}</p>{result.developmentInviteUrl&&<div className="bg-surface-container border-2 border-on-background p-3 mt-5 break-all text-left text-sm select-all">{result.developmentInviteUrl}</div>}<div className="flex flex-wrap justify-center gap-3 mt-7"><Link to="/team" className="border-2 border-on-background px-5 py-3 font-bold">Return to team</Link><button onClick={()=>{setForm(initial);setResult(null);}} className="bg-primary-container text-on-primary-container border-2 border-on-background px-5 py-3 font-bold">Invite another employee</button></div></div></div>;
  return <div className="p-margin pb-24 max-w-5xl mx-auto"><Link to="/team" className="inline-flex items-center gap-2 text-sm font-bold mb-6"><span className="material-symbols-outlined">arrow_back</span>Back to people</Link><header className="mb-8"><h1 className="font-display-lg text-display-lg">Invite employee</h1><p className="text-on-surface-variant mt-2">Create the employee record and send a secure first-login password link.</p></header>{error&&<div className="bg-error-container text-on-error-container border-2 border-error p-4 mb-5">{error}</div>}
    <form onSubmit={submit} className="grid lg:grid-cols-12 gap-6"><section className="lg:col-span-7 rough-border bg-surface p-7"><h2 className="font-headline-sm text-headline-sm mb-6">Employee information</h2><div className="grid sm:grid-cols-2 gap-4"><label><span className="text-xs uppercase font-bold">Official name *</span><input className="w-full bg-transparent border-2 border-on-background p-3 mt-1" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label><span className="text-xs uppercase font-bold">Company email *</span><input type="email" className="w-full bg-transparent border-2 border-on-background p-3 mt-1" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></label><label><span className="text-xs uppercase font-bold">Job title *</span><input className="w-full bg-transparent border-2 border-on-background p-3 mt-1" value={form.jobTitle} onChange={e=>setForm({...form,jobTitle:e.target.value})} placeholder="e.g. Backend Developer" required/></label><label><span className="text-xs uppercase font-bold">Department</span><input className="w-full bg-transparent border-2 border-on-background p-3 mt-1" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} placeholder="e.g. Engineering"/></label><label><span className="text-xs uppercase font-bold">Team</span><input className="w-full bg-transparent border-2 border-on-background p-3 mt-1" value={form.team} onChange={e=>setForm({...form,team:e.target.value})} placeholder="e.g. Platform"/></label><label><span className="text-xs uppercase font-bold">Reporting manager</span><select className="w-full bg-surface border-2 border-on-background p-3 mt-1" value={form.managerId} onChange={e=>setForm({...form,managerId:e.target.value})}><option value="">No reporting manager</option>{managers.map(person=><option key={person._id} value={person._id}>{person.name} — {person.accessRole}</option>)}</select></label></div></section>
      <aside className="lg:col-span-5 rough-border bg-surface p-7"><h2 className="font-headline-sm text-headline-sm mb-5">Access role</h2><div className="grid gap-2">{assignableRoles.map(([value,description])=><label key={value} className={`border-2 p-3 cursor-pointer ${form.accessRole===value?'border-primary bg-primary-container text-on-primary-container':'border-outline-variant'}`}><div className="flex gap-3"><input type="radio" name="role" value={value} checked={form.accessRole===value} onChange={e=>setForm({...form,accessRole:e.target.value})}/><span><strong>{value.replace('_',' ')}</strong><span className="block text-xs mt-1 opacity-75">{description}</span></span></div></label>)}</div></aside>
      <div className="lg:col-span-12 flex justify-end gap-3"><Link to="/team" className="border-2 border-on-background px-6 py-3 font-bold">Cancel</Link><button disabled={loading} className="bg-primary-container text-on-primary-container border-2 border-on-background px-7 py-3 font-bold shadow-[4px_4px_0_#1c1b1b]">{loading?'Creating invitation…':'Create and send invitation'}</button></div></form>
  </div>;
};
export default InviteEmployee;
