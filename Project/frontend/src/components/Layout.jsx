import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { createProject, createTask, getTeamMembers } from '../services/api';

const Layout = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal form states
  const [modalType, setModalType] = useState('project'); // 'project' or 'task'
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectStatus, setProjectStatus] = useState('DRAFT');
  const [projectProgress, setProjectProgress] = useState(0);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState([]);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('DESIGN');
  const [taskStatus, setTaskStatus] = useState('TO DO');

  // Trigger page refreshes after data saves
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOpenModal = async () => {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const isPM = user && user.role === 'Project Manager';
    setModalType(isPM ? 'project' : 'task');
    setIsModalOpen(true);

    try {
      const data = await getTeamMembers();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error fetching team members for modal:', error);
    }
  };

  const handleToggleCollaborator = (profileImage) => {
    setSelectedCollaborators(prev => 
      prev.includes(profileImage)
        ? prev.filter(img => img !== profileImage)
        : [...prev, profileImage]
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Reset fields
    setProjectTitle('');
    setProjectDesc('');
    setProjectStatus('DRAFT');
    setProjectProgress(0);
    setSelectedCollaborators([]);
    setTaskTitle('');
    setTaskCategory('DESIGN');
    setTaskStatus('TO DO');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'project') {
        if (!projectTitle.trim() || !projectDesc.trim()) return alert('Please fill in title and description');
        await createProject({
          title: projectTitle,
          description: projectDesc,
          status: projectStatus,
          progress: Number(projectProgress),
          collaborators: selectedCollaborators
        });
      } else {
        if (!taskTitle.trim()) return alert('Please enter a task title');
        await createTask({
          title: taskTitle,
          category: taskCategory,
          status: taskStatus
        });
      }
      setRefreshTrigger(prev => prev + 1);
      handleCloseModal();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Error creating item. Is the backend running?');
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden paper-texture">
      <Sidebar onNewClick={handleOpenModal} />
      
      <div className="flex flex-col flex-grow overflow-hidden">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        
        <main className="flex-grow overflow-y-auto relative">
          <Outlet context={{ searchQuery, refreshTrigger, setRefreshTrigger }} />
        </main>
      </div>

      {/* Neubrutalist / Scribble styled Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-on-background/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-on-background shadow-[8px_8px_0px_0px_rgba(28,27,27,0.15)] max-w-md w-full p-8 relative rotate-[0.5deg]">
            <div className="tape-accent !bg-primary-container/40"></div>
            
            <button 
              onClick={handleCloseModal} 
              className="absolute top-4 right-4 material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              close
            </button>

            <div className="flex gap-4 border-b-2 border-dashed border-on-background/20 pb-4 mb-6">
              {(() => {
                const userString = localStorage.getItem('user');
                const user = userString ? JSON.parse(userString) : null;
                const isPM = user && user.role === 'Project Manager';
                return isPM && (
                  <button
                    type="button"
                    onClick={() => setModalType('project')}
                    className={`font-headline-sm pb-1 ${modalType === 'project' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant opacity-60'}`}
                  >
                    New Project
                  </button>
                );
              })()}
              <button
                type="button"
                onClick={() => setModalType('task')}
                className={`font-headline-sm pb-1 ${modalType === 'task' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant opacity-60'}`}
              >
                New Task
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {modalType === 'project' ? (
                <>
                  <div>
                    <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Project Title</label>
                    <input
                      type="text"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary outline-none"
                      placeholder="e.g. Lunar Coffee Branding"
                    />
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Description</label>
                    <textarea
                      value={projectDesc}
                      onChange={(e) => setProjectDesc(e.target.value)}
                      className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary outline-none h-20"
                      placeholder="Explain the project..."
                    />
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-2">Assign Team Members</label>
                    <div className="max-h-32 overflow-y-auto border-2 border-on-background p-2 rounded space-y-2 bg-surface-container-lowest">
                      {teamMembers.map(member => (
                        <label key={member._id} className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={selectedCollaborators.includes(member.profileImage)}
                            onChange={() => handleToggleCollaborator(member.profileImage)}
                            className="rounded border-2 border-on-background text-primary focus:ring-primary focus:ring-offset-0 bg-transparent checked:bg-primary cursor-pointer w-4 h-4"
                          />
                          <img src={member.profileImage} alt={member.name} className="w-6 h-6 rounded-full border border-on-background object-cover" />
                          <span>{member.name} ({member.role})</span>
                        </label>
                      ))}
                      {teamMembers.length === 0 && (
                        <p className="text-xs text-on-surface-variant italic">No teammates found.</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Status</label>
                      <select
                        value={projectStatus}
                        onChange={(e) => setProjectStatus(e.target.value)}
                        className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary bg-white outline-none"
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="IN PROGRESS">IN PROGRESS</option>
                        <option value="REVIEW">REVIEW</option>
                        <option value="DONE">DONE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Progress (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={projectProgress}
                        onChange={(e) => setProjectProgress(e.target.value)}
                        className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Task Title</label>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary outline-none"
                      placeholder="e.g. API Integration"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Category</label>
                      <select
                        value={taskCategory}
                        onChange={(e) => setTaskCategory(e.target.value)}
                        className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary bg-white outline-none"
                      >
                        <option value="DESIGN">DESIGN</option>
                        <option value="BUG">BUG</option>
                        <option value="API">API</option>
                        <option value="MARKETING">MARKETING</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Status</label>
                      <select
                        value={taskStatus}
                        onChange={(e) => setTaskStatus(e.target.value)}
                        className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary bg-white outline-none"
                      >
                        <option value="TO DO">TO DO</option>
                        <option value="IN PROGRESS">IN PROGRESS</option>
                        <option value="DONE">DONE</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-primary-container border-2 border-on-background rough-border font-bold text-headline-sm hover:jiggle active:scale-95 transition-all cursor-pointer mt-6"
              >
                Create
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
