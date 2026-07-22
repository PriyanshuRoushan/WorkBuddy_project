# WorkBuddy Developer Documentation

## Overview

WorkBuddy is a full-stack team collaboration and project management platform.

Core modules:
- Authentication & User Management
- Project Management
- Task Management
- Team Collaboration
- Real-time Chat (Socket.IO)
- Calendar & Events
- Activity Tracking
- Sticky Notes
- Project Workspace

Tech Stack:
- Frontend: React, Vite, React Router, Axios, Socket.IO Client, Tailwind CSS
- Backend: Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.IO
- Database: MongoDB
- Authentication: JWT Token Based
- File Uploads: Multer

---

# Project Architecture

Frontend (React)
    |
    | REST API
    v
Backend (Express)
    |
    | Mongoose
    v
MongoDB

Socket.IO is used for real-time collaboration and messaging.

---

# Root Structure

Project/
├── frontend/
├── backend/
├── package.json

---

# Frontend Documentation

## Frontend Dependencies

Main Libraries:
- React
- React DOM
- React Router DOM
- Axios
- Socket.IO Client

Development Libraries:
- Vite
- Tailwind CSS
- ESLint

---

## Frontend Folder Structure

frontend/src

components/
pages/
services/
assets/

### components/

Contains reusable UI components.

Layout.jsx
- Main application layout
- Sidebar + Header wrapper
- Used after authentication

Sidebar.jsx
- Navigation menu
- Route navigation

Header.jsx
- Top navigation bar
- User information display

### pages/

Dashboard.jsx
- Dashboard screen
- Project statistics
- Team overview

Projects.jsx
- Project listing page
- Create project
- Edit project
- Delete project

ProjectWorkspace.jsx
- Single project workspace
- Collaboration area
- Messages
- Notes
- Files

Tasks.jsx
- Task management
- Create task
- Update task
- Delete task

Calendar.jsx
- Event calendar
- Event management

Team.jsx
- Team members
- Invitations
- Sticky notes

Settings.jsx
- User profile settings
- Profile updates

Login.jsx
- User login

SignUp.jsx
- User registration

---

## Routing

Defined in App.jsx

Public Routes:
- /login
- /signup

Protected Routes:
- /
- /projects
- /projects/:id/workspace
- /tasks
- /calendar
- /team
- /settings

Authentication Guard:
- Checks JWT token in localStorage
- Redirects to login if token missing

---

## API Layer

Location:
frontend/src/services/api.js

Purpose:
Single centralized API communication layer.

Features:
- Axios instance
- JWT injection
- Automatic 401 handling
- Redirect to login when token expires

---

# API Methods Used by Frontend

Authentication

POST /api/auth/register
- Create user account

POST /api/auth/login
- Authenticate user
- Returns JWT token

GET /api/auth/me
- Get current user

PUT /api/auth/profile
- Update profile

Projects

GET /api/projects
GET /api/projects/:id
POST /api/projects
PUT /api/projects/:id
DELETE /api/projects/:id

Tasks

GET /api/tasks
POST /api/tasks
PUT /api/tasks/:id
DELETE /api/tasks/:id

Activities

GET /api/activities
POST /api/activities

Events

GET /api/events
POST /api/events
DELETE /api/events/:id

Team

GET /api/team/members
POST /api/team/members

GET /api/team/notes
POST /api/team/notes
DELETE /api/team/notes/:id

Collaboration

GET /api/collab/projects/:projectId/messages

GET /api/collab/projects/:projectId/notes

POST /api/collab/upload

---

# Backend Documentation

Backend Entry Point:
backend/src/server.js

Responsibilities:
- Express server creation
- Database connection
- Middleware registration
- Route registration
- Socket.IO initialization

---

## Backend Dependencies

express
- HTTP server

mongoose
- MongoDB ODM

jsonwebtoken
- Authentication

bcrypt
- Password hashing

cors
- Cross-origin requests

dotenv
- Environment variables

