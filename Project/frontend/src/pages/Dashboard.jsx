import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getProjects, getTasks, getActivities, updateTask } from '../services/api';

const Dashboard = () => {
  const { searchQuery, refreshTrigger, setRefreshTrigger } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projData, taskData, actData] = await Promise.all([
        getProjects(),
        getTasks(),
        getActivities()
      ]);
      setProjects(projData);
      setTasks(taskData);
      setActivities(actData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  // Handle status move
  const handleMoveTask = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Filter tasks by search query
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  // Group tasks for Kanban
  const todoTasks = filteredTasks.filter(t => t.status === 'TO DO');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'IN PROGRESS');
  const doneTasks = filteredTasks.filter(t => t.status === 'DONE');

  // Stats calculation
  const totalProjects = projects.length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'DONE').length;
  const completedTasksCount = tasks.filter(t => t.status === 'DONE').length;
  const productivityScore = tasks.length > 0 
    ? Math.round((completedTasksCount / tasks.length) * 100)
    : 85; // Default fallback score

  // Custom greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning, Creator!';
    if (hour < 17) return 'Happy Afternoon, Creator!';
    return 'Good Evening, Sketcher!';
  };

  // Format activity timestamps
  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}y ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    return 'just now';
  };

  if (loading && projects.length === 0 && tasks.length === 0) {
    return (
      <div className="p-margin flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
        <p className="font-headline-sm mt-4">Loading your creative space...</p>
      </div>
    );
  }

  return (
    <div className="p-margin space-y-margin relative min-h-[calc(100vh-4rem)] pb-24">
      {/* Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-background relative inline-block">
            {getGreeting()}
          </h2>
          <p className="font-body-lg text-on-surface-variant">Here is a snapshot of your workspace today.</p>
        </div>
      </div>

      {/* Random Doodle Decoration */}
      <div className="absolute top-10 right-20 pointer-events-none opacity-10">
        <span className="material-symbols-outlined text-primary text-[120px]" style={{ fontVariationSettings: "'FILL' 0" }}>draw</span>
      </div>

      {/* Overview Sticky Notes */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter relative z-10">
        {/* Stat Card 1 */}
        <div className="bg-primary-container p-6 rough-border rotate-[1deg] doodle-card">
          <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">Total Projects</p>
          <h3 className="font-display-lg text-display-lg mt-2 relative inline-block">
            {totalProjects}
            <div className="absolute -right-6 -top-2">
              <span className="material-symbols-outlined text-on-primary-container">star</span>
            </div>
          </h3>
          <p className="font-annotation text-annotation mt-2 text-on-primary-container">Active & kicking!</p>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-secondary-container p-6 rough-border rotate-[-1.5deg] doodle-card">
          <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">Pending Tasks</p>
          <h3 className="font-display-lg text-display-lg mt-2">{pendingTasksCount}</h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-2 flex-grow bg-on-background/20 rounded-full overflow-hidden border border-on-background">
              <div 
                className="h-full bg-on-background transition-all duration-500" 
                style={{ width: `${tasks.length > 0 ? (completedTasksCount / tasks.length) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="font-annotation text-annotation">
              {tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-tertiary-container p-6 rough-border rotate-[0.5deg] doodle-card">
          <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">Completed</p>
          <h3 className="font-display-lg text-display-lg mt-2 text-on-tertiary-container">{completedTasksCount}</h3>
          <p className="font-annotation text-annotation mt-2 text-on-tertiary-container">Great progress today</p>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-[#FFCC80] p-6 rough-border rotate-[-1deg] doodle-card">
          <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">Productivity Score</p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-display-lg text-display-lg mt-2">{productivityScore}%</h3>
            <span className="material-symbols-outlined text-on-background animate-bounce">trending_up</span>
          </div>
          <p className="font-annotation text-annotation mt-2 scribble-highlight relative z-10">Above average week!</p>
        </div>
      </section>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-margin">
        {/* Kanban Board Column (Span 2) */}
        <section className="lg:col-span-2 space-y-gutter">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline-md text-headline-md">Project Board</h2>
            <div className="flex gap-2 items-center">
              <span className="material-symbols-outlined text-primary">auto_fix_high</span>
              <span className="font-annotation text-annotation">Click columns to move cards</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TO DO Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-dotted border-on-background/30">
                <span className="w-3 h-3 rounded-full bg-on-background"></span>
                <h4 className="font-label-caps text-label-caps">TO DO</h4>
                <span className="font-annotation text-annotation text-on-surface-variant ml-auto">({todoTasks.length})</span>
              </div>
              <div className="space-y-4">
                {todoTasks.map(task => (
                  <div key={task._id} className="bg-white p-4 rough-border doodle-card border-t-4 border-t-primary-container relative group">
                    <div className="flex justify-between items-start">
                      <p className="font-body-md font-bold text-on-surface">{task.title}</p>
                      <button
                        onClick={() => handleMoveTask(task._id, 'IN PROGRESS')}
                        className="p-1 rounded hover:bg-surface-container-high material-symbols-outlined text-sm cursor-pointer ml-1"
                        title="Move to In Progress"
                      >
                        arrow_forward
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <span className="px-2 py-0.5 border border-on-background text-[10px] font-bold rounded-full bg-primary-container">
                        {task.category}
                      </span>
                    </div>
                  </div>
                ))}
                {todoTasks.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-on-background/10 rounded font-annotation text-on-surface-variant opacity-60">
                    No items in Todo
                  </div>
                )}
              </div>
            </div>

            {/* IN PROGRESS Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-dotted border-on-background/30">
                <span className="w-3 h-3 rounded-full bg-secondary"></span>
                <h4 className="font-label-caps text-label-caps">IN PROGRESS</h4>
                <span className="font-annotation text-annotation text-on-surface-variant ml-auto">({inProgressTasks.length})</span>
              </div>
              <div className="space-y-4">
                {inProgressTasks.map(task => (
                  <div key={task._id} className="bg-white p-4 rough-border doodle-card border-t-4 border-t-secondary-container relative group">
                    <div className="flex justify-between items-start">
                      <p className="font-body-md font-bold text-on-surface">{task.title}</p>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleMoveTask(task._id, 'TO DO')}
                          className="p-1 rounded hover:bg-surface-container-high material-symbols-outlined text-sm cursor-pointer"
                          title="Move to Todo"
                        >
                          arrow_back
                        </button>
                        <button
                          onClick={() => handleMoveTask(task._id, 'DONE')}
                          className="p-1 rounded hover:bg-surface-container-high material-symbols-outlined text-sm cursor-pointer"
                          title="Move to Done"
                        >
                          check
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="px-2 py-0.5 border border-on-background text-[10px] font-bold rounded-full bg-secondary-container">
                        {task.category}
                      </span>
                      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden border border-on-background mt-3">
                        <div className="h-full bg-primary-container w-[45%]"></div>
                      </div>
                      <p className="font-annotation text-[10px] mt-1 text-right italic">almost there...</p>
                    </div>
                  </div>
                ))}
                {inProgressTasks.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-on-background/10 rounded font-annotation text-on-surface-variant opacity-60">
                    No items In Progress
                  </div>
                )}
              </div>
            </div>

            {/* DONE Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-dotted border-on-background/30">
                <span className="w-3 h-3 rounded-full bg-tertiary"></span>
                <h4 className="font-label-caps text-label-caps">DONE</h4>
                <span className="font-annotation text-annotation text-on-surface-variant ml-auto">({doneTasks.length})</span>
              </div>
              <div className="space-y-4">
                {doneTasks.map(task => (
                  <div key={task._id} className="bg-white p-4 rough-border doodle-card border-t-4 border-t-tertiary-container opacity-85 relative group">
                    <div className="flex justify-between items-start">
                      <p className="font-body-md font-bold text-on-surface line-through text-on-surface-variant">{task.title}</p>
                      <button
                        onClick={() => handleMoveTask(task._id, 'IN PROGRESS')}
                        className="p-1 rounded hover:bg-surface-container-high material-symbols-outlined text-sm cursor-pointer shrink-0 ml-1"
                        title="Move back to In Progress"
                      >
                        undo
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <span className="px-2 py-0.5 border border-on-background text-[10px] font-bold rounded-full bg-tertiary-container text-on-tertiary-container">
                        {task.category}
                      </span>
                      <span className="material-symbols-outlined text-on-tertiary-container ml-auto">check_circle</span>
                      <span className="font-annotation text-annotation">Verified</span>
                    </div>
                  </div>
                ))}
                {doneTasks.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-on-background/10 rounded font-annotation text-on-surface-variant opacity-60">
                    No completed items
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar Content (Right Column) */}
        <aside className="space-y-gutter relative z-10">
          {/* Upcoming Deadlines */}
          <div className="bg-white p-6 rough-border rotate-[0.5deg]">
            <h3 className="font-headline-sm text-headline-sm mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined">event</span>
              Deadlines
            </h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 border-b border-on-background/10 pb-4">
                <div className="w-12 h-12 bg-error-container border-2 border-on-background flex flex-col items-center justify-center shrink-0">
                  <span className="font-bold text-xs">OCT</span>
                  <span className="font-bold text-lg">24</span>
                </div>
                <div>
                  <p className="font-body-md font-bold">Product Pitch</p>
                  <p className="font-annotation text-annotation text-error font-bold">In 2 days!</p>
                </div>
              </li>
              <li className="flex items-start gap-4 border-b border-on-background/10 pb-4">
                <div className="w-12 h-12 bg-primary-container border-2 border-on-background flex flex-col items-center justify-center shrink-0">
                  <span className="font-bold text-xs">OCT</span>
                  <span className="font-bold text-lg">28</span>
                </div>
                <div>
                  <p className="font-body-md font-bold">Client Review</p>
                  <p className="font-annotation text-annotation">Next week</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-12 h-12 bg-surface-container border-2 border-on-background flex flex-col items-center justify-center shrink-0">
                  <span className="font-bold text-xs">NOV</span>
                  <span className="font-bold text-lg">02</span>
                </div>
                <div>
                  <p className="font-body-md font-bold">Design Handoff</p>
                  <p className="font-annotation text-annotation text-on-surface-variant">Scheduled</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Recent Activity */}
          <div className="bg-surface p-6 rough-border rotate-[-0.5deg]">
            <h3 className="font-headline-sm text-headline-sm mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined">bolt</span>
              Activity
            </h3>
            <div className="space-y-6">
              {activities.length > 0 ? (
                activities.map((act) => (
                  <div key={act._id} className="flex gap-4 relative">
                    <div className="w-8 h-8 rounded-full border-2 border-on-background bg-white z-10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-sm">
                        {act.type === 'add' ? 'add' : act.type === 'comment' ? 'comment' : act.type === 'check' ? 'check' : 'settings'}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <p className="font-body-md text-sm text-on-surface">
                        <span className="font-bold">{act.user}</span> {act.action}{' '}
                        <span className={act.type === 'comment' ? 'italic' : 'underline'}>
                          {act.target}
                        </span>
                      </p>
                      {act.details && (
                        <div className="mt-2 p-2 bg-primary-container/30 border border-on-background text-xs font-annotation rounded">
                          {act.details}
                        </div>
                      )}
                      <p className="font-annotation text-[10px] text-on-surface-variant opacity-60 mt-1">
                        {formatTimeAgo(act.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 font-annotation text-on-surface-variant opacity-60">
                  No activity logged yet
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
