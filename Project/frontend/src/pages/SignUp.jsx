import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Designer');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Pencil focus tracking states
  const [pencilTop, setPencilTop] = useState(0);
  const formRef = useRef(null);

  const handleInputFocus = (e) => {
    const input = e.target;
    const form = formRef.current;
    if (form) {
      const inputRect = input.getBoundingClientRect();
      const formRect = form.getBoundingClientRect();
      // Calculate vertical offset relative to parent form
      const topOffset = (inputRect.top - formRect.top) + (inputRect.height / 4);
      setPencilTop(topOffset);
    }
  };

  // Initialize pencil position on first focusable element
  useEffect(() => {
    const firstInput = document.getElementById('artist-name');
    if (firstInput && formRef.current) {
      setTimeout(() => {
        const inputRect = firstInput.getBoundingClientRect();
        const formRect = formRef.current.getBoundingClientRect();
        const topOffset = (inputRect.top - formRect.top) + (inputRect.height / 4);
        setPencilTop(topOffset);
      }, 100);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      return setError('Please fill in all fields');
    }
    if (!termsAccepted) {
      return setError('Please accept the Creative Terms to proceed');
    }

    try {
      setError('');
      setLoading(true);
      const data = await register(name, email, password, role);
      
      // Save token & user details
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        profileImage: data.profileImage
      }));
      
      // Redirect to dashboard
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error signing up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col overflow-x-hidden paper-grid justify-center py-4">
      <main className="flex-grow flex items-center justify-center p-4 container-max mx-auto relative select-none">
        {/* Sketchbook Background Elements */}
        <div className="absolute top-10 right-20 -rotate-6 opacity-20 hidden lg:block">
          <span className="material-symbols-outlined text-[120px]" data-icon="draw">draw</span>
        </div>
        <div className="absolute bottom-20 left-10 rotate-12 opacity-20 hidden lg:block">
          <span className="material-symbols-outlined text-[100px]" data-icon="auto_fix">auto_fix</span>
        </div>

        {/* Main Signup Sketchbook Layout */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-surface-container-lowest rough-border overflow-hidden min-h-0 shadow-[4px_4px_0px_0px_rgba(28,27,27,1)]">
          {/* Left Side: Illustrative Banner */}
          <div className="md:col-span-5 bg-primary-container p-6 flex flex-col justify-center gap-4 relative overflow-hidden border-r-2 border-on-background">
            <div className="relative z-10">
              <div className="bg-white px-4 py-2 inline-block rough-border -rotate-2 mb-4">
                <p className="font-annotation text-primary font-bold uppercase tracking-wider text-xs">Welcome to the studio!</p>
              </div>
              <h2 className="font-display-lg text-on-primary-container mb-2 text-2xl md:text-3xl">Turn your scribbles into systems.</h2>
              <p className="font-body-md text-on-primary-container opacity-80 text-sm leading-snug">Join 10,000+ creative minds building the future one doodle at a time.</p>
            </div>
            <div className="relative h-40 mt-4 flex items-center justify-center">
              <img
                className="w-full h-full object-contain"
                data-alt="A collection of whimsical hand-drawn 2D mascot characters representing creativity and collaboration. The style is clean black-and-white vector doodles with bright yellow accents, set against a warm cream-colored background. The mascots are interacting with giant floating stationery items like oversized pencils and paperclips in a high-key, playful studio environment."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDmvUxB5za1Ox-Wx2pZbstylSLxnsuWGTQH2aVqoJP8N1zzO8RjF3eUVZlvB3ZfMnKp4Oh6BtJGGz-MXbwlDSwVUcEg_ZlnAZFabF_3ZTj-aaDtRlTTwI8h5SQ7jtPfCoqAbkwjs-uNYr-EVLGFi86t6-nUhoyHswmhejz4oNsEpPfLJ_8xlVcvGvIEha9kq4z_OzqlNOxS40v132JB7JC6BZ8AJRZqQU78r3zVLX8NyuwbMYgZ9LmwH8knDTLLh1HoE09GE65ivxC"
              />
            </div>
            {/* Decorative Annotation */}
            <div className="absolute bottom-2 left-4 flex items-center gap-2 text-on-primary-container opacity-60">
              <span className="material-symbols-outlined text-sm" data-icon="gesture">gesture</span>
              <span className="font-annotation text-[10px]">Hand-crafted for creators</span>
            </div>
          </div>

          {/* Right Side: Signup Form */}
          <div className="md:col-span-7 p-6 md:p-8 relative flex flex-col justify-center bg-surface-container-lowest">
            
            {/* Multi-step Indicator */}
            <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-1 justify-center select-none">
              <div className="flex flex-col items-center gap-1 group">
                <div className="w-8 h-8 rounded-full rough-border bg-primary flex items-center justify-center text-white font-bold transition-transform group-hover:scale-110 text-sm">1</div>
                <span className="font-annotation text-[10px] font-bold uppercase">Identity</span>
              </div>
              <div className="h-[2px] w-8 bg-on-background opacity-20"></div>
              <div className="flex flex-col items-center gap-1 opacity-40 group">
                <div className="w-8 h-8 rounded-full border-2 border-on-background bg-surface flex items-center justify-center text-on-surface font-bold text-sm">2</div>
                <span className="font-annotation text-[10px] font-bold uppercase">Style</span>
              </div>
              <div className="h-[2px] w-8 bg-on-background opacity-20"></div>
              <div className="flex flex-col items-center gap-1 opacity-40 group">
                <div className="w-8 h-8 rounded-full border-2 border-on-background bg-surface flex items-center justify-center text-on-surface font-bold text-sm">3</div>
                <span className="font-annotation text-[10px] font-bold uppercase">Launch</span>
              </div>
            </div>

            {error && (
              <div className="bg-error-container text-on-error-container border border-error p-3 text-sm font-annotation rounded mb-4 rotate-[0.5deg]">
                {error}
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 relative" id="signupForm">
              {/* Pencil graphic pointing to active field */}
              <div
                className="absolute -left-10 transition-all duration-300 hidden md:block select-none"
                id="pencil-indicator"
                style={{ transform: `translateY(${pencilTop}px)` }}
              >
                <span className="material-symbols-outlined text-primary text-3xl -rotate-45" data-icon="edit">edit</span>
              </div>

              {/* Artist Name Field */}
              <div className="input-group flex flex-col gap-1 relative">
                <label className="font-label-caps text-on-surface-variant flex items-center gap-1 text-[11px]" htmlFor="artist-name">
                  Artist Name <span className="text-error font-annotation text-sm">*</span>
                </label>
                <input
                  id="artist-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="Picasso Jr."
                  className="w-full bg-transparent border-0 border-b-2 border-on-background focus:ring-0 focus:border-primary px-0 py-1 font-body-md text-on-surface placeholder:opacity-30 outline-none text-sm"
                  required
                  autoComplete="name"
                />
                <div className="scribble-underline h-1 w-full mt-[-2px]"></div>
              </div>

              {/* Creative Email Field */}
              <div className="input-group flex flex-col gap-1 relative">
                <label className="font-label-caps text-on-surface-variant flex items-center gap-1 text-[11px]" htmlFor="creative-email">
                  Creative Email <span className="text-error font-annotation text-sm">*</span>
                </label>
                <input
                  id="creative-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="hello@studio.com"
                  className="w-full bg-transparent border-0 border-b-2 border-on-background focus:ring-0 focus:border-primary px-0 py-1 font-body-md text-on-surface placeholder:opacity-30 outline-none text-sm"
                  required
                  autoComplete="username"
                />
                <div className="scribble-underline h-1 w-full mt-[-2px]"></div>
              </div>

              {/* Create a Scribble (Password) */}
              <div className="input-group flex flex-col gap-1 relative">
                <label className="font-label-caps text-on-surface-variant flex items-center gap-1 text-[11px]" htmlFor="password">
                  Create a Scribble <span className="text-error font-annotation text-sm">*</span>
                </label>
                <div className="relative">
                  <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-0 border-b-2 border-on-background focus:ring-0 focus:border-primary px-0 py-1 font-body-md text-on-surface placeholder:opacity-30 pr-8 outline-none text-sm"
                  required
                  autoComplete="new-password"
                />
                  <button
                    className="absolute right-0 top-1 text-on-surface-variant hover:text-primary cursor-pointer select-none"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-lg" data-icon={showPassword ? 'visibility_off' : 'visibility'}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <div className="scribble-underline h-1 w-full mt-[-2px]"></div>
                <p className="font-annotation text-[10px] text-on-surface-variant mt-0.5 opacity-70">Must be at least 8 strokes long.</p>
              </div>


              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 mt-4">
                <div className="relative flex items-center h-5">
                  <input
                    className="h-4 w-4 rounded border-2 border-on-background text-primary focus:ring-primary focus:ring-offset-0 bg-transparent checked:bg-primary cursor-pointer"
                    id="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                </div>
                <label className="text-xs font-body-md text-on-surface-variant cursor-pointer select-none leading-tight" htmlFor="terms">
                  I agree to the <a className="font-bold underline decoration-primary decoration-2 underline-offset-2 hover:text-primary" href="#" onClick={(e) => e.preventDefault()}>Creative Terms</a> and recognize that my ideas are mine to keep.
                </label>
              </div>

              {/* CTA Button */}
              <button
                className="w-full py-3 bg-primary-container rough-border font-bold text-headline-sm hover:jiggle active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer mt-4"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg" data-icon="sync">sync</span>
                    <span className="text-sm">Setting up your studio...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm">Join the Crew</span>
                    <span className="material-symbols-outlined text-lg" data-icon="arrow_forward">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Login Link */}
              <p className="text-center font-body-md text-xs text-on-surface-variant mt-3">
                Already have a desk?{' '}
                <Link to="/login" className="font-bold text-primary hover:underline underline-offset-4">
                  Sign in here
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Footer Decorative Footer */}
      <footer className="p-4 flex flex-col items-center gap-2 opacity-40 select-none shrink-0">
        <div className="flex gap-8">
          <span className="material-symbols-outlined text-sm" data-icon="star">star</span>
          <span className="material-symbols-outlined text-sm" data-icon="favorite">favorite</span>
          <span className="material-symbols-outlined text-sm" data-icon="auto_awesome">auto_awesome</span>
        </div>
        <p className="font-annotation text-[10px]">© 2024 WorkBuddy. Built for the messy creative process.</p>
      </footer>
    </div>
  );
};

export default SignUp;
