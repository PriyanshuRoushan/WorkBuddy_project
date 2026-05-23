import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getEvents, createEvent, deleteEvent } from '../services/api';

const Calendar = () => {
  const { refreshTrigger, setRefreshTrigger } = useOutletContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // Form states
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('2024-10-08');
  const [eventColor, setEventColor] = useState('primary-container');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [refreshTrigger]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle.trim()) return alert('Please enter an event title');
    try {
      await createEvent({
        title: eventTitle,
        description: eventDesc,
        date: new Date(eventDate),
        color: eventColor
      });
      setIsAddEventOpen(false);
      setEventTitle('');
      setEventDesc('');
      setEventDate('2024-10-08');
      setEventColor('primary-container');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleDeleteEvent = async (eventId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(eventId);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Setup October 2024 calendar grid days (Oct 2024 starts on a Tuesday)
  // September 2024 has 30 days. Oct has 31.
  // Sun offset: Sept 29, Sept 30.
  const daysOffset = [
    { day: 29, currentMonth: false },
    { day: 30, currentMonth: false }
  ];

  const octoberDays = Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    currentMonth: true
  }));

  const allGridDays = [...daysOffset, ...octoberDays];

  // Helper to check if event date matches specific calendar day (October 2024)
  const getEventsForDay = (dayNum, isCurrentMonth) => {
    if (!isCurrentMonth) return [];
    return events.filter(event => {
      const eDate = new Date(event.date);
      // Validate Oct 2024 matches
      return eDate.getDate() === dayNum && eDate.getMonth() === 9 && eDate.getFullYear() === 2024;
    });
  };

  // Filter events for October/November 2024 to render in the upcoming list
  const upcomingEvents = events.filter(event => {
    const eDate = new Date(event.date);
    return eDate.getFullYear() === 2024 && (eDate.getMonth() === 9 || eDate.getMonth() === 10);
  });

  const getColorClass = (color) => {
    switch (color) {
      case 'secondary-container': return 'bg-[#7bc2fd] text-[#004f7a]';
      case 'tertiary-container': return 'bg-[#b2eaa8] text-[#3a6b36]';
      case 'error-container': return 'bg-error-container text-on-error-container';
      case 'primary-container':
      default: return 'bg-primary-container text-on-primary-container';
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="p-margin flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
        <p className="font-headline-sm mt-4">Loading your creative calendar...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden p-margin gap-margin h-[calc(100vh-4rem)] pb-24">
      {/* Calendar Grid Section */}
      <section className="flex-1 flex flex-col bg-white border-2 border-on-background rough-border overflow-hidden">
        <div className="p-6 border-b-2 border-on-background flex justify-between items-center bg-surface-container-lowest shrink-0">
          <div>
            <h2 className="font-headline-sm text-headline-sm scribble-highlight relative z-10">October 2024</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex border-2 border-on-background rounded-lg overflow-hidden bg-white select-none">
              <button className="p-2 hover:bg-surface-container border-r-2 border-on-background material-symbols-outlined cursor-pointer select-none">chevron_left</button>
              <button className="px-4 py-2 font-bold hover:bg-surface-container text-sm cursor-pointer select-none">Today</button>
              <button className="p-2 hover:bg-surface-container border-l-2 border-on-background material-symbols-outlined cursor-pointer select-none">chevron_right</button>
            </div>
            <button
              onClick={() => setIsAddEventOpen(true)}
              className="px-6 py-2 bg-primary-container border-2 border-on-background font-bold text-sm hover-jiggle cursor-pointer"
            >
              Add a doodle...
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="calendar-grid border-b-2 border-on-background bg-surface-container-low shrink-0 select-none font-bold text-on-surface">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="py-2 text-center font-label-caps border-r-2 border-on-background last:border-r-0 text-[12px] tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid container */}
        <div className="calendar-grid flex-grow overflow-y-auto min-h-0 bg-surface-container-low/20 divide-y divide-on-background/10">
          {allGridDays.map((gridDay, index) => {
            const dayEvents = getEventsForDay(gridDay.day, gridDay.currentMonth);
            const isLastInRow = (index + 1) % 7 === 0;

            const isDay8 = gridDay.day === 8 && gridDay.currentMonth;

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-b-2 border-on-background relative group ${!isLastInRow ? 'border-r-2 border-on-background' : ''} ${!gridDay.currentMonth ? 'bg-surface-variant/20 text-on-surface-variant/40 select-none' : 'bg-white hover:bg-surface-container-lowest transition-colors'} ${isDay8 ? 'bg-[#ffd93d]/10' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`font-bold text-[14px] ${isDay8 ? 'scribble-highlight px-1 relative z-10' : ''}`}>
                    {gridDay.day}
                  </span>
                </div>
                
                {/* Render events for this day */}
                <div className="space-y-2 mt-2">
                  {dayEvents.map(event => (
                    <div
                      key={event._id}
                      className={`sticky-note p-2 border-2 border-on-background text-[11px] font-bold shadow-[2px_2px_0px_0px_rgba(28,27,27,1)] cursor-pointer group/note relative rotate-[-1deg] ${getColorClass(event.color)}`}
                    >
                      <button
                        onClick={(e) => handleDeleteEvent(event._id, e)}
                        className="absolute -top-1 -right-1 bg-white border border-on-background rounded-full w-4 h-4 flex items-center justify-center text-[10px] text-error hover:bg-error-container opacity-0 group-hover/note:opacity-100 transition-opacity cursor-pointer z-10"
                        title="Delete Event"
                      >
                        ×
                      </button>
                      <div className="truncate pr-1">{event.title}</div>
                    </div>
                  ))}
                </div>

                {/* Day 8 star indicator below the event */}
                {isDay8 && dayEvents.some(e => e.title.includes('Call') || e.title.includes('Sparkle')) && (
                  <div className="mt-2 pl-1 select-none">
                    <span className="material-symbols-outlined text-[16px] text-error font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Upcoming events sidebar */}
      <aside className="w-80 flex flex-col gap-6 shrink-0 h-full overflow-hidden select-none">
        <div className="bg-white border-2 border-on-background rough-border p-6 flex-grow flex flex-col overflow-hidden">
          <h3 className="font-headline-sm text-headline-sm mb-6 scribble-highlight inline-block relative z-10 self-start">
            Upcoming Doodles
          </h3>
          
          <div className="space-y-6 overflow-y-auto pr-2 flex-grow min-h-0">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, idx) => (
                <div
                  key={event._id}
                  className={`sticky-note border-2 border-on-background p-5 shadow-[6px_6px_0px_0px_rgba(28,27,27,1)] transition-transform hover:rotate-0 duration-200 ${idx % 2 === 0 ? 'rotate-[-1deg]' : 'rotate-[1.5deg]'} ${getColorClass(event.color)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-label-caps text-xs bg-white/40 px-2 py-0.5 rounded">
                      {event.date ? new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: '2-digit' }).toUpperCase() : ''}
                    </span>
                    <span className="material-symbols-outlined text-sm font-bold">
                      {event.title.includes('Audit') ? 'alarm' : event.title.includes('Reflection') ? 'celebration' : 'push_pin'}
                    </span>
                  </div>
                  <h4 className="font-bold text-base mb-1 leading-tight">{event.title}</h4>
                  {event.description && <p className="text-xs opacity-80 mb-3">{event.description}</p>}
                  
                  {/* Overlap avatars for Global Branding Workshop */}
                  {event.title.includes('Workshop') && (
                    <div className="flex -space-x-2 mt-3 select-none">
                      <div className="w-8 h-8 rounded-full border-2 border-on-background bg-[#92ccff] shrink-0"></div>
                      <div className="w-8 h-8 rounded-full border-2 border-on-background bg-[#9ed494] shrink-0"></div>
                      <div className="w-8 h-8 rounded-full border-2 border-on-background bg-[#ffdad6] shrink-0"></div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 font-annotation text-on-surface-variant opacity-60">
                No upcoming events this month.
              </div>
            )}
          </div>

          {/* Dotted divider and quote */}
          <div className="mt-auto pt-6 border-t-2 border-on-background border-dashed shrink-0 flex items-start gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">edit_note</span>
            <p className="text-xs font-annotation text-on-surface-variant italic leading-normal">
              "Creativity is intelligence having fun."
            </p>
          </div>
        </div>

        {/* Import Inspiration CTA (Cream color matching settings/rough border) */}
        <div 
          onClick={() => setIsAddEventOpen(true)}
          className="bg-surface border-2 border-on-background border-dashed p-6 flex flex-col items-center justify-center hover:bg-surface-container transition-colors cursor-pointer group shrink-0 relative"
        >
          <span className="material-symbols-outlined text-3xl text-primary mb-2 group-hover:scale-110 transition-transform">add_a_photo</span>
          <p className="font-bold text-primary text-sm tracking-wide">Import Inspiration</p>
        </div>
      </aside>

      {/* Add Event Modal Dialog */}
      {isAddEventOpen && (
        <div className="fixed inset-0 bg-on-background/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-on-background shadow-[8px_8px_0px_0px_rgba(28,27,27,0.15)] max-w-md w-full p-8 relative rotate-[0.5deg]">
            <div className="tape-accent !bg-[#ffd93d]/40"></div>
            
            <button 
              onClick={() => setIsAddEventOpen(false)} 
              className="absolute top-4 right-4 material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              close
            </button>

            <h3 className="font-headline-sm text-headline-sm mb-6 border-b-2 border-dashed border-on-background/20 pb-4">
              Add Creative Event
            </h3>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Event Title</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary outline-none"
                  placeholder="e.g. Sketching Workshop 🎨"
                  required
                />
              </div>

              <div>
                <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Description</label>
                <textarea
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary outline-none h-20"
                  placeholder="What is this event about?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Color Sticker</label>
                  <select
                    value={eventColor}
                    onChange={(e) => setEventColor(e.target.value)}
                    className="w-full p-2 border-2 border-on-background rounded focus:ring-0 focus:border-primary bg-white outline-none"
                  >
                    <option value="primary-container">Yellow (Primary)</option>
                    <option value="secondary-container">Blue (Secondary)</option>
                    <option value="tertiary-container">Green (Tertiary)</option>
                    <option value="error-container">Red (Error)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary-container border-2 border-on-background rough-border font-bold text-headline-sm hover:jiggle active:scale-95 transition-all cursor-pointer mt-6"
              >
                Stick to Calendar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
