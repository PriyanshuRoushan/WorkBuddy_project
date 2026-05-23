import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getTeamMembers, inviteTeamMember, getStickyNotes, createStickyNote, deleteStickyNote } from '../services/api';

const Team = () => {
  const { refreshTrigger, setRefreshTrigger } = useOutletContext();
  const [members, setMembers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth role check
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const isPM = user && user.role === 'Project Manager';

  // Modals visibility
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  // Form states - Member
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [memberEmail, setMemberEmail] = useState('');

  // Form states - Sticky Note
  const [noteContent, setNoteContent] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('');
  const [noteColor, setNoteColor] = useState('primary-container');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersData, notesData] = await Promise.all([
        getTeamMembers(),
        getStickyNotes()
      ]);
      setMembers(membersData);
      setNotes(notesData);
    } catch (error) {
      console.error('Error fetching team page data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!memberName.trim() || !memberRole.trim() || !memberEmail.trim()) {
      return alert('Please fill in all fields');
    }
    try {
      await inviteTeamMember({
        name: memberName,
        role: memberRole,
        email: memberEmail
      });
      setIsInviteOpen(false);
      setMemberName('');
      setMemberRole('');
      setMemberEmail('');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error inviting member:', error);
      alert(error.response?.data?.message || 'Error inviting member.');
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim() || !noteAuthor.trim()) {
      return alert('Please fill in note content and author');
    }
    try {
      await createStickyNote({
        content: noteContent,
        author: noteAuthor,
        color: noteColor
      });
      setIsNoteOpen(false);
      setNoteContent('');
      setNoteAuthor('');
      setNoteColor('primary-container');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error creating sticky note:', error);
    }
  };

  const handleDeleteNote = async (noteId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to rip down this note?')) return;
    try {
      await deleteStickyNote(noteId);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting sticky note:', error);
    }
  };

  const getColorClass = (color) => {
    switch (color) {
      case 'secondary-container': return 'bg-secondary-container text-on-secondary-container';
      case 'tertiary-container': return 'bg-tertiary-container text-on-tertiary-container';
      case 'error-container': return 'bg-error-container text-on-error-container';
      case 'primary-container':
      default: return 'bg-primary-container text-on-primary-container';
    }
  };

  // Card jiggle rotation class assignment
  const getNoteRotationClass = (index) => {
    const rotations = ['rotate-[-1deg]', 'rotate-[1.5deg]', 'rotate-[2.5deg]', 'rotate-[-2deg]'];
    return rotations[index % rotations.length];
  };

  if (loading && members.length === 0 && notes.length === 0) {
    return (
      <div className="p-margin flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
        <p className="font-headline-sm mt-4">Loading team workspace...</p>
      </div>
    );
  }

  return (
    <div className="p-margin pb-24 relative select-none">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-background relative inline-block">
            Our Creative Crew
            <span className="absolute -bottom-2 left-0 w-full h-2 bg-primary-container -z-10 opacity-60"></span>
          </h2>
          <p className="font-body-lg text-on-surface-variant mt-2 max-w-xl">
            The dreamers, designers, and developers making magic happen one doodle at a time.
          </p>
        </div>
        {isPM && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="rough-border bg-primary-container px-8 py-3 font-bold text-lg flex items-center gap-2 hover-jiggle cursor-pointer"
          >
            <span className="material-symbols-outlined">person_add</span>
            <span>Invite Doodle</span>
          </button>
        )}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Teammates section (Main column 8 spans) */}
        <div className="col-span-12 lg:col-span-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {members.map((member) => (
              <div key={member._id} className="rough-border bg-surface p-6 flex items-start gap-6 hover:scale-[1.02] transition-transform group">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-full border-2 border-on-background overflow-hidden bg-secondary-container">
                    <img alt={member.name} className="w-full h-full object-cover" src={member.profileImage} />
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border-2 border-on-background flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: `'FILL' 1` }}>
                      {member.themePreference === 'light' ? 'light_mode' : 'dark_mode'}
                    </span>
                  </div>
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-headline-sm text-headline-sm truncate">{member.name}</h3>
                  <p className="font-annotation text-secondary font-bold uppercase tracking-wider mb-4 truncate text-xs">
                    {member.role}
                  </p>
                  <div className="flex gap-3">
                    <a
                      href={`mailto:${member.email}`}
                      className="w-10 h-10 border-2 border-on-background flex items-center justify-center hover:bg-primary-container transition-colors cursor-pointer"
                      title={member.email}
                    >
                      <span className="material-symbols-outlined">mail</span>
                    </a>
                    <button className="w-10 h-10 border-2 border-on-background flex items-center justify-center hover:bg-primary-container transition-colors cursor-pointer">
                      <span className="material-symbols-outlined">chat_bubble</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Roles & Access Control matrix */}
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
              <h3 className="font-headline-sm text-headline-sm">Roles &amp; Access Control</h3>
            </div>
            <div className="rough-border bg-surface-container-lowest overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead className="border-b-2 border-on-background bg-surface-container">
                  <tr>
                    <th className="p-4 font-label-caps uppercase text-xs">Role Name</th>
                    <th className="p-4 font-label-caps uppercase text-xs">Members</th>
                    <th className="p-4 font-label-caps uppercase text-xs">Permissions</th>
                    <th className="p-4 font-label-caps uppercase text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-on-background/10 hover:bg-surface-container-low transition-colors">
                    <td className="p-4 font-bold text-sm">Admin</td>
                    <td className="p-4 text-sm">2 Members</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-primary-container text-[10px] font-bold rounded uppercase">Full Access</span>
                    </td>
                    <td className="p-4">
                      <button className="material-symbols-outlined text-on-surface-variant hover:text-on-background cursor-pointer">more_horiz</button>
                    </td>
                  </tr>
                  <tr className="border-b border-on-background/10 hover:bg-surface-container-low transition-colors">
                    <td className="p-4 font-bold text-sm">Designer</td>
                    <td className="p-4 text-sm">8 Members</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-secondary-container text-[10px] font-bold rounded uppercase">Edit Content</span>
                    </td>
                    <td className="p-4">
                      <button className="material-symbols-outlined text-on-surface-variant hover:text-on-background cursor-pointer">more_horiz</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="p-4 font-bold text-sm">Observer</td>
                    <td className="p-4 text-sm">4 Members</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-tertiary-container text-[10px] font-bold rounded uppercase">View Only</span>
                    </td>
                    <td className="p-4">
                      <button className="material-symbols-outlined text-on-surface-variant hover:text-on-background cursor-pointer">more_horiz</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar widgets (4 spans) */}
        <aside className="col-span-12 lg:col-span-4 space-y-gutter">
          {/* Stats / Pulse check */}
          <div className="rough-border bg-secondary-container p-6 relative overflow-hidden">
            <div className="tape-accent"></div>
            <h4 className="font-label-caps uppercase tracking-widest text-on-secondary-container mb-4 text-xs">Pulse Check</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="font-display-lg text-display-lg">{members.length}</span>
              <span className="material-symbols-outlined text-4xl opacity-40">bolt</span>
            </div>
            <p className="font-body-md text-on-secondary-container/80 mb-6 text-sm">Total active teammates collaborating right now.</p>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span>Design Velocity</span>
                <span>88%</span>
              </div>
              <div className="h-4 bg-white/30 rounded-full overflow-hidden border border-on-background/10">
                <div className="h-full bg-white w-[88%] scribble-progress"></div>
              </div>
            </div>
          </div>

          {/* Team wall note board */}
          <div className="rough-border bg-surface p-6 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <h4 className="font-headline-sm text-headline-sm">Team Wall</h4>
              <button
                onClick={() => setIsNoteOpen(true)}
                className="material-symbols-outlined text-primary hover:scale-110 transition-transform cursor-pointer"
              >
                add_circle
              </button>
            </div>
            
            {/* Notes list */}
            <div className="flex flex-wrap gap-4 relative overflow-y-auto flex-grow pr-1 max-h-[350px]">
              {notes.map((note, idx) => (
                <div
                  key={note._id}
                  className={`sticky-note p-4 w-40 h-40 rough-border flex flex-col shadow-sm transition-transform duration-200 relative group ${getNoteRotationClass(idx)} ${getColorClass(note.color)}`}
                >
                  <button
                    onClick={(e) => handleDeleteNote(note._id, e)}
                    className="absolute top-2 right-2 bg-white border border-on-background rounded-full w-4 h-4 flex items-center justify-center text-[10px] text-error hover:bg-error-container opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                    title="Remove Note"
                  >
                    ×
                  </button>

                  <div className="flex justify-between items-start mb-2">
                    <span className="material-symbols-outlined text-sm">push_pin</span>
                    <span className="font-label-caps text-[9px]">
                      {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="font-annotation text-sm leading-tight flex-grow overflow-y-auto break-words pr-1 scrollbar-thin">
                    {note.content}
                  </p>
                  <span className="font-label-caps text-[9px] text-right mt-1 font-bold">@{note.author}</span>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="text-center py-12 font-annotation text-on-surface-variant opacity-60 w-full">
                  Post the first sticky note!
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Cheers birthdays widget */}
          <div className="p-6 bg-surface-container-high rough-border border-dashed">
            <h4 className="font-label-caps uppercase mb-4 flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-primary">cake</span>
              Upcoming Cheers
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-on-background bg-white flex items-center justify-center font-bold text-xs">MA</div>
                <div className="flex-grow">
                  <p className="text-sm font-bold leading-tight">Marcus A.</p>
                  <p className="text-[10px] uppercase text-on-surface-variant">Tomorrow</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-on-background bg-white flex items-center justify-center font-bold text-xs">JS</div>
                <div className="flex-grow">
                  <p className="text-sm font-bold leading-tight">Jenny Sia</p>
                  <p className="text-[10px] uppercase text-on-surface-variant">August 24</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-on-background/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-on-background shadow-[8px_8px_0px_0px_rgba(28,27,27,0.15)] max-w-md w-full p-8 relative rotate-[-0.5deg]">
            <div className="tape-accent !bg-[#7bc2fd]/40"></div>
            
            <button 
              onClick={() => setIsInviteOpen(false)} 
              className="absolute top-4 right-4 material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              close
            </button>

            <h3 className="font-headline-sm text-headline-sm mb-6 border-b-2 border-dashed border-on-background/20 pb-4">
              Invite Teammate
            </h3>

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Teammate Name</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary outline-none"
                  placeholder="e.g. Jenny Sia"
                  required
                />
              </div>

              <div>
                <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Role Title</label>
                <input
                  type="text"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary outline-none"
                  placeholder="e.g. UX Researcher"
                  required
                />
              </div>

              <div>
                <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Email Address</label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary outline-none"
                  placeholder="e.g. jenny@workbuddy.com"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary-container border-2 border-on-background rough-border font-bold text-headline-sm hover:jiggle active:scale-95 transition-all cursor-pointer mt-6"
              >
                Send Invitation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sticky Note Wall Modal */}
      {isNoteOpen && (
        <div className="fixed inset-0 bg-on-background/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-on-background shadow-[8px_8px_0px_0px_rgba(28,27,27,0.15)] max-w-md w-full p-8 relative rotate-[0.5deg]">
            <div className="tape-accent !bg-[#b9f1ae]/40"></div>
            
            <button 
              onClick={() => setIsNoteOpen(false)} 
              className="absolute top-4 right-4 material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              close
            </button>

            <h3 className="font-headline-sm text-headline-sm mb-6 border-b-2 border-dashed border-on-background/20 pb-4">
              Post to Team Wall
            </h3>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Your Tag (Author)</label>
                <input
                  type="text"
                  value={noteAuthor}
                  onChange={(e) => setNoteAuthor(e.target.value)}
                  className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary outline-none"
                  placeholder="e.g. jenny_s"
                  required
                />
              </div>

              <div>
                <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Message Content</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary outline-none h-24"
                  placeholder="Write something cool..."
                  maxLength="80"
                  required
                />
              </div>

              <div>
                <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Sticky Color</label>
                <select
                  value={noteColor}
                  onChange={(e) => setNoteColor(e.target.value)}
                  className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary bg-white outline-none"
                >
                  <option value="primary-container">Yellow</option>
                  <option value="secondary-container">Blue</option>
                  <option value="tertiary-container">Green</option>
                  <option value="error-container">Red</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary-container border-2 border-on-background rough-border font-bold text-headline-sm hover:jiggle active:scale-95 transition-all cursor-pointer mt-6"
              >
                Pin to Wall
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
