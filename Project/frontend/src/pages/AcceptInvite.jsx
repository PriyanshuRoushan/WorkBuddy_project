import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { acceptInvitation, inspectInvitation } from '../services/api';

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { inspectInvitation(token).then(setInvite).catch(err => setError(err.response?.data?.message || 'Invitation is invalid')).finally(() => setLoading(false)); }, [token]);
  const submit = async e => {
    e.preventDefault();
    if (password.length < 8) return setError('Use at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');
    try {
      setLoading(true); setError('');
      const data = await acceptInvitation(token, password);
      localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data)); navigate('/');
    } catch (err) { setError(err.response?.data?.message || 'Could not activate your account'); } finally { setLoading(false); }
  };
  return <div className="min-h-screen paper-grid flex items-center justify-center p-6"><main className="rough-border bg-white p-8 w-full max-w-md">
    <span className="material-symbols-outlined text-5xl text-primary">mark_email_read</span><h1 className="font-headline-md text-headline-md mt-3">Create your password</h1>
    {invite && <p className="mt-2 text-on-surface-variant">Welcome, {invite.user.name}. Your employee ID is <strong>{invite.user.employeeId}</strong>.</p>}
    {error && <div className="bg-error-container text-on-error-container p-3 mt-5 border border-error">{error}</div>}
    {!loading && invite && <form onSubmit={submit} className="space-y-4 mt-6"><input className="w-full p-3 border-2 border-on-background" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (8+ characters)" required /><input className="w-full p-3 border-2 border-on-background" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm password" required /><button className="w-full p-3 bg-primary-container border-2 border-on-background font-bold cursor-pointer">Activate my account</button></form>}
    {loading && <p className="mt-6">Checking invitation…</p>}
  </main></div>;
};
export default AcceptInvite;
