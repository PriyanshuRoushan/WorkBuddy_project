import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, restoreSession } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) return navigate('/', { replace: true });
    restoreSession().then(data => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/', { replace: true });
    }).catch(() => {});
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      return setError('Please fill in all fields');
    }
    try {
      setError('');
      setLoading(true);
      const data = await login(email, password, companySlug);
      
      // Save token & user details
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      
      // Redirect to dashboard
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center paper-grid bg-background p-6 font-body-md text-on-surface select-none">
      {/* Main Content Container */}
      <main className="relative w-full max-w-md">
        
        {/* Background Decorations (Doodles) */}
        <div className="absolute -top-12 -left-12 rotate-[-15deg] opacity-20 pointer-events-none">
          <span className="material-symbols-outlined text-[120px] text-primary">edit</span>
        </div>
        <div className="absolute -bottom-16 -right-12 rotate-[12deg] opacity-20 pointer-events-none">
          <span className="material-symbols-outlined text-[100px] text-secondary">palette</span>
        </div>

        {/* Login Card */}
        <div className="relative bg-white border-2 border-on-background rough-border p-margin shadow-[8px_8px_0px_0px_rgba(28,27,27,0.1)] rotate-[-0.5deg]">
          
          {/* Tape Accents */}
          <div className="tape-accent -top-4 -left-6 !transform rotate-[-15deg]"></div>
          <div className="tape-accent -bottom-4 -right-6 !transform rotate-[165deg]"></div>

          {/* Header */}
          <header className="mb-10 text-center relative">
            <div className="flex justify-center mb-4">
              <div className="p-2 border-2 border-on-background bg-primary-container rounded-lg rotate-[-3deg] jiggle cursor-default inline-flex">
                <span className="material-symbols-outlined text-4xl text-on-primary-container">draw</span>
              </div>
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface mb-2">Welcome Back!</h1>
            <p className="font-body-md text-body-md text-on-surface-variant scribble-underline inline-block">
              Time to fill another page.
            </p>

            {/* Hand-drawn Arrow Decorator */}
            <div className="absolute -right-8 top-12 hidden md:block select-none">
              <span className="material-symbols-outlined text-primary text-4xl rotate-45">north_east</span>
              <p className="font-annotation text-annotation text-primary mt-1 -rotate-6">Start here!</p>
            </div>
          </header>

          {error && (
            <div className="bg-error-container text-on-error-container border border-error p-3 text-sm font-annotation rounded mb-6 rotate-[-1deg]">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="font-label-caps text-label-caps text-on-surface flex items-center gap-1">
                Doodle Email
                <span className="text-error font-bold text-lg leading-none">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-outline-variant">mail</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-t-0 border-x-0 border-b-2 border-on-background focus:ring-0 focus:border-primary transition-colors font-body-lg text-body-lg placeholder:text-surface-dim outline-none"
                  placeholder="pencil@sketchbook.com"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-label-caps text-label-caps text-on-surface">Company workspace <span className="normal-case font-normal opacity-60">(only needed if your email belongs to multiple companies)</span></label>
              <div className="relative"><span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-outline-variant">domain</span><input value={companySlug} onChange={e => setCompanySlug(e.target.value)} className="w-full pl-8 pr-4 py-3 bg-transparent border-t-0 border-x-0 border-b-2 border-on-background focus:border-primary outline-none" placeholder="acme" /></div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="font-label-caps text-label-caps text-on-surface flex items-center gap-1" htmlFor="password">
                Secret Scribble
                <span className="text-error font-bold text-lg leading-none">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-outline-variant">lock</span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-t-0 border-x-0 border-b-2 border-on-background focus:ring-0 focus:border-primary transition-colors font-body-lg text-body-lg placeholder:text-surface-dim outline-none"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Primary Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-primary-container text-on-primary-container font-headline-sm text-headline-sm border-2 border-on-background rounded-lg shadow-[4px_4px_0px_0px_#1c1b1b] hover:shadow-[6px_6px_0px_0px_#1c1b1b] hover:translate-y-[-2px] hover:translate-x-[-2px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all jiggle cursor-pointer flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    <span>Opening WorkBuddy...</span>
                  </>
                ) : (
                  <>
                    <span>Login!</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Social Login Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-grow h-[2px] bg-outline-variant"></div>
            <span className="font-annotation text-annotation text-on-surface-variant italic shrink-0">or quick sketch with</span>
            <div className="flex-grow h-[2px] bg-outline-variant"></div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-gutter">
            <button
              onClick={() => alert('Social sign-in configured for production!')}
              className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-on-background bg-white rounded-lg font-body-md text-body-md hover:bg-surface-container transition-colors rotate-[1deg] cursor-pointer"
            >
              <img alt="Google" className="w-5 h-5 shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFt6ctECS-8PbyVyfdS-SyKP3QQ-9c_UVQKMtnkKfIGC8WhQecPQTXg9R3vrEPGWnoSh9IWlTX1mYGwcjtCEM0Sx0kHorhseyOaWGeSl4lXN5QDzGH9svPFFsHHvaW92qjA1yfYh-pF8cQc765iC_00-o5fyQgg-UDCMOFUYanqCtCLHyY7jsBJTb7YkW6GaVKhh_GlgSgNzDp7KMrbvOFHxk03kZn12nVCzO5tnfyNdJWIuQ-h_a0UgwExVevVXRpXcYnqaz6CEqx" />
              <span>Google</span>
            </button>
            <button
              onClick={() => alert('Social sign-in configured for production!')}
              className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-on-background bg-white rounded-lg font-body-md text-body-md hover:bg-surface-container transition-colors rotate-[-1deg] cursor-pointer"
            >
              <span className="material-symbols-outlined text-on-surface text-sm shrink-0">terminal</span>
              <span>Github</span>
            </button>
          </div>

          {/* Hand-drawn star decorator */}
          <div className="absolute -top-6 -right-6 select-none">
            <span className="material-symbols-outlined text-primary-container text-5xl rotate-12 drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          </div>
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="font-body-md text-body-md text-on-surface-variant">Accounts are created by your company CEO or HR team.</p>
          {/* Atmospheric Annotation */}
          <div className="flex justify-center items-center gap-2 opacity-60">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span className="font-annotation text-xs uppercase tracking-widest">Created By Priyanshu Roushan</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
