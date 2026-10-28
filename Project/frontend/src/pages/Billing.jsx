import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getSubscription } from '../services/api';

const Billing = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { getSubscription().then(setSubscription).catch(err => setError(err.response?.data?.message || 'Could not load subscription')); }, []);
  if ((user.accessRole || user.role) !== 'CEO') return <Navigate to="/" replace />;
  return <div className="p-margin"><h1 className="font-display-lg text-display-lg">Subscription</h1><p className="mt-2 text-on-surface-variant">Visible only to the company CEO/Owner.</p>{error && <div className="bg-error-container p-3 mt-6">{error}</div>}{subscription && <div className="rough-border bg-white p-8 mt-8 max-w-2xl"><div className="flex justify-between"><div><p className="text-xs uppercase">Current plan</p><h2 className="font-headline-md text-headline-md mt-1">{subscription.plan}</h2></div><span className="bg-tertiary-container px-3 py-2 h-fit font-bold">{subscription.status}</span></div><div className="grid grid-cols-2 gap-6 mt-8"><div><p className="text-xs uppercase">Seats</p><strong className="text-2xl">{subscription.seats}</strong></div><div><p className="text-xs uppercase">Next renewal</p><strong>{subscription.renewsAt ? new Date(subscription.renewsAt).toLocaleDateString() : 'Not scheduled'}</strong></div></div><p className="text-xs text-on-surface-variant mt-8">Payment card details are stored by the payment provider and are never stored in WorkBuddy.</p></div>}</div>;
};
export default Billing;
