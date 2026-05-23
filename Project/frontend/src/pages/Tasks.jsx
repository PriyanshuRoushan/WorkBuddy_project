import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getTasks, updateTask, deleteTask } from '../services/api';

const Tasks = () => {
  const { searchQuery, refreshTrigger, setRefreshTrigger } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  const handleToggleComplete = async (task) => {
    try {
      const newStatus = task.status === 'DONE' ? 'TO DO' : 'DONE';
      await updateTask(task._id, { status: newStatus });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to scratch out this task?')) return;
    try {
      await deleteTask(taskId);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Filter logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || task.status === filterStatus;
    const matchesCategory = filterCategory === 'ALL' || task.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'DESIGN': return 'bg-primary-container text-on-primary-container';
      case 'BUG': return 'bg-error-container text-on-error-container';
      case 'API': return 'bg-secondary-container text-on-secondary-container';
      default: return 'bg-tertiary-container text-on-tertiary-container';
    }
  };

  const triggerNewTaskModal = () => {
    const sidebarButton = document.querySelector('aside button');
    if (sidebarButton) sidebarButton.click();
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="p-margin flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
        <p className="font-headline-sm mt-4">Loading your task pad...</p>
      </div>
    );
  }

  return (
    <div className="p-margin pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="font-label-caps text-label-caps text-secondary bg-secondary-container px-2 py-1 rotate-[1deg] inline-block mb-2">
            WORKSPACE / TASKS
          </span>
          <h2 className="font-display-lg text-display-lg">Task Pad</h2>
          <p className="font-body-lg text-on-surface-variant max-w-xl">
            Scribble down your todo checklist, squash bugs, and keep track of your sprint items.
          </p>
        </div>
        <button
          onClick={triggerNewTaskModal}
          className="bg-primary-container p-6 shadow-[6px_6px_0px_0px_rgba(28,27,27,0.1)] border-2 border-on-background rotate-[-1deg] hover:rotate-0 transition-transform flex items-center gap-2 cursor-pointer font-bold text-headline-sm"
        >
          <span className="material-symbols-outlined">add</span>
          <span>New Task</span>
        </button>
      </header>

      {/* Filter and Sort Controls */}
      <div className="bg-surface p-6 rough-border mb-8 flex flex-col md:flex-row gap-4 justify-between items-center rotate-[-0.5deg]">
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">filter_alt</span> Filter By:
          </span>
          
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 border-2 border-on-background rounded bg-white text-sm outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="TO DO">TO DO</option>
            <option value="IN PROGRESS">IN PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 border-2 border-on-background rounded bg-white text-sm outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="DESIGN">DESIGN</option>
            <option value="BUG">BUG</option>
            <option value="API">API</option>
            <option value="MARKETING">MARKETING</option>
          </select>
        </div>

        <div className="font-annotation text-annotation text-on-surface-variant opacity-70">
          Showing {filteredTasks.length} task{filteredTasks.length !== 1 && 's'}
        </div>
      </div>

      {/* Tasks ruled-paper wrapper */}
      <div className="bg-white border-2 border-on-background shadow-[6px_6px_0px_0px_rgba(28,27,27,0.08)] rounded rotate-[0.5deg] overflow-hidden">
        {filteredTasks.length > 0 ? (
          <div className="divide-y-2 divide-dotted divide-on-background/10">
            {filteredTasks.map((task) => (
              <div
                key={task._id}
                className={`p-6 flex items-center justify-between gap-4 transition-all hover:bg-surface-container-low group ${task.status === 'DONE' ? 'bg-surface-container-low/30' : ''}`}
              >
                <div className="flex items-center gap-4 flex-grow min-w-0">
                  {/* Neomorphic Scribble Checkbox */}
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className="w-7 h-7 rounded border-2 border-on-background flex items-center justify-center shrink-0 cursor-pointer hover:bg-primary-container/20 transition-all"
                  >
                    {task.status === 'DONE' && (
                      <span className="material-symbols-outlined text-primary font-bold text-lg select-none">
                        check
                      </span>
                    )}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`font-body-md font-bold text-on-surface text-base break-words ${task.status === 'DONE' ? 'line-through text-on-surface-variant opacity-60' : ''}`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2 py-0.5 border border-on-background text-[10px] font-bold rounded-full ${getCategoryBadgeClass(task.category)}`}>
                        {task.category}
                      </span>
                      <span className="font-annotation text-xs text-on-surface-variant opacity-60">
                        Status:
                      </span>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        className="bg-transparent border-b border-on-background/30 text-xs py-0.5 focus:ring-0 focus:border-primary outline-none cursor-pointer"
                      >
                        <option value="TO DO">TO DO</option>
                        <option value="IN PROGRESS">IN PROGRESS</option>
                        <option value="DONE">DONE</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center shrink-0">
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="p-2 text-on-surface-variant hover:text-error rounded hover:bg-surface-container-high transition-all opacity-0 group-hover:opacity-100 cursor-pointer material-symbols-outlined"
                    title="Delete Task"
                  >
                    delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-30 mb-4 animate-pulse">
              edit_note
            </span>
            <p className="font-headline-sm text-on-surface-variant">No tasks found!</p>
            <p className="font-annotation text-annotation text-on-surface-variant opacity-60 mt-1">
              Add a new task using the button above to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
