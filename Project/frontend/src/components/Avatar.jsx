const initials = name => String(name || 'User').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();

const Avatar = ({ name, src, size = 'md', className = '' }) => {
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-10 h-10 text-sm', lg: 'w-24 h-24 text-2xl', xl: 'w-32 h-32 text-3xl' };
  const base = `${sizes[size] || sizes.md} rounded-full border-2 border-on-background overflow-hidden shrink-0 ${className}`;
  if (src) return <img src={src} alt={`${name || 'User'} profile`} className={`${base} object-cover bg-surface-container`} />;
  return <div className={`${base} bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold`} aria-label={`${name || 'User'} has no profile photo`}>{initials(name)}</div>;
};

export default Avatar;
