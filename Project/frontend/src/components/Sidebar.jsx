import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = ({ onNewClick }) => {
  const navigate = useNavigate();
  const navItems = [
    { to: '/', label: 'Dashboard', icon: 'dashboard' },
    { to: '/projects', label: 'Projects', icon: 'folder_open' },
    { to: '/tasks', label: 'Tasks', icon: 'assignment' },
    { to: '/team', label: 'Team', icon: 'group' },
    { to: '/calendar', label: 'Calendar', icon: 'calendar_month' },
    { to: '/settings', label: 'Settings', icon: 'settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside className="h-screen w-64 border-r-2 border-on-background bg-surface flex flex-col p-margin shrink-0">
      <div className="mb-10">
        <h1 className="font-headline-md text-headline-md text-primary font-bold">WorkBuddy</h1>
        <p className="font-annotation text-annotation text-on-surface-variant opacity-70">Creative Workspace</p>
      </div>

      <nav className="space-y-4 flex-grow">
        {navItems.map((item) => {
          if (item.disabled) {
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3 text-on-surface-variant opacity-50 cursor-not-allowed group"
                title="Coming Soon!"
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-body-md">{item.label}</span>
              </div>
            );
          }

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                isActive
                  ? "flex items-center gap-3 p-3 text-primary font-bold border-2 border-on-background bg-primary-container rounded-lg rotate-[-1deg] transition-all shadow-[2px_2px_0px_0px_rgba(28,27,27,0.1)]"
                  : "flex items-center gap-3 p-3 text-on-surface-variant hover:rotate-[1deg] transition-transform hover:bg-surface-container-high group rounded-lg"
              }
            >
              <span className="material-symbols-outlined group-hover:jiggle">{item.icon}</span>
              <span className="font-body-md">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-3 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full py-2 border-2 border-on-background hover:bg-error-container hover:text-on-error-container transition-colors flex items-center justify-center gap-2 cursor-pointer font-annotation text-xs rounded"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span>Log Out</span>
        </button>

        <button
          onClick={onNewClick}
          className="w-full py-4 px-6 bg-primary-container border-2 border-on-background rough-border font-headline-sm text-headline-sm hover:jiggle transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined">add_circle</span>
          New Idea
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
