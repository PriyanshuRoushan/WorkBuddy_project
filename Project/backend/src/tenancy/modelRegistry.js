import Activity from '../models/Activity.js';
import Announcement from '../models/Announcement.js';
import ChatRoom from '../models/ChatRoom.js';
import Event from '../models/Event.js';
import Invitation from '../models/Invitation.js';
import Message from '../models/Message.js';
import Organization from '../models/Organization.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import ProjectNote from '../models/ProjectNote.js';
import Rating from '../models/Rating.js';
import RoleTemplate from '../models/RoleTemplate.js';
import StickyNote from '../models/StickyNote.js';
import Task from '../models/Task.js';
import TeamMember from '../models/TeamMember.js';
import User from '../models/User.js';

const models = { Activity, Announcement, ChatRoom, Event, Invitation, Message, Organization, Project, ProjectMember, ProjectNote, Rating, RoleTemplate, StickyNote, Task, TeamMember, User };
export const modelDefinitions = Object.entries(models).map(([name, model]) => ({ name, schema: model.schema }));
