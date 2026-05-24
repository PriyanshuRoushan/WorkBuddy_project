import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  getProject, 
  getProjectMessages, 
  getProjectNotes, 
  uploadFile, 
  getTeamMembers 
} from '../services/api';

const ProjectWorkspace = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  // Auth User
  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;
  const token = localStorage.getItem('token');

  // Refs
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatInputRef = useRef(null);

  // States
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [allTeammates, setAllTeammates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chat Interface States
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState({}); // { userId: userName }
  const [onlineMembers, setOnlineMembers] = useState(new Set());
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [fileUploading, setFileUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Whiteboard States
  const [activeColor, setActiveColor] = useState('primary-container'); // default yellow

  // Play a self-contained beep sound when @mentioned or new message arrives
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5

      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.35);
    } catch (err) {
      console.error('AudioContext sound playback error:', err);
    }
  };

  // Initialize and load project data
  useEffect(() => {
    if (!currentUser || !token) {
      navigate('/login');
      return;
    }

    const loadWorkspaceData = async () => {
      try {
        setLoading(true);
        setError('');

        // 1. Fetch project details
        const projectData = await getProject(projectId);
        setProject(projectData);

        // 2. Fetch team members to resolve usernames
        const teamData = await getTeamMembers();
        setAllTeammates(teamData);

        // 3. Fetch historical messages
        const resData = await getProjectMessages(projectId);
        setMessages(resData.messages || []);

        // 4. Fetch whiteboard notes
        const boardNotes = await getProjectNotes(projectId);
        setNotes(boardNotes);

        // 5. Establish Socket.IO Connection
        socketRef.current = io('http://localhost:3001');

        // On socket connect, join project room
        socketRef.current.emit('join-project-room', {
          projectId,
          userId: currentUser._id, // using database user _id
          userName: currentUser.name,
          userEmail: currentUser.email
        });

        // Socket Event Listeners
        socketRef.current.on('receive-message', (newMessage) => {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m._id === newMessage._id)) return prev;
            return [...prev, newMessage];
          });

           // Send read receipt if we are in this room
          socketRef.current.emit('message-read', {
            projectId,
            messageId: newMessage._id,
            userId: currentUser._id
          });

          // Sound alert if mentioned
          if (newMessage.content.includes(`@${currentUser.name}`)) {
            playNotificationSound();
          }
        });

        socketRef.current.on('message-read', ({ messageId, userId }) => {
          setMessages(prev => prev.map(m => {
            if (m._id === messageId) {
              return { ...m, readBy: [...new Set([...(m.readBy || []), userId])] };
            }
            return m;
          }));
        });

        socketRef.current.on('message-reaction-updated', ({ messageId, reactions }) => {
          setMessages(prev => prev.map(m => {
            if (m._id === messageId) {
              return { ...m, reactions };
            }
            return m;
          }));
        });

        // Typing Indicators
        socketRef.current.on('typing-start', ({ userId, userName }) => {
          setTypingUsers(prev => ({ ...prev, [userId]: userName }));
        });

        socketRef.current.on('typing-stop', ({ userId }) => {
          setTypingUsers(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        });

        // Status Indicators
        socketRef.current.on('user-status', ({ userId, status }) => {
          setOnlineMembers(prev => {
            const next = new Set(prev);
            if (status === 'online') {
              next.add(userId);
            } else {
              next.delete(userId);
            }
            return next;
          });
        });

        // Whiteboard Note Sync
        socketRef.current.on('receive-create-note', (newNote) => {
          setNotes(prev => {
            if (prev.some(n => n.noteId === newNote.noteId)) return prev;
            return [...prev, newNote];
          });
        });

        socketRef.current.on('receive-move-note', ({ noteId, positionX, positionY }) => {
          setNotes(prev => prev.map(n => n.noteId === noteId ? { ...n, positionX, positionY } : n));
        });

        socketRef.current.on('receive-update-note', ({ noteId, content, color, width, height }) => {
          setNotes(prev => prev.map(n => {
            if (n.noteId === noteId) {
              const updated = { ...n };
              if (content !== undefined) updated.content = content;
              if (color !== undefined) updated.color = color;
              if (width !== undefined) updated.width = width;
              if (height !== undefined) updated.height = height;
              return updated;
            }
            return n;
          }));
        });

        socketRef.current.on('receive-pin-note', ({ noteId, isPinned }) => {
          setNotes(prev => prev.map(n => n.noteId === noteId ? { ...n, isPinned } : n));
        });

        socketRef.current.on('receive-delete-note', ({ noteId }) => {
          setNotes(prev => prev.filter(n => n.noteId !== noteId));
        });

        socketRef.current.on('error-message', ({ message }) => {
          setError(message);
        });

      } catch (err) {
        console.error('Error starting collaboration workspace:', err);
        setError(err.response?.data?.message || 'Access Denied: You are not authorized for this project.');
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaceData();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-project-room', {
          projectId,
          userId: currentUser?.name
        });
        socketRef.current.disconnect();
      }
    };
  }, [projectId, navigate]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Typing event handler
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    // 1. Emit typing indicator
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing-start', {
        projectId,
        userId: currentUser._id,
        userName: currentUser.name
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('typing-stop', {
        projectId,
        userId: currentUser._id,
        userName: currentUser.name
      });
    }, 2000);

    // 2. "@" Mentions Dropdown check
    const words = val.split(' ');
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith('@')) {
      setShowMentionDropdown(true);
      setMentionSearch(lastWord.substring(1).toLowerCase());
    } else {
      setShowMentionDropdown(false);
    }
  };

  // Select teammate from mention dropdown
  const handleSelectMention = (member) => {
    const words = inputText.split(' ');
    words[words.length - 1] = `@${member.name} `;
    setInputText(words.join(' '));
    setShowMentionDropdown(false);
    chatInputRef.current?.focus();
  };

  // Send message handler
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !fileUploading) return;

    const messageData = {
      projectId,
      roomId: project?.chatRoomId || projectId, // fallback to project id
      sender: currentUser._id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: inputText,
      replyTo: replyToMessage?._id || null
    };

    socketRef.current.emit('send-message', messageData);
    setInputText('');
    setReplyToMessage(null);
    setShowMentionDropdown(false);

    // Stop typing immediately
    if (isTyping) {
      setIsTyping(false);
      socketRef.current.emit('typing-stop', {
        projectId,
        userId: currentUser._id,
        userName: currentUser.name
      });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  // Upload File attachment handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limits!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setFileUploading(true);
      const res = await uploadFile(formData);

      // Send the message with attachment metadata
      const messageData = {
        projectId,
        roomId: project?.chatRoomId || projectId,
        sender: currentUser._id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        content: `Sent an attachment: ${file.name}`,
        fileUrl: res.fileUrl,
        fileName: res.fileName,
        fileType: res.fileType,
        replyTo: replyToMessage?._id || null
      };

      socketRef.current.emit('send-message', messageData);
      setReplyToMessage(null);
    } catch (err) {
      console.error('File upload error:', err);
      alert('Error uploading file attachment.');
    } finally {
      setFileUploading(false);
    }
  };

  // Trigger file attachment selection
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Toggle reactions on message
  const handleToggleReaction = (messageId, emoji) => {
    socketRef.current.emit('message-reaction', {
      projectId,
      messageId,
      user: currentUser.name,
      emoji
    });
  };

  // Whiteboard sticky notes handling
  const handleAddNote = () => {
    const noteId = `note-${Date.now()}`;
    const newNote = {
      noteId,
      projectId,
      createdBy: currentUser.name,
      content: 'Write something...',
      positionX: 80 + Math.random() * 100,
      positionY: 80 + Math.random() * 100,
      width: 180,
      height: 180,
      color: activeColor,
      isPinned: false
    };

    // Update locally
    setNotes(prev => [...prev, newNote]);
    // Sync to socket
    socketRef.current.emit('create-note', newNote);
  };

  // Note Drag mechanics (Custom lightweight mouse tracker)
  const handleDragStart = (e, note) => {
    if (note.isPinned) return;
    
    // Check if dragging from handles or content
    if (e.target.tagName.toLowerCase() === 'textarea' || e.target.closest('.color-dot') || e.target.closest('.action-btn')) {
      return; // ignore drag if editing text, deleting or choosing colors
    }

    e.preventDefault();
    const startX = e.clientX - note.positionX;
    const startY = e.clientY - note.positionY;

    const handleMouseMove = (moveEvent) => {
      const newX = Math.max(0, moveEvent.clientX - startX);
      const newY = Math.max(0, moveEvent.clientY - startY);
      
      setNotes(prev => prev.map(n => n.noteId === note.noteId ? { ...n, positionX: newX, positionY: newY } : n));
      
      socketRef.current.emit('move-note', {
        projectId,
        noteId: note.noteId,
        positionX: newX,
        positionY: newY
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Note Resize mechanics (Diagonal handle)
  const handleResizeStart = (e, note) => {
    e.preventDefault();
    e.stopPropagation();

    const startWidth = note.width || 180;
    const startHeight = note.height || 180;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.max(120, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(120, startHeight + (moveEvent.clientY - startY));

      setNotes(prev => prev.map(n => n.noteId === note.noteId ? { ...n, width: newWidth, height: newHeight } : n));

      socketRef.current.emit('update-note', {
        projectId,
        noteId: note.noteId,
        width: newWidth,
        height: newHeight
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Edit Note text
  const handleNoteTextChange = (noteId, val) => {
    setNotes(prev => prev.map(n => n.noteId === noteId ? { ...n, content: val } : n));
    socketRef.current.emit('update-note', {
      projectId,
      noteId,
      content: val
    });
  };

  // Change note background color
  const handleNoteColorChange = (noteId, colorClass) => {
    setNotes(prev => prev.map(n => n.noteId === noteId ? { ...n, color: colorClass } : n));
    socketRef.current.emit('update-note', {
      projectId,
      noteId,
      color: colorClass
    });
  };

  // Toggle pinned note
  const handleTogglePinNote = (noteId, currentPin) => {
    const isPinned = !currentPin;
    setNotes(prev => prev.map(n => n.noteId === noteId ? { ...n, isPinned } : n));
    socketRef.current.emit('pin-note', {
      projectId,
      noteId,
      isPinned
    });
  };

  // Delete note
  const handleDeleteNote = (noteId) => {
    setNotes(prev => prev.filter(n => n.noteId !== noteId));
    socketRef.current.emit('delete-note', {
      projectId,
      noteId
    });
  };

  // Filter messages based on search bar
  const filteredMessages = messages.filter(m => 
    (m.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.senderName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mention dropdown user filtering
  const filteredMembers = allTeammates.filter(member => 
    member.name.toLowerCase().includes(mentionSearch)
  );

  // Resolve message background styles in neubrutalist theme
  const getMessageBubbleStyle = (sender) => {
    if (sender === currentUser.name) {
      return 'bg-primary-container text-on-primary-container border-2 border-on-background shadow-[2px_2px_0px_0px_rgba(28,27,27,1)] ml-auto';
    }
    return 'bg-white text-on-surface border-2 border-on-background shadow-[2px_2px_0px_0px_rgba(28,27,27,1)]';
  };

  if (loading) {
    return (
      <div className="p-margin flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
        <p className="font-headline-sm mt-4">Sketching workspace interface...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-margin flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <span className="material-symbols-outlined text-error text-6xl rotate-[12deg] mb-4">gpp_bad</span>
        <h3 className="font-headline-md mb-2">Workspace Restrict!</h3>
        <p className="font-body-lg text-on-surface-variant max-w-md text-center">{error}</p>
        <Link to="/projects" className="mt-8 px-6 py-3 bg-primary-container border-2 border-on-background rough-border font-bold text-sm shadow-[4px_4px_0px_0px_#1c1b1b] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-[calc(100vh-4rem)] overflow-hidden">
      {/* LEFT PANEL: Neubrutalist Whiteboard Canvas */}
      <section className="flex-1 flex flex-col h-full bg-[#fbfaf8] border-r-4 border-on-background relative overflow-hidden">
        {/* Canvas Toolbar */}
        <div className="h-14 border-b-2 border-on-background bg-surface flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">space_dashboard</span>
            <h3 className="font-headline-sm">{project?.title} - Board</h3>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Color preview selection */}
            <div className="flex items-center gap-1.5 border-r-2 border-on-background pr-4 mr-1">
              {['primary-container', 'secondary-container', 'tertiary-container', 'error-container', 'bg-white'].map((col) => {
                const colorMap = {
                  'primary-container': 'bg-primary-container',
                  'secondary-container': 'bg-secondary-container',
                  'tertiary-container': 'bg-tertiary-container',
                  'error-container': 'bg-error-container',
                  'bg-white': 'bg-white border border-on-background/20'
                };
                return (
                  <button
                    key={col}
                    onClick={() => setActiveColor(col)}
                    className={`w-6 h-6 rounded-full cursor-pointer ${colorMap[col]} border-2 border-on-background transition-transform hover:scale-115 ${activeColor === col ? 'ring-2 ring-primary ring-offset-1 scale-110' : ''}`}
                    title={`Select default note color: ${col}`}
                  />
                );
              })}
            </div>

            <button
              onClick={handleAddNote}
              className="px-4 py-1.5 bg-secondary-container hover:bg-secondary border-2 border-on-background font-bold text-xs shadow-[2px_2px_0px_0px_#1c1b1b] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
              <span>Add Note</span>
            </button>
          </div>
        </div>

        {/* Scrollable canvas area */}
        <div 
          className="flex-1 w-full relative overflow-auto p-8 select-none" 
          style={{ 
            backgroundImage: 'radial-gradient(#1c1b1b 1.5px, transparent 1.5px)', 
            backgroundSize: '24px 24px',
            cursor: 'grab' 
          }}
        >
          {notes.map((note) => {
            const colorClassMap = {
              'primary-container': 'bg-primary-container',
              'secondary-container': 'bg-secondary-container',
              'tertiary-container': 'bg-tertiary-container',
              'error-container': 'bg-error-container',
              'bg-white': 'bg-white'
            };
            const currentBg = colorClassMap[note.color] || 'bg-primary-container';
            
            return (
              <div
                key={note.noteId}
                onMouseDown={(e) => handleDragStart(e, note)}
                className={`absolute ${currentBg} border-2 border-on-background shadow-[5px_5px_0px_0px_rgba(28,27,27,1)] p-4 flex flex-col justify-between transition-shadow hover:shadow-[7px_7px_0px_0px_rgba(28,27,27,1)]`}
                style={{
                  left: `${note.positionX}px`,
                  top: `${note.positionY}px`,
                  width: `${note.width || 180}px`,
                  height: `${note.height || 180}px`,
                  zIndex: note.isPinned ? 5 : 10,
                  cursor: note.isPinned ? 'default' : 'move'
                }}
              >
                {/* Note Header / Toolbar */}
                <div className="flex justify-between items-center border-b border-on-background/10 pb-1 mb-2 select-none drag-header">
                  <span className="font-annotation text-[9px] text-on-surface-variant font-bold truncate max-w-[80px]">
                    by {note.createdBy.split(' ')[0]}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Pin button */}
                    <button
                      onClick={() => handleTogglePinNote(note.noteId, note.isPinned)}
                      className="action-btn text-on-surface-variant hover:text-primary transition-colors cursor-pointer select-none"
                      title={note.isPinned ? 'Unpin Note' : 'Pin Note'}
                    >
                      <span className={`material-symbols-outlined text-sm font-bold ${note.isPinned ? 'text-primary fill-1' : 'opacity-60'}`}>
                        push_pin
                      </span>
                    </button>
                    {/* Delete note */}
                    <button
                      onClick={() => handleDeleteNote(note.noteId)}
                      className="action-btn text-on-surface-variant hover:text-error transition-colors cursor-pointer select-none"
                      title="Delete Note"
                    >
                      <span className="material-symbols-outlined text-sm font-bold opacity-60 hover:opacity-100">
                        close
                      </span>
                    </button>
                  </div>
                </div>

                {/* Content Editable Area */}
                <textarea
                  value={note.content}
                  onChange={(e) => handleNoteTextChange(note.noteId, e.target.value)}
                  className="flex-1 bg-transparent resize-none border-none outline-none font-annotation text-xs font-bold leading-relaxed scrollbar-thin select-text text-on-surface"
                  placeholder="Type note message..."
                />

                {/* Note Footer Colors Selection & Resize Handle */}
                <div className="flex justify-between items-center mt-2 select-none border-t border-on-background/10 pt-1.5">
                  <div className="flex items-center gap-1">
                    {['primary-container', 'secondary-container', 'tertiary-container', 'bg-white'].map((col) => {
                      const dotMap = {
                        'primary-container': 'bg-primary-container',
                        'secondary-container': 'bg-secondary-container',
                        'tertiary-container': 'bg-tertiary-container',
                        'bg-white': 'bg-white border border-on-background/25'
                      };
                      return (
                        <button
                          key={col}
                          onClick={() => handleNoteColorChange(note.noteId, col)}
                          className={`color-dot w-3 h-3 rounded-full cursor-pointer ${dotMap[col]} border border-on-background`}
                        />
                      );
                    })}
                  </div>

                  {/* Drag diagonal resizing handle */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, note)}
                    className="w-4 h-4 cursor-se-resize flex items-end justify-end select-none"
                    title="Drag to resize note"
                  >
                    <span className="material-symbols-outlined text-xs text-on-surface-variant opacity-60">
                      filter_list
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {notes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-40 select-none pointer-events-none">
              <span className="material-symbols-outlined text-[80px] text-on-background/30 mb-4 animate-bounce">
                border_color
              </span>
              <p className="font-headline-sm">Click "Add Note" to populate the whiteboard!</p>
              <p className="font-annotation text-xs mt-1">Changes sync in real-time between project members.</p>
            </div>
          )}
        </div>
      </section>

      {/* RIGHT PANEL: Neubrutalist Chat Room */}
      <aside className="w-full md:w-[420px] flex flex-col h-full bg-surface">
        {/* Chat Header */}
        <div className="h-14 border-b-2 border-on-background bg-surface flex flex-col justify-center px-6 shrink-0 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
              <h3 className="font-headline-sm truncate max-w-[200px]">Team Chat</h3>
            </div>
            
            {/* Search messages */}
            <div className="relative max-w-[150px]">
              <span className="material-symbols-outlined text-sm absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-70">
                search
              </span>
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2 py-0.5 border border-on-background bg-surface-container-lowest text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Message History List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fcfcfa]">
          {filteredMessages.map((msg) => {
            const isMe = msg.sender === currentUser.name;
            const bubbleBg = getMessageBubbleStyle(msg.sender);
            
            // Format time
            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return (
              <div key={msg._id} className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                {/* Sender Title details */}
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-on-surface-variant font-annotation">
                  <span>{msg.senderName}</span>
                  <span className="opacity-50">({msg.senderRole})</span>
                  <span>•</span>
                  <span>{timeStr}</span>
                </div>

                {/* Reply To banner in message bubble */}
                <div className={`rounded-lg p-3 ${bubbleBg} flex flex-col gap-2`}>
                  {msg.replyTo && (
                    <div className="bg-on-background/5 border-l-2 border-primary py-1 px-2 mb-1 text-[10px] font-annotation italic text-on-surface-variant rounded">
                      Replying to: "{(typeof msg.replyTo === 'object' ? msg.replyTo.content : msg.replyTo) || 'Attachment'}"
                    </div>
                  )}

                  {/* Main content message text */}
                  <p className="text-xs leading-relaxed font-body-md select-text break-words font-bold">
                    {msg.content}
                  </p>

                  {/* Render uploads file attachment */}
                  {msg.fileUrl && (
                    <div className="mt-2 border-t border-on-background/10 pt-2 flex items-center gap-2 bg-on-background/5 p-2 rounded">
                      {msg.fileType?.startsWith('image/') ? (
                        <div className="flex flex-col gap-1.5">
                          <img 
                            src={`http://localhost:3001${msg.fileUrl}`} 
                            alt={msg.fileName}
                            className="max-h-32 max-w-full rounded border border-on-background object-cover cursor-zoom-in"
                            onClick={() => window.open(`http://localhost:3001${msg.fileUrl}`, '_blank')}
                          />
                          <a 
                            href={`http://localhost:3001${msg.fileUrl}`} 
                            download 
                            target="_blank" 
                            className="text-[10px] text-primary underline flex items-center gap-1 font-bold"
                          >
                            <span className="material-symbols-outlined text-xs">download</span>
                            <span>Download Image</span>
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-on-surface-variant">description</span>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold truncate max-w-[150px]">{msg.fileName}</span>
                            <a 
                              href={`http://localhost:3001${msg.fileUrl}`} 
                              download 
                              target="_blank" 
                              className="text-[9px] text-primary underline font-bold"
                            >
                              Download File
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Reactions display row */}
                  <div className="flex flex-wrap gap-1.5 mt-1 pt-1 border-t border-dashed border-on-background/10">
                    {/* Toggled reaction list */}
                    {['👍', '❤️', '🔥', '😂', '😮'].map((emoji) => {
                      const count = (msg.reactions || []).filter(r => r.emoji === emoji).length;
                      const hasReacted = (msg.reactions || []).some(r => r.emoji === emoji && r.user === currentUser.name);

                      return (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg._id, emoji)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-transform hover:scale-110 cursor-pointer ${hasReacted ? 'bg-primary-container border-on-background' : 'bg-surface border-on-background/25'}`}
                        >
                          {emoji} {count > 0 && <span className="font-annotation text-[9px]">{count}</span>}
                        </button>
                      );
                    })}

                    {/* Reply to this message button */}
                    <button
                      onClick={() => setReplyToMessage(msg)}
                      className="ml-auto text-[10px] text-on-surface-variant hover:text-primary font-bold transition-colors cursor-pointer select-none font-annotation"
                    >
                      Reply
                    </button>
                  </div>
                </div>

                {/* Read receipt tick-marks */}
                {isMe && (
                  <div className="flex items-center gap-1 mt-0.5 text-[9px] font-annotation text-on-surface-variant opacity-60">
                    <span className="material-symbols-outlined text-xs">
                      {msg.readBy && msg.readBy.length > 1 ? 'done_all' : 'done'}
                    </span>
                    <span>seen</span>
                  </div>
                )}
              </div>
            );
          })}

          {filteredMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 select-none py-12">
              <span className="material-symbols-outlined text-4xl mb-2 text-on-background/40">forum</span>
              <p className="text-xs font-bold">No historical messages here yet.</p>
              <p className="text-[10px] font-annotation mt-0.5">Send a message or upload files to kickstart sync!</p>
            </div>
          )}

          {/* Typing users display alert */}
          {Object.keys(typingUsers).length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-annotation italic text-on-surface-variant py-2 bg-on-background/5 px-3 rounded max-w-max border border-on-background/10">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce"></span>
              <span>{Object.values(typingUsers).join(', ')} typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Reply Preview Bar */}
        {replyToMessage && (
          <div className="px-6 py-2 border-t-2 border-on-background bg-secondary-container/20 flex justify-between items-center shrink-0">
            <div className="flex flex-col text-[10px]">
              <span className="font-bold text-on-surface-variant font-annotation">Replying to {replyToMessage.senderName}</span>
              <span className="truncate max-w-[250px] italic">"{replyToMessage.content}"</span>
            </div>
            <button 
              onClick={() => setReplyToMessage(null)}
              className="material-symbols-outlined text-sm text-on-surface-variant hover:text-error cursor-pointer font-bold select-none"
            >
              close
            </button>
          </div>
        )}

        {/* Chat input block */}
        <div className="p-4 border-t-2 border-on-background bg-surface shrink-0 relative">
          
          {/* Autocomplete mention dropdown popup */}
          {showMentionDropdown && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-4 mb-2 max-w-[200px] w-full border-2 border-on-background bg-white shadow-[3px_3px_0px_0px_rgba(28,27,27,1)] z-30 p-1 max-h-32 overflow-y-auto">
              <div className="text-[9px] font-annotation font-bold text-on-surface-variant p-1 border-b border-on-background/10">
                Mention Collaborator
              </div>
              {filteredMembers.map(member => (
                <button
                  key={member._id}
                  onClick={() => handleSelectMention(member)}
                  className="w-full text-left px-2 py-1 text-xs font-bold hover:bg-primary-container transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <img src={member.profileImage} alt="" className="w-4 h-4 rounded-full border border-on-background object-cover" />
                  <span className="truncate">{member.name}</span>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={fileUploading}
              className={`p-2 border-2 border-on-background bg-white hover:bg-surface-container-high shadow-[2px_2px_0px_0px_#1c1b1b] active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none shrink-0 ${fileUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Attach File"
            >
              <span className="material-symbols-outlined text-sm font-bold">
                {fileUploading ? 'hourglass_top' : 'attach_file'}
              </span>
            </button>

            {/* Main input text field */}
            <input
              type="text"
              ref={chatInputRef}
              value={inputText}
              onChange={handleInputChange}
              placeholder="Write a message... (Use @ to mention)"
              className="flex-grow p-2.5 border-2 border-on-background rounded focus:ring-0 focus:border-primary outline-none font-bold text-xs bg-white"
            />

            <button
              type="submit"
              className="px-4 bg-primary-container hover:bg-primary border-2 border-on-background font-bold text-xs shadow-[2px_2px_0px_0px_#1c1b1b] active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none shrink-0"
              title="Send Message"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </form>

          {/* Hidden inputs file handler */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          />
        </div>
      </aside>
    </div>
  );
};

export default ProjectWorkspace;