multer
- File uploads

socket.io
- Real-time communication

mongodb
- Native MongoDB driver

---

# Database Models

User.js
Stores:
- name
- email
- password
- role
- profileImage
- preferences

Used For:
- Authentication
- Profile Management

Project.js
Stores:
- Project metadata
- Collaborators
- Ownership

Task.js
Stores:
- Task details
- Status
- Priority
- Assignment

Activity.js
Stores:
- Audit logs
- Activity history

Event.js
Stores:
- Calendar events

TeamMember.js
Stores:
- Team information

ProjectMember.js
Stores:
- Project-user mappings

ProjectNote.js
Stores:
- Project notes

StickyNote.js
Stores:
- Team sticky notes

Message.js
Stores:
- Real-time messages

ChatRoom.js
Stores:
- Chat channels

---

# Controllers

Controllers contain business logic.

authController.js

registerUser()
- Create account
- Generate JWT
- Auto-map invited members

loginUser()
- Verify credentials
- Return JWT

getMe()
- Return current user

updateProfile()
- Update user profile
- Sync related collections

---

projectController.js

getProjects()
- Fetch projects

getProjectById()
- Fetch single project

createProject()
- Create project

updateProject()
- Update project

deleteProject()
- Remove project

---

taskController.js

getTasks()
- Fetch tasks

createTask()
- Create task

updateTask()
- Update task

deleteTask()
- Delete task

---

activityController.js

getActivities()
- Activity feed

createActivity()
- Create activity record

---

eventController.js

getEvents()
- Fetch events

createEvent()
- Create event

deleteEvent()
- Remove event

---

teamController.js

getTeamMembers()
- Team directory

inviteTeamMember()
- Add member

getStickyNotes()
- Fetch notes

createStickyNote()
- Create note

deleteStickyNote()
- Delete note

---

collabController.js

getMessages()
- Project chat history

getNotes()
- Project notes

uploadFile()
- File upload handling

---

# Routes Layer

Routes map URLs to controllers.

authRoutes.js
projectRoutes.js
taskRoutes.js
activityRoutes.js
eventRoutes.js
teamRoutes.js
collabRoutes.js

Flow:

Request
→ Route
→ Controller
→ Model
→ MongoDB
→ Response

---

# Authentication Flow

1. User Login
2. Credentials validated
3. JWT generated
4. Token returned
5. Frontend stores token
6. Axios attaches token
7. Middleware validates token

Middleware:
authMiddleware.js

Purpose:
- Protect private APIs
- Extract user from token

---

# Real-Time System

Location:
socketHandler.js

Technology:
Socket.IO

Purpose:
- Live collaboration
- Messaging
- Real-time workspace updates

Flow:

Client A
→ Socket Event
→ Server
→ Broadcast
→ Client B

---

# File Upload Flow

Frontend
→ FormData

POST /api/collab/upload

Backend
→ Multer

Stored in:
backend/uploads/

Returns:
- Uploaded file URL

---

# Data Flow Example

Create Task

Frontend Form
→ API Layer

POST /api/tasks

→ taskRoutes.js

→ taskController.js

→ Task Model

→ MongoDB

→ Response JSON

→ Frontend State Update

---

# Environment Variables

Backend

PORT=
MONGO_URI=
JWT_SECRET=

Frontend

API_URL=
ENV=

---

# Developer Onboarding Guide

Step 1:
Read App.jsx

Understand routing.

Step 2:
Read services/api.js

Understand API communication.

Step 3:
Read server.js

Understand backend startup.

Step 4:
Read routes folder

Understand endpoints.

Step 5:
Read controllers folder

Understand business logic.

Step 6:
Read models folder

Understand database structure.

Step 7:
Read socketHandler.js

Understand realtime features.

Recommended Reading Order:

App.jsx
→ api.js
→ server.js
→ routes
→ controllers
→ models
→ socketHandler.js

This order gives a complete understanding of the entire WorkBuddy system.
