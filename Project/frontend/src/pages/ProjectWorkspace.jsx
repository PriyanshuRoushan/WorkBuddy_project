import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import Avatar from '../components/Avatar';
import { CONSTANT } from '../../constant';
import {
  createProjectChannel,
  createTask,
  deleteProjectChannel,
  getChannelMessages,
  getProject,
  getProjectChannels,
  getTeamMembers,
  toggleMessageBookmark,
  updateChannelState,
  updateProjectChannel,
  uploadFile
} from '../services/api';

const ProjectWorkspace = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const currentUser = useMemo(() => JSON.parse(localStorage.getItem('user') || 'null'), []);
  const token = useMemo(() => localStorage.getItem('token'), []);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeChannelRef = useRef(null);

  const [project, setProject] = useState(null);
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState('');
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: '', description: '' });
  const [showChannels, setShowChannels] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const activeChannel = channels.find(channel => channel._id === activeChannelId);
  const projectMembers = useMemo(() => {
    const ids = new Set((project?.collaboratorUsers || []).map(member => String(member._id)));
    if (project?.creator) ids.add(String(project.creator));
    return members.filter(member => ids.has(String(member._id)));
  }, [members, project]);

  const canPublishAnnouncement = ['CEO', 'HR'].includes(currentUser?.accessRole)
    || String(project?.creator) === String(currentUser?._id);

  const refreshChannels = async () => {
    const data = await getProjectChannels(projectId);
    setChannels(data);
    return data;
  };

  useEffect(() => {
    if (!currentUser || !token) {
      navigate('/login');
      return;
    }

    let alive = true;
    Promise.all([getProject(projectId), getProjectChannels(projectId), getTeamMembers()])
      .then(([projectData, channelData, memberData]) => {
        if (!alive) return;
        setProject(projectData);
        setChannels(channelData);
        setMembers(memberData);
        const initial = channelData.find(channel => channel.slug === 'general') || channelData[0];
        if (initial) {
          setLoadingMessages(true);
          setMessages([]);
          setActiveChannelId(initial._id);
        }
      })
      .catch(err => setError(err.response?.data?.message || 'Could not open this project communication space.'))
      .finally(() => setLoading(false));

    const socket = io(CONSTANT.API_URL.replace(/\/$/, ''), {
      auth: { token },
      withCredentials: true
    });
    socketRef.current = socket;

    socket.on('receive-message', message => {
      if (String(message.roomId) !== String(activeChannelRef.current)) return;
      setMessages(previous => previous.some(item => item._id === message._id) ? previous : [...previous, message]);
    });
    socket.on('message-updated', updated => {
      setMessages(previous => previous.map(message => message._id === updated._id
        ? { ...message, ...updated, sender: message.sender }
        : message));
    });
    socket.on('message-deleted', ({ messageId, deletedAt }) => {
      setMessages(previous => previous.map(message => message._id === messageId
        ? { ...message, content: '', fileUrl: null, deletedAt }
        : message));
    });
    socket.on('message-reaction-updated', ({ messageId, reactions }) => {
      setMessages(previous => previous.map(message => message._id === messageId ? { ...message, reactions } : message));
    });
    socket.on('message-task-updated', ({ messageId, task }) => {
      setMessages(previous => previous.map(message => message._id === messageId ? { ...message, taskId: task } : message));
    });
    socket.on('message-read', ({ messageId, userId }) => {
      setMessages(previous => previous.map(message => message._id === messageId
        ? { ...message, readBy: [...new Set([...(message.readBy || []), userId])] }
        : message));
    });
    socket.on('typing-start', ({ userId, userName }) => {
      setTypingUsers(previous => ({ ...previous, [userId]: userName }));
    });
    socket.on('typing-stop', ({ userId }) => {
      setTypingUsers(previous => {
        const next = { ...previous };
        delete next[userId];
        return next;
      });
    });
    socket.on('error-message', payload => setError(payload.message));

    return () => {
      alive = false;
      socket.disconnect();
    };
  }, [currentUser, navigate, projectId, token]);

  useEffect(() => {
    if (!activeChannelId) return;
    activeChannelRef.current = activeChannelId;
    getChannelMessages(projectId, activeChannelId)
      .then(data => {
        setMessages(data.messages || []);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
        return updateChannelState(activeChannelId, { markRead: true });
      })
      .then(() => setChannels(previous => previous.map(channel =>
        channel._id === activeChannelId ? { ...channel, unreadCount: 0 } : channel
      )))
      .catch(err => setError(err.response?.data?.message || 'Could not load channel messages.'))
      .finally(() => setLoadingMessages(false));

    const join = () => socketRef.current?.emit('join-channel', { projectId, channelId: activeChannelId }, response => {
      if (!response?.ok) setError(response?.message || 'Could not join channel.');
    });
    if (socketRef.current?.connected) join();
    else socketRef.current?.once('connect', join);

    return () => socketRef.current?.emit('leave-channel', { channelId: activeChannelId });
  }, [activeChannelId, projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const loadOlder = async () => {
    if (!nextCursor || !activeChannelId) return;
    const data = await getChannelMessages(projectId, activeChannelId, { before: nextCursor });
    setMessages(previous => [...(data.messages || []), ...previous]);
    setHasMore(data.hasMore);
    setNextCursor(data.nextCursor);
  };

  const sendMessage = event => {
    event.preventDefault();
    const content = inputText.trim();
    if (!content || !activeChannel || activeChannel.isArchived) return;

    if (editingMessage) {
      socketRef.current.emit('edit-message', {
        channelId: activeChannelId,
        messageId: editingMessage._id,
        content
      }, response => {
        if (!response?.ok) return setError(response?.message || 'Could not edit message.');
        setEditingMessage(null);
        setInputText('');
      });
      return;
    }

    socketRef.current.emit('send-message', {
      projectId,
      channelId: activeChannelId,
      content,
      replyTo: replyTo?._id || null
    }, response => {
      if (!response?.ok) return setError(response?.message || 'Message was not sent.');
      setInputText('');
      setReplyTo(null);
      setError('');
    });
  };

  const sendAttachment = async event => {
    const file = event.target.files?.[0];
    if (!file || !activeChannel || activeChannel.isArchived) return;
    const form = new FormData();
    form.append('file', file);
    try {
      setUploading(true);
      const uploaded = await uploadFile(form);
      socketRef.current.emit('send-message', {
        projectId,
        channelId: activeChannelId,
        content: 'Shared ' + file.name,
        fileUrl: uploaded.fileUrl,
        fileName: uploaded.fileName,
        fileType: uploaded.fileType,
        replyTo: replyTo?._id || null
      }, response => {
        if (!response?.ok) setError(response?.message || 'Attachment was not sent.');
        else setReplyTo(null);
      });
    } catch (err) {
      setError(err.response?.data?.message || 'File upload failed.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const createChannel = async event => {
    event.preventDefault();
    try {
      const channel = await createProjectChannel(projectId, newChannel);
      await refreshChannels();
      setLoadingMessages(true);
      setMessages([]);
      setReplyTo(null);
      setEditingMessage(null);
      setActiveChannelId(channel._id);
      setNewChannel({ name: '', description: '' });
      setShowCreateChannel(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create channel.');
    }
  };

  const archiveChannel = async () => {
    const updated = await updateProjectChannel(projectId, activeChannelId, { isArchived: !activeChannel.isArchived });
    setChannels(previous => previous.map(channel => channel._id === updated._id ? { ...channel, ...updated } : channel));
  };

  const removeChannel = async () => {
    if (!confirm('Delete this channel and its message history?')) return;
    await deleteProjectChannel(projectId, activeChannelId);
    activeChannelRef.current = null;
    const data = await refreshChannels();
    const nextChannelId = (data.find(channel => channel.slug === 'general') || data[0])?._id || '';
    setLoadingMessages(Boolean(nextChannelId));
    setMessages([]);
    setReplyTo(null);
    setEditingMessage(null);
    setActiveChannelId(nextChannelId);
  };

  const changeNotifications = async preference => {
    await updateChannelState(activeChannelId, { notificationPreference: preference });
    setChannels(previous => previous.map(channel => channel._id === activeChannelId
      ? { ...channel, notificationPreference: preference }
      : channel));
  };

  const bookmark = async message => {
    const result = await toggleMessageBookmark(message._id);
    setMessages(previous => previous.map(item => item._id === message._id
      ? { ...item, isBookmarked: result.bookmarked }
      : item));
  };

  const toggleFlag = (message, field) => {
    socketRef.current.emit('message-flags', {
      channelId: activeChannelId,
      messageId: message._id,
      [field]: !message[field]
    }, response => {
      if (!response?.ok) setError(response?.message || 'Project lead permission required.');
    });
  };

  const convertToTask = async message => {
    try {
      const task = await createTask({
        title: String(message.content || 'Follow up on shared message').slice(0, 140),
        category: 'CORE',
        status: 'TO DO',
        priority: 'MEDIUM',
        assignedTo: currentUser._id,
        projectId,
        sourceMessageId: message._id
      });
      setMessages(previous => previous.map(item => item._id === message._id ? { ...item, taskId: task } : item));
      socketRef.current?.emit('task-converted', { channelId: activeChannelId, messageId: message._id, task });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not convert this message into a task.');
    }
  };

  const removeMessage = message => {
    socketRef.current.emit('delete-message', {
      channelId: activeChannelId,
      messageId: message._id
    }, response => {
      if (!response?.ok) setError(response?.message || 'Could not delete message.');
    });
  };

  const react = (messageId, emoji) => socketRef.current.emit('message-reaction', {
    channelId: activeChannelId,
    messageId,
    emoji
  });

  const visibleMessages = messages.filter(message =>
    !search || String(message.content || '').toLowerCase().includes(search.toLowerCase())
  );
  const pinnedMessages = messages.filter(message => message.isPinned && !message.deletedAt);

  if (loading) return <div className="h-[calc(100vh-4rem)] grid place-items-center"><span className="material-symbols-outlined animate-spin text-5xl">progress_activity</span></div>;
  if (!project) return <div className="p-10"><p>{error || 'Project not found.'}</p><Link to="/projects">Back to projects</Link></div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-surface">
      {error && (
        <button onClick={() => setError('')} className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-error-container border-2 border-on-background px-4 py-2 text-xs font-bold shadow-[3px_3px_0_#1c1b1b]">
          {error} ×
        </button>
      )}

      <aside className={(showChannels ? 'flex' : 'hidden md:flex') + ' absolute md:relative z-30 w-72 h-full flex-col border-r-2 border-on-background bg-surface-container-lowest'}>
        <div className="p-5 border-b-2 border-on-background">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Project communication</p>
              <h2 className="font-headline-sm truncate">{project.title}</h2>
            </div>
            <button onClick={() => setShowChannels(false)} className="md:hidden material-symbols-outlined">close</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between px-2 py-2">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">Channels</span>
            <button onClick={() => setShowCreateChannel(value => !value)} className="material-symbols-outlined text-lg" title="Create channel">add</button>
          </div>

          {showCreateChannel && (
            <form onSubmit={createChannel} className="border-2 border-on-background bg-white p-3 mb-3 space-y-2">
              <input value={newChannel.name} onChange={event => setNewChannel({ ...newChannel, name: event.target.value })} placeholder="Channel name" className="w-full border border-on-background p-2 text-xs" required />
              <input value={newChannel.description} onChange={event => setNewChannel({ ...newChannel, description: event.target.value })} placeholder="Short description" className="w-full border border-on-background p-2 text-xs" />
              <button className="w-full bg-primary-container border-2 border-on-background py-1.5 text-xs font-bold">Create channel</button>
            </form>
          )}

          <div className="space-y-1">
            {channels.map(channel => (
              <button
                key={channel._id}
                onClick={() => {
                  setLoadingMessages(true);
                  setMessages([]);
                  setReplyTo(null);
                  setEditingMessage(null);
                  setActiveChannelId(channel._id);
                  setShowChannels(false);
                }}
                className={'w-full flex items-center gap-2 px-3 py-2 text-left text-sm ' + (activeChannelId === channel._id ? 'bg-primary-container border-2 border-on-background font-bold' : 'hover:bg-surface-container')}
              >
                <span className="material-symbols-outlined text-base">{channel.type === 'ANNOUNCEMENTS' ? 'campaign' : channel.isArchived ? 'inventory_2' : 'tag'}</span>
                <span className="truncate flex-1">{channel.name}</span>
                {channel.unreadCount > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-error text-on-error text-[10px] grid place-items-center">{channel.unreadCount}</span>}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col h-full">
        <header className="h-16 px-4 md:px-6 border-b-2 border-on-background flex items-center justify-between bg-surface shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setShowChannels(true)} className="md:hidden material-symbols-outlined">menu</button>
            <span className="material-symbols-outlined">{activeChannel?.type === 'ANNOUNCEMENTS' ? 'campaign' : 'tag'}</span>
            <div className="min-w-0">
              <h3 className="font-bold truncate">{activeChannel?.name || 'Channel'}</h3>
              <p className="text-[10px] text-on-surface-variant truncate">{activeChannel?.description || 'Project conversation'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined absolute left-2 top-1.5 text-base">search</span>
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search messages" className="pl-8 pr-3 py-1.5 w-48 border-2 border-on-background text-xs bg-white" />
            </div>
            <button onClick={() => setShowInfo(value => !value)} className="material-symbols-outlined border-2 border-on-background p-1 bg-white">info</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 bg-[#fcfcfa]">
          {hasMore && <button onClick={loadOlder} className="mx-auto mb-5 block text-xs font-bold underline">Load older messages</button>}
          {loadingMessages ? (
            <div className="h-full grid place-items-center"><span className="material-symbols-outlined animate-spin">progress_activity</span></div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-5">
              {visibleMessages.map(message => {
                const sender = typeof message.sender === 'object' ? message.sender : null;
                const senderName = sender?.displayName || sender?.name || message.senderName;
                const senderAvatar = sender?.profileImage || message.senderAvatar;
                const own = String(sender?._id || message.senderId || message.sender) === String(currentUser._id);
                const deleted = Boolean(message.deletedAt);
                return (
                  <article key={message._id} className="group flex gap-3">
                    <Avatar name={senderName} src={senderAvatar} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <strong className="text-sm">{senderName}</strong>
                        <span className="text-[10px] text-on-surface-variant">{sender?.jobTitle || message.senderRole}</span>
                        <time className="text-[10px] text-on-surface-variant">{new Date(message.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
                        {message.editedAt && <span className="text-[9px] text-on-surface-variant">(edited)</span>}
                        {message.isPinned && <span className="material-symbols-outlined text-sm text-primary" title="Pinned">push_pin</span>}
                        {message.isDecision && <span className="text-[9px] bg-tertiary-container border border-on-background px-1.5 font-bold">Decision</span>}
                      </div>
                      {message.replyTo && <div className="my-1 border-l-2 border-primary pl-2 text-[11px] text-on-surface-variant">Reply to {message.replyTo.sender?.displayName || message.replyTo.sender?.name || message.replyTo.senderName}: {message.replyTo.content}</div>}
                      {deleted ? <p className="italic text-xs text-on-surface-variant py-1">This message was deleted.</p> : <p className="text-sm leading-relaxed whitespace-pre-wrap break-words py-1">{message.content}</p>}
                      {!deleted && message.fileUrl && (
                        message.fileType?.startsWith('image/')
                          ? <a href={message.fileUrl} target="_blank"><img src={message.fileUrl} alt={message.fileName} className="max-w-sm max-h-72 object-cover border-2 border-on-background mt-2" /></a>
                          : <a href={message.fileUrl} target="_blank" className="inline-flex items-center gap-2 border-2 border-on-background bg-white px-3 py-2 text-xs font-bold mt-2"><span className="material-symbols-outlined">description</span>{message.fileName}</a>
                      )}
                      {!deleted && message.taskId && (
                        <Link to="/tasks" className="mt-2 block max-w-lg border-2 border-on-background bg-secondary-container p-3 shadow-[2px_2px_0_#1c1b1b]">
                          <span className="text-[9px] uppercase font-bold">Linked task · {message.taskId.priority || 'MEDIUM'}</span>
                          <strong className="block text-xs mt-1">{message.taskId.title}</strong>
                          <span className="text-[10px]">{message.taskId.status} · {message.taskId.dueDate ? new Date(message.taskId.dueDate).toLocaleDateString() : 'No due date'}</span>
                        </Link>
                      )}
                      {!deleted && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {['👍', '❤️', '🔥', '😂'].map(emoji => {
                            const count = (message.reactions || []).filter(reaction => reaction.emoji === emoji).length;
                            return <button key={emoji} onClick={() => react(message._id, emoji)} className="border border-on-background/30 rounded px-1.5 text-[11px] bg-white">{emoji}{count ? ' ' + count : ''}</button>;
                          })}
                        </div>
                      )}
                    </div>
                    {!deleted && (
                      <div className="opacity-0 group-hover:opacity-100 self-start flex border-2 border-on-background bg-white shadow-[2px_2px_0_#1c1b1b]">
                        <button onClick={() => setReplyTo(message)} className="material-symbols-outlined text-sm p-1" title="Reply">reply</button>
                        <button onClick={() => bookmark(message)} className={'material-symbols-outlined text-sm p-1 ' + (message.isBookmarked ? 'text-primary' : '')} title="Bookmark">bookmark</button>
                        <button onClick={() => toggleFlag(message, 'isPinned')} className="material-symbols-outlined text-sm p-1" title="Pin">push_pin</button>
                        <button onClick={() => toggleFlag(message, 'isDecision')} className="material-symbols-outlined text-sm p-1" title="Mark decision">task_alt</button>
                        {!message.taskId && <button onClick={() => convertToTask(message)} className="material-symbols-outlined text-sm p-1" title="Convert to task">add_task</button>}
                        {own && <button onClick={() => { setEditingMessage(message); setInputText(message.content); }} className="material-symbols-outlined text-sm p-1" title="Edit">edit</button>}
                        {own && <button onClick={() => removeMessage(message)} className="material-symbols-outlined text-sm p-1 text-error" title="Delete">delete</button>}
                      </div>
                    )}
                  </article>
                );
              })}
              {!visibleMessages.length && <div className="h-64 grid place-items-center text-sm text-on-surface-variant">No messages in this channel yet.</div>}
              {Object.keys(typingUsers).length > 0 && <p className="text-xs italic text-on-surface-variant">{Object.values(typingUsers).join(', ')} typing…</p>}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {(replyTo || editingMessage) && (
          <div className="px-5 py-2 border-t-2 border-on-background bg-secondary-container flex justify-between text-xs">
            <span>{editingMessage ? 'Editing your message' : 'Replying to ' + replyTo.senderName}</span>
            <button onClick={() => { setReplyTo(null); setEditingMessage(null); setInputText(''); }} className="material-symbols-outlined text-sm">close</button>
          </div>
        )}

        <form onSubmit={sendMessage} className="p-4 border-t-2 border-on-background bg-surface flex gap-2">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || activeChannel?.isArchived} className="material-symbols-outlined border-2 border-on-background bg-white px-3 disabled:opacity-40">attach_file</button>
          <input
            value={inputText}
            onChange={event => {
              setInputText(event.target.value);
              socketRef.current?.emit(event.target.value ? 'typing-start' : 'typing-stop', { channelId: activeChannelId });
            }}
            disabled={activeChannel?.isArchived || (activeChannel?.type === 'ANNOUNCEMENTS' && !canPublishAnnouncement)}
            placeholder={activeChannel?.isArchived ? 'This channel is archived' : activeChannel?.type === 'ANNOUNCEMENTS' && !canPublishAnnouncement ? 'Only project leads can post announcements' : 'Message #' + (activeChannel?.slug || 'channel')}
            className="flex-1 min-w-0 border-2 border-on-background bg-white px-4 py-3 text-sm disabled:bg-surface-container"
          />
          <button disabled={!inputText.trim() || activeChannel?.isArchived} className="bg-primary-container border-2 border-on-background px-5 font-bold disabled:opacity-40">Send</button>
          <input ref={fileInputRef} type="file" onChange={sendAttachment} className="hidden" accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" />
        </form>
      </main>

      <aside className={(showInfo ? 'flex' : 'hidden lg:flex') + ' absolute right-0 lg:relative z-30 w-80 h-full flex-col border-l-2 border-on-background bg-surface-container-lowest'}>
        <div className="h-16 px-5 border-b-2 border-on-background flex items-center justify-between">
          <strong>Channel details</strong>
          <button onClick={() => setShowInfo(false)} className="lg:hidden material-symbols-outlined">close</button>
        </div>
        <div className="p-5 overflow-y-auto space-y-6">
          <section>
            <h4 className="font-bold"># {activeChannel?.name}</h4>
            <p className="text-xs text-on-surface-variant mt-1">{activeChannel?.description || 'No description.'}</p>
            <p className="text-[10px] text-on-surface-variant mt-2">
              Created by {activeChannel?.createdBy?.displayName || activeChannel?.createdBy?.name || 'WorkBuddy'} · {activeChannel?.createdAt ? new Date(activeChannel.createdAt).toLocaleDateString() : ''}
            </p>
          </section>
          <section>
            <label className="text-[10px] uppercase font-bold">Notifications</label>
            <select value={activeChannel?.notificationPreference || 'ALL'} onChange={event => changeNotifications(event.target.value)} className="w-full mt-2 border-2 border-on-background bg-white p-2 text-xs">
              <option value="ALL">All messages</option>
              <option value="MENTIONS">Mentions only</option>
              <option value="MUTED">Muted</option>
            </select>
          </section>
          {activeChannel?.canManage && (
            <section className="flex gap-2">
              <button onClick={archiveChannel} className="flex-1 border-2 border-on-background bg-white py-2 text-xs font-bold">{activeChannel.isArchived ? 'Restore' : 'Archive'}</button>
              <button onClick={removeChannel} className="border-2 border-on-background bg-error-container px-3 text-xs font-bold">Delete</button>
            </section>
          )}
          <section>
            <h4 className="text-[10px] uppercase font-bold mb-2">Pinned messages</h4>
            <div className="space-y-2">
              {pinnedMessages.map(message => <div key={message._id} className="border border-on-background bg-white p-2 text-xs"><strong>{message.senderName}</strong><p className="truncate">{message.content}</p></div>)}
              {!pinnedMessages.length && <p className="text-xs text-on-surface-variant">Nothing pinned yet.</p>}
            </div>
          </section>
          <section>
            <h4 className="text-[10px] uppercase font-bold mb-3">Project members · {projectMembers.length}</h4>
            <div className="space-y-3">
              {projectMembers.map(member => (
                <div key={member._id} className="flex items-center gap-2">
                  <Avatar name={member.displayName || member.name} src={member.profileImage} size="sm" />
                  <div className="min-w-0"><p className="text-xs font-bold truncate">{member.displayName || member.name}</p><p className="text-[10px] text-on-surface-variant truncate">{member.jobTitle || member.accessRole}</p></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
};

export default ProjectWorkspace;
