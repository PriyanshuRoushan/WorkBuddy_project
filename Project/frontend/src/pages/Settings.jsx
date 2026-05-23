import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { getMe, updateProfile } from '../services/api';

const Settings = () => {
  const { setRefreshTrigger } = useOutletContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [sketchStyle, setSketchStyle] = useState('Pencil');
  const [gridDensity, setGridDensity] = useState(50);
  const [notifySparks, setNotifySparks] = useState(true);
  const [notifyScribbles, setNotifyScribbles] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Read-only employee details
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [joinedDate, setJoinedDate] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const data = await getMe();
        setName(data.name || '');
        setBio(data.bio || '');
        setProfileImage(data.profileImage || '');
        setSketchStyle(data.sketchStyle || 'Pencil');
        setGridDensity(data.gridDensity !== undefined ? data.gridDensity : 50);
        setNotifySparks(data.notifySparks !== undefined ? data.notifySparks : true);
        setNotifyScribbles(data.notifyScribbles !== undefined ? data.notifyScribbles : false);
        setRole(data.role || 'Designer');
        setEmail(data.email || '');
        setUserId(data._id || '');
        setJoinedDate(data.createdAt || '');
      } catch (err) {
        console.error('Error fetching settings user:', err);
        setError('Could not retrieve profile info. Is backend running?');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      const payload = {
        name,
        bio,
        sketchStyle,
        gridDensity: Number(gridDensity),
        notifySparks,
        notifyScribbles
      };

      if (newPassword) {
        if (!currentPassword) {
          return setError('Please enter your current password to update it.');
        }
        payload.password = newPassword;
      }

      const updatedUser = await updateProfile(payload);
      
      // Update local storage
      localStorage.setItem('user', JSON.stringify({
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage
      }));
      if (updatedUser.token) {
        localStorage.setItem('token', updatedUser.token);
      }

      setSuccess('Settings saved successfully!');
      setRefreshTrigger(prev => prev + 1);

      // Scroll to top to see success alert
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error updating settings. Password might be incorrect.');
    }
  };

  const handleDiscard = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="p-margin flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
        <p className="font-headline-sm mt-4">Loading settings panel...</p>
      </div>
    );
  }

  return (
    <div className="p-margin pb-24">
      {/* Header */}
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h2 className="font-display-lg text-display-lg scribble-underline text-on-surface">Settings</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Personalize your creative engine.</p>
        </div>
      </header>

      {error && (
        <div className="bg-error-container text-on-error-container border border-error p-4 text-sm font-annotation rounded mb-6 rotate-[0.5deg]">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-tertiary-container text-on-tertiary-container border border-tertiary p-4 text-sm font-annotation rounded mb-6 rotate-[-0.5deg]">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-gutter select-none">
        {/* Profile Settings (Col span 7) */}
        <section className="lg:col-span-7 rough-border bg-surface p-8 rounded-lg rotate-[-0.5deg]">
          <div className="tape-effect"></div>
          <h3 className="font-headline-sm text-headline-sm mb-8 flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined">person</span>
            Profile Settings
          </h3>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="relative shrink-0">
              <div className="w-32 h-32 rounded-full border-4 border-dashed border-primary overflow-hidden flex items-center justify-center bg-surface-container rotate-[2deg]">
                <img
                  alt="Profile"
                  className="w-full h-full object-cover"
                  src={profileImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCKlzErB5bTRryWZ9kKt0oiK9DwbcHdLdJB9qybJhLy-dzJ5DM31amBATHedwlN3X9J7VD96TmCF3mFQcMczf8WTwvXqOHWAd44WpluP6efrp03TZotpx9kJuc2IrqAGsXcS_K6_GLEdcSkeQNN1f4J5thBvpNgg_chr5QC74edErxb-JF3PPjxApBzJtKa-NfCvyS-T1sD7yuzJb6-GlhxYHfE4AfkjDPYPfznuzdH46FkMEgleVV-s5nRecyZXxMB8TGuAAsSsJC'}
                />
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 bg-primary p-2 rounded-full text-on-primary border-2 border-on-background hover:scale-110 transition-transform cursor-pointer"
                onClick={() => alert('Profile image upload can be configured or linked to Gravatar!')}
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
            <div className="flex-grow space-y-6">
              <div>
                <label className="font-label-caps text-label-caps block mb-2 text-on-surface-variant">DOODLE NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-t-0 border-x-0 border-b-2 border-on-background py-2 focus:outline-none focus:border-primary font-body-lg focus:ring-0"
                />
              </div>
              <div>
                <label className="font-label-caps text-label-caps block mb-2 text-on-surface-variant">BIO</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-transparent border-2 border-on-background p-3 rounded h-24 focus:outline-none focus:border-primary font-body-md focus:ring-0"
                  placeholder="Tell us about your creative spark..."
                />
                <span className="font-annotation text-annotation text-on-surface-variant mt-1 block italic">Keep it scribbly!</span>
              </div>
            </div>
          </div>
        </section>

        {/* Employee Details (Col span 5) */}
        <section className="lg:col-span-5 rough-border bg-surface p-8 rounded-lg rotate-[0.5deg]">
          <div className="tape-effect !bg-primary-container/40"></div>
          <h3 className="font-headline-sm text-headline-sm mb-8 flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined">badge</span>
            Employee Details
          </h3>
          <div className="space-y-6 font-annotation">
            <div>
              <p className="font-label-caps text-xs text-on-surface-variant mb-1">Company Role</p>
              <span className="px-3 py-1 bg-primary-container text-on-primary-container font-bold rounded-lg border border-on-background inline-block uppercase text-xs">
                {role || 'Designer'}
              </span>
            </div>
            <div>
              <p className="font-label-caps text-xs text-on-surface-variant mb-1">Corporate Email</p>
              <p className="font-mono text-sm font-bold text-on-surface truncate" title={email}>{email || 'N/A'}</p>
            </div>
            <div>
              <p className="font-label-caps text-xs text-on-surface-variant mb-1">Workspace ID</p>
              <p className="font-mono text-xs text-on-surface-variant select-all">{userId || 'N/A'}</p>
            </div>
            <div>
              <p className="font-label-caps text-xs text-on-surface-variant mb-1">Member Since</p>
              <p className="text-sm font-bold text-on-surface">
                {joinedDate ? new Date(joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
        </section>

        {/* Workspace Preferences (Col span 4) */}
        <section className="lg:col-span-4 rough-border bg-surface p-8 rounded-lg rotate-[0.8deg]">
          <div className="tape-effect !bg-secondary-container/40"></div>
          <h3 className="font-headline-sm text-headline-sm mb-8 flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined">brush</span>
            Workspace
          </h3>
          <div className="space-y-8">
            <div>
              <label className="font-label-caps text-label-caps block mb-4 text-on-surface-variant">SKETCH STYLE</label>
              <div className="grid grid-cols-3 gap-2">
                {['Pencil', 'Marker', 'Ink'].map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSketchStyle(style)}
                    className={`border-2 border-on-background p-3 rounded font-bold hover:bg-primary-container transition-colors cursor-pointer text-xs ${sketchStyle === style ? 'bg-primary-container' : 'bg-transparent'}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-label-caps text-label-caps block mb-4 text-on-surface-variant">GRID DENSITY</label>
              <input
                type="range"
                min="0"
                max="100"
                value={gridDensity}
                onChange={(e) => setGridDensity(e.target.value)}
                className="w-full accent-primary h-2 bg-surface-container rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between mt-2 font-annotation text-annotation">
                <span>Loose</span>
                <span>Tight</span>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications (Col span 4) */}
        <section className="lg:col-span-4 rough-border bg-surface p-8 rounded-lg rotate-[-1deg]">
          <h3 className="font-headline-sm text-headline-sm mb-8 flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined">notifications_active</span>
            Notifications
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="pr-4">
                <p className="font-body-md font-bold">Idea Sparks</p>
                <p className="font-annotation text-on-surface-variant text-[11px] leading-tight">Get notified when someone doodles.</p>
              </div>
              <div className="relative inline-block w-12 h-6 align-middle select-none shrink-0">
                <input
                  type="checkbox"
                  id="toggle1"
                  checked={notifySparks}
                  onChange={(e) => setNotifySparks(e.target.checked)}
                  className="sr-only"
                />
                <label
                  htmlFor="toggle1"
                  className={`block overflow-hidden h-6 rounded-full border-2 border-on-background cursor-pointer transition-colors duration-200 ${notifySparks ? 'bg-primary-container' : 'bg-surface-container-high'}`}
                >
                  <span className={`block h-4 w-4 rounded-full bg-white border border-on-background transition-transform duration-200 m-[2px] ${notifySparks ? 'translate-x-6' : ''}`}></span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="pr-4">
                <p className="font-body-md font-bold">Team Scribbles</p>
                <p className="font-annotation text-on-surface-variant text-[11px] leading-tight">Daily digest of creative updates.</p>
              </div>
              <div className="relative inline-block w-12 h-6 align-middle select-none shrink-0">
                <input
                  type="checkbox"
                  id="toggle2"
                  checked={notifyScribbles}
                  onChange={(e) => setNotifyScribbles(e.target.checked)}
                  className="sr-only"
                />
                <label
                  htmlFor="toggle2"
                  className={`block overflow-hidden h-6 rounded-full border-2 border-on-background cursor-pointer transition-colors duration-200 ${notifyScribbles ? 'bg-primary-container' : 'bg-surface-container-high'}`}
                >
                  <span className={`block h-4 w-4 rounded-full bg-white border border-on-background transition-transform duration-200 m-[2px] ${notifyScribbles ? 'translate-x-6' : ''}`}></span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Security (Col span 4) */}
        <section className="lg:col-span-4 rough-border bg-surface p-8 rounded-lg rotate-[0.5deg]">
          <h3 className="font-headline-sm text-headline-sm mb-8 flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined">lock</span>
            Security
          </h3>
          <div className="space-y-4">
            <div>
              <label className="font-label-caps text-label-caps block mb-1 text-on-surface-variant text-[11px]">CURRENT PASSWORD</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-transparent border-t-0 border-x-0 border-b-2 border-on-background py-2 focus:outline-none focus:border-primary focus:ring-0 text-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="font-label-caps text-label-caps block mb-1 text-on-surface-variant text-[11px]">NEW PASSWORD</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-transparent border-t-0 border-x-0 border-b-2 border-on-background py-2 focus:outline-none focus:border-primary focus:ring-0 text-sm"
                placeholder="Leave blank to keep same"
              />
            </div>
            <button
              type="button"
              className="mt-2 font-bold text-primary underline hover:text-on-surface-variant transition-colors cursor-pointer text-xs"
              onClick={() => alert('Forgot password reset email can be sent!')}
            >
              Forgot Password?
            </button>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="col-span-12 mt-12 flex justify-end gap-4 shrink-0">
          <button
            type="button"
            onClick={handleDiscard}
            className="px-8 py-3 border-2 border-on-background font-bold rounded hover:bg-surface-container transition-colors cursor-pointer"
          >
            Discard
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-primary text-on-primary border-2 border-on-background font-bold rounded shadow-[4px_4px_0px_0px_rgba(28,27,27,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] active:translate-y-[0px] active:translate-x-[0px] active:shadow-none transition-all cursor-pointer"
          >
            Save My Doodle
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
