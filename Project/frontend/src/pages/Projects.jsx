import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { getProjects, updateProject, deleteProject, getTeamMembers } from '../services/api';

const Projects = () => {
  const { searchQuery, refreshTrigger, setRefreshTrigger } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProgressId, setEditingProgressId] = useState(null);
  const [tempProgress, setTempProgress] = useState(0);

  // Manage collaborators modal states
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectCollaborators, setProjectCollaborators] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // Auth role check
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const isPM = user && user.role === 'Project Manager';

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const [projData, teamData] = await Promise.all([
        getProjects(),
        getTeamMembers()
      ]);
      setProjects(projData);
      setTeamMembers(teamData);
    } catch (error) {
      console.error('Error fetching projects or team:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [refreshTrigger]);

  const handleUpdateStatus = async (projectId, currentStatus) => {
    if (!isPM) return;
    const statuses = ['DRAFT', 'IN PROGRESS', 'REVIEW', 'DONE'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];

    try {
      let updatedFields = { status: nextStatus };
      if (nextStatus === 'DONE') updatedFields.progress = 100;
      else if (nextStatus === 'DRAFT') updatedFields.progress = 0;

      await updateProject(projectId, updatedFields);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const handleStartEditProgress = (projectId, progress) => {
    if (!isPM) return;
    setEditingProgressId(projectId);
    setTempProgress(progress);
  };

  const handleSaveProgress = async (projectId) => {
    try {
      let fields = { progress: Number(tempProgress) };
      if (Number(tempProgress) === 100) fields.status = 'DONE';
      else if (Number(tempProgress) === 0) fields.status = 'DRAFT';
      else fields.status = 'IN PROGRESS';

      await updateProject(projectId, fields);
      setEditingProgressId(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating project progress:', error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!isPM) return;
    if (!confirm('Are you sure you want to rip up this sketch? (Delete project)')) return;
    try {
      await deleteProject(projectId);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleManageCollaborators = (project) => {
    setSelectedProject(project);
    setProjectCollaborators(project.collaborators || []);
    setIsManageMembersOpen(true);
  };

  const handleToggleProjectCollaborator = (profileImage) => {
    setProjectCollaborators(prev => 
      prev.includes(profileImage)
        ? prev.filter(img => img !== profileImage)
        : [...prev, profileImage]
    );
  };

  const handleSaveProjectCollaborators = async () => {
    if (!selectedProject) return;
    try {
      await updateProject(selectedProject._id, { collaborators: projectCollaborators });
      setIsManageMembersOpen(false);
      setSelectedProject(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error saving project collaborators:', err);
      alert('Error saving collaborators.');
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    project.description.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case 'DONE':
        return 'bg-tertiary-container text-on-tertiary-container rotate-[2deg]';
      case 'IN PROGRESS':
        return 'bg-primary-container text-on-primary-container rotate-[-1deg]';
      case 'REVIEW':
        return 'bg-secondary-container text-on-secondary-container rotate-[3deg]';
      case 'DRAFT':
      default:
        return 'bg-surface text-outline border-dashed rotate-[0.5deg]';
    }
  };

  const getProgressColorClass = (status) => {
    switch (status) {
      case 'DONE': return 'text-tertiary';
      case 'REVIEW': return 'text-secondary';
      case 'IN PROGRESS': return 'text-primary';
      case 'DRAFT':
      default: return 'text-outline';
    }
  };

  const getCardRotationClass = (index) => {
    const rotations = ['sketchpad-rotation-1', 'sketchpad-rotation-2', 'sketchpad-rotation-3', 'rotate-[0.5deg]'];
    return rotations[index % rotations.length];
  };

  const triggerNewProjectModal = () => {
    if (!isPM) return;
    const buttons = document.querySelectorAll('aside button');
    const sidebarButton = buttons[buttons.length - 1];
    if (sidebarButton) sidebarButton.click();
  };

  if (loading && projects.length === 0) {
    return (
      <div className="p-margin flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
        <p className="font-headline-sm mt-4">Loading your creative pad...</p>
      </div>
    );
  }

  return (
    <div className="p-margin pb-24 select-none">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="font-label-caps text-label-caps text-primary bg-primary-container px-2 py-1 rotate-[-1deg] inline-block mb-2">
            WORKSPACE / PROJECTS
          </span>
          <h2 className="font-display-lg text-display-lg">Creative Pad</h2>
          <p className="font-body-lg text-on-surface-variant max-w-xl">
            Your active sketches, concepts, and ongoing collaborations. Every project starts with a single scribble.
          </p>
        </div>
        {isPM && (
          <button
            onClick={triggerNewProjectModal}
            className="bg-primary-container p-6 shadow-[6px_6px_0px_0px_rgba(28,27,27,0.1)] border-2 border-on-background rotate-[1deg] hover:rotate-0 transition-transform flex items-center gap-2 cursor-pointer font-bold text-headline-sm"
          >
            <span className="material-symbols-outlined">add</span>
            <span>New Project</span>
          </button>
        )}
      </header>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
        {/* New Project Card (Sticky Style) */}
        {isPM && (
          <div 
            onClick={triggerNewProjectModal}
            className="group h-full min-h-[320px] bg-primary-container p-8 flex flex-col justify-center items-center text-center border-2 border-on-background shadow-[8px_8px_0px_0px_rgba(28,27,27,0.1)] rotate-[1deg] hover:rotate-0 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="tape-accent"></div>
            <div className="mb-4">
              <span className="material-symbols-outlined !text-6xl text-on-primary-container">edit_square</span>
            </div>
            <h3 className="font-headline-md text-on-primary-container mb-2">Add New Page</h3>
            <p className="font-body-md text-on-primary-container opacity-80">Got a new idea? Rip a fresh sheet and start doodling.</p>
            <div className="absolute inset-0 border-2 border-dashed border-on-primary-container/20 m-4 pointer-events-none"></div>
          </div>
        )}

        {/* Dynamic Project Cards */}
        {filteredProjects.map((project, index) => (
          <div
            key={project._id}
            className={`bg-surface p-8 flex flex-col border-2 border-on-background shadow-[8px_8px_0px_0px_rgba(28,27,27,0.05)] ${getCardRotationClass(index)} hover:rotate-0 hover:scale-[1.02] transition-all relative group`}
          >
            <div className="tape-accent !bg-secondary-container/20"></div>
            
            {/* Delete button (displays on hover) */}
            {isPM && (!project.creator || project.creator === user?._id || project.creator?._id === user?._id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(project._id);
                }}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer material-symbols-outlined"
                title="Delete Project"
              >
                delete
              </button>
            )}

            {/* Header info */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-3">
                  {project.collaborators && project.collaborators.length > 0 ? (
                    project.collaborators.slice(0, 3).map((col, idx) => (
                      <img
                        key={idx}
                        className="w-10 h-10 rounded-full border-2 border-on-background object-cover bg-white"
                        src={col}
                        alt="Collaborator"
                      />
                    ))
                  ) : (
                    <div className="w-10 h-10 rounded-full border-2 border-on-background bg-surface-container-high flex items-center justify-center font-label-caps text-xs">
                      C
                    </div>
                  )}
                  {project.collaborators && project.collaborators.length > 3 && (
                    <div className="w-10 h-10 rounded-full border-2 border-on-background bg-surface-container-high flex items-center justify-center font-label-caps z-10 text-xs font-bold">
                      +{project.collaborators.length - 3}
                    </div>
                  )}
                </div>
                {isPM && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManageCollaborators(project);
                    }}
                    className="w-8 h-8 rounded-full border-2 border-on-background bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-base hover:scale-110 active:scale-95 transition-transform cursor-pointer ml-1 select-none"
                    title="Manage Collaborators"
                  >
                    +
                  </button>
                )}
              </div>

              {/* Status Badge */}
              {isPM ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateStatus(project._id, project.status);
                  }}
                  className={`${getStatusStyle(project.status)} px-3 py-1 font-label-caps border border-on-background hover:scale-105 active:scale-95 transition-transform cursor-pointer`}
                  title="Click to toggle status"
                >
                  {project.status}
                </button>
              ) : (
                <span
                  className={`${getStatusStyle(project.status)} px-3 py-1 font-label-caps border border-on-background select-none`}
                >
                  {project.status}
                </span>
              )}
            </div>

            {/* Content info */}
            <h3 className="font-headline-sm mb-2 group-hover:text-primary transition-colors pr-6">
              {project.title}
            </h3>
            <p className="font-body-md text-on-surface-variant flex-1 mb-8">
              {project.description}
            </p>

            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex justify-between font-annotation text-annotation">
                <span>Progress</span>
                {editingProgressId === project._id ? (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tempProgress}
                      onChange={(e) => setTempProgress(e.target.value)}
                      className="w-12 text-center border border-on-background text-xs py-0.5"
                    />
                    <button onClick={() => handleSaveProgress(project._id)} className="material-symbols-outlined text-xs hover:text-primary cursor-pointer">check</button>
                    <button onClick={() => setEditingProgressId(null)} className="material-symbols-outlined text-xs hover:text-error cursor-pointer">close</button>
                  </div>
                ) : isPM ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditProgress(project._id, project.progress);
                    }}
                    className="hover:underline cursor-pointer italic"
                    title="Click to edit progress"
                  >
                    {project.progress}% (edit)
                  </button>
                ) : (
                  <span>{project.progress}%</span>
                )}
              </div>
              <div className="h-3 w-full bg-surface-container border border-on-background overflow-hidden relative">
                <div 
                  className={`h-full scribble-progress ${getProgressColorClass(project.status)} transition-all duration-500`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Workspace Button */}
            <div className="mt-6 pt-4 border-t-2 border-dashed border-on-background/10">
              <Link
                to={`/projects/${project._id}/workspace`}
                className="w-full block text-center py-2 bg-secondary-container hover:bg-secondary border-2 border-on-background font-bold text-sm shadow-[3px_3px_0px_0px_rgba(28,27,27,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all cursor-pointer"
              >
                Project Workspace 🚀
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Annotations */}
      <footer className="mt-20 py-12 border-t-2 border-dashed border-outline-variant flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary rotate-[-12deg]">draw</span>
          <p className="font-annotation text-annotation text-on-surface-variant italic">"Everything you can imagine is real." — P. Picasso</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1 font-label-caps text-on-surface-variant">
            <span className="w-3 h-3 rounded-full bg-primary-container border border-on-background"></span>
            Active / In Progress
          </div>
          <div className="flex items-center gap-1 font-label-caps text-on-surface-variant">
            <span className="w-3 h-3 rounded-full bg-secondary-container border border-on-background"></span>
            Review
          </div>
          <div className="flex items-center gap-1 font-label-caps text-on-surface-variant">
            <span className="w-3 h-3 rounded-full bg-tertiary-container border border-on-background"></span>
            Done
          </div>
        </div>
      </footer>

      {/* Manage Collaborators Modal */}
      {isManageMembersOpen && selectedProject && (
        <div className="fixed inset-0 bg-on-background/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-on-background shadow-[8px_8px_0px_0px_rgba(28,27,27,0.15)] max-w-md w-full p-8 relative rotate-[0.5deg]">
            <div className="tape-accent !bg-primary-container/40"></div>
            
            <button 
              onClick={() => {
                setIsManageMembersOpen(false);
                setSelectedProject(null);
              }} 
              className="absolute top-4 right-4 material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer select-none"
            >
              close
            </button>

            <h3 className="font-headline-sm text-headline-sm mb-6 border-b-2 border-dashed border-on-background/20 pb-4">
              Manage Collaborators
            </h3>
            
            <p className="text-xs font-annotation text-on-surface-variant mb-4">
              Project: <span className="font-bold text-on-surface">{selectedProject.title}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-2">Assign Team Members</label>
                <div className="max-h-60 overflow-y-auto border-2 border-on-background p-3 rounded space-y-3 bg-surface-container-lowest">
                  {teamMembers.map(member => (
                    <label key={member._id} className="flex items-center gap-3 text-sm font-bold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={projectCollaborators.includes(member.profileImage)}
                        onChange={() => handleToggleProjectCollaborator(member.profileImage)}
                        className="rounded border-2 border-on-background text-primary focus:ring-primary focus:ring-offset-0 bg-transparent checked:bg-primary cursor-pointer w-4 h-4"
                      />
                      <img src={member.profileImage} alt={member.name} className="w-8 h-8 rounded-full border border-on-background object-cover bg-white" />
                      <div>
                        <p className="leading-none">{member.name}</p>
                        <p className="text-[10px] text-on-surface-variant leading-none mt-1 font-annotation">{member.role}</p>
                      </div>
                    </label>
                  ))}
                  {teamMembers.length === 0 && (
                    <p className="text-xs text-on-surface-variant italic">No teammates found.</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSaveProjectCollaborators}
                className="w-full py-3 bg-primary-container border-2 border-on-background rough-border font-bold text-headline-sm hover:jiggle active:scale-95 transition-all cursor-pointer mt-6 select-none"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
