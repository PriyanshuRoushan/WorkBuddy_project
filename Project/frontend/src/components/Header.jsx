import Avatar from './Avatar';
import { Link } from 'react-router-dom';

const Header = ({ searchQuery, setSearchQuery }) => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const userName = user?.displayName || user?.name || "Creator";

  return (
    <header className="w-full h-16 border-b-2 border-on-background bg-surface flex justify-between items-center px-margin shrink-0">
      <div className="flex items-center gap-gutter w-1/2">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent border-b-2 border-on-background focus:ring-0 focus:border-primary font-body-md outline-none border-t-0 border-x-0"
            placeholder="Search sketches, tasks..."
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors hover:jiggle cursor-pointer">notifications</button>
        <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors hover:jiggle cursor-pointer">help_outline</button>
        <Link to="/profile" className="flex items-center gap-3 border-l-2 border-on-background pl-6" title="Open profile">
          <span className="font-bold text-xs text-on-surface-variant font-annotation hidden sm:inline">{userName}</span>
          <Avatar name={userName} src={user?.profileImage} className="shadow-[2px_2px_0px_0px_#1c1b1b]" />
        </Link>
      </div>
    </header>
  );
};

export default Header;
