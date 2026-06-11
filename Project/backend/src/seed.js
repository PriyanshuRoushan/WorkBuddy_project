import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './models/Project.js';
import Task from './models/Task.js';
import Activity from './models/Activity.js';
import User from './models/User.js';
import Event from './models/Event.js';
import TeamMember from './models/TeamMember.js';
import StickyNote from './models/StickyNote.js';
import ChatRoom from './models/ChatRoom.js';
import Message from './models/Message.js';
import ProjectNote from './models/ProjectNote.js';
import ProjectMember from './models/ProjectMember.js';
import connectDB from './config/db.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Project.deleteMany();
    await Task.deleteMany();
    await Activity.deleteMany();
    await User.deleteMany();
    await Event.deleteMany();
    await TeamMember.deleteMany();
    await StickyNote.deleteMany();
    await ChatRoom.deleteMany();
    await Message.deleteMany();
    await ProjectNote.deleteMany();
    await ProjectMember.deleteMany();

    console.log('Database cleared!');

    // Seed default users for login (with Indian names)
    const seedUsers = [
      {
        name: 'Priyanshu Roushan',
        email: 'pm@workbuddy.com',
        password: 'password123',
        role: 'Project Manager',
        profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsZ0jIxXOiZ2uDS3ufAquNnjv6jtAm2wpuKW69oHGIno88yZC9v2kAC2iGD5rQRd7kNDN3i50dVdYV6gU2m7RAn1b1iJ1Hlh3GdMdZthGITUsnmjxY0FNZrXtSNpIbbwP1UbegW1AaHUyu90ei1Phj9WZ8aq_2WrlB-sm3Z7Z2DV56WJFbxfyY2QA28DI8ngzGku_kaTWuIlIdFg911bCD9zyG1MBYppMZhd0XEIEFSKTAnSOsNV2ohUGuItQACB6d2WWaYOBucFoq'
      },
      {
        name: 'Arjun Mehta',
        email: 'frontend@workbuddy.com',
        password: 'password123',
        role: 'Frontend Dev',
        profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqk97GopLCY0b1v6Sz4G0MTbOTGr4dRJXMhL3BhPT8g_2AGlm7mW_jaJlHkGNyRn5pB9F2g3C0UuE5oCoyrsUd5BmfVo3AAJ29AGQ1uzD2h-uEzOPdjnfmjdX0UQEbbvvI6KlB0dFV1DF8g7_SzvtZeuAhi6Cibl4V1XcBCjZzobzMdFHQtCKrLTlSWmLNywjfg9zcjQ1W97h_EW0WviC9vCcxr-zYrz0w1UU-7pYfobtri1KG4msxYGQdi8XaMvHFOWGlVSL7wUPJ'
      },
      {
        name: 'Diya Sharma',
        email: 'backend@workbuddy.com',
        password: 'password123',
        role: 'Backend Dev',
        profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvuOi_Ni3o32KuIfRvex6eoTCrmzdBDjJL1ytsnvfThdusWWU4sR9Rz2ddbB8VYcqKMEg-G8yXZUIgWmiZ8A3dYFu_TY9j3VYr0_Y49czlynKT87qDYR6ZjcTajrrrfpFR61scpljPGKmo-DP8p94o5z0ZtvbQp8MXts4BAxX8Lps3UUw1b3aAe4_u5YnHl0ALw3HIs3uFhMVuONuzdLfyayFNZBDi9haUdXJ6yazAhh-tbQ0fbviOiYYrnW_FfpWql6BMVkflb-Rg'
      },
      {
        name: 'Kabir Malhotra',
        email: 'uiux@workbuddy.com',
        password: 'password123',
        role: 'UI UX Person',
        profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5nEVLFQcZqopCODSHhTrMQlmvxKsfKeudUarnkcJ2SOhBf7EfdNNdUPQaHOin_G2_42k2CS78LBmioK8OVeLM5CAGEeUDKSwXMwdDVo2KHOSW7yAWWDzKWz6nwfnKflt_W2XK11YpwLN11lx1EvvApvLjabMDMunlQTNVSdUU0KVHZYxUH2G_mBZcydki5lWMCes_HyrExPruKmBbSHbX_AYrM_fEajJyNAbOii0H6Trlf1QvjbYf_iXEoiyBjne3o40OWBp5j9u-'
      },
      {
        name: 'Neha Patil',
        email: 'qa@workbuddy.com',
        password: 'password123',
        role: 'Observer',
        profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB71TuH0oiu-nqLEzwiFLKoldn3tQuLnjk-WJv-zwjy5XW0SyvUt7nJhIQe2U05khd47pxzPVY9mnjXfILye5gO84PjLh8MftCVPfA-7T1RB9OwfyUHYaeSmuxlvnEI-FzS3LNt6xk5GlpOsCm_9cxMmV1bGk4E1W8WvgN4lWv8YjHfv8h1BuNUh3KjhU2YXvEYAO7ydlLKdgbU7GvG1qpqVMU4jnfHRn-RUfkFgwiJSmoMCpwhimp8ENGav_Gt81VyN2lhDcFYbMoH'
      },
      {
        name: 'Aarav Gupta',
        email: 'creator@workbuddy.com',
        password: 'password123',
        role: 'Admin',
        profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCKlzErB5bTRryWZ9kKt0oiK9DwbcHdLdJB9qybJhLy-dzJ5DM31amBATHedwlN3X9J7VD96TmCF3mFQcMczf8WTwvXqOHWAd44WpluP6efrp03TZotpx9kJuc2IrqAGsXcS_K6_GLEdcSkeQNN1f4J5thBvpNgg_chr5QC74edErxb-JF3PPjxApBzJtKa-NfCvyS-T1sD7yuzJb6-GlhxYHfE4AfkjDPYPfznuzdH46FkMEgleVV-s5nRecyZXxMB8TGuAAsSsJC'
      }
    ];

    for (const u of seedUsers) {
      await User.create(u);
    }
    console.log('All company users seeded: pm@workbuddy.com, frontend@workbuddy.com, backend@workbuddy.com, uiux@workbuddy.com, qa@workbuddy.com, creator@workbuddy.com (Password: password123)');

    // Seed Projects
    const projects = [
      {
        title: 'Phoenix Rebrand',
        description: 'Modernizing the visual identity for the tech-first logistics giant. Finalizing vector assets.',
        progress: 100,
        status: 'DONE',
        collaborators: [
          seedUsers[1].profileImage,
          seedUsers[3].profileImage
        ]
      },
      {
        title: 'Urban Oasis App',
        description: 'Developing the UI flow for a garden-sharing social network. Focusing on high-fidelity wireframes.',
        progress: 45,
        status: 'IN PROGRESS',
        collaborators: [
          seedUsers[1].profileImage,
          seedUsers[3].profileImage,
          seedUsers[2].profileImage
        ]
      },
      {
        title: 'Lunar Coffee Branding',
        description: 'Packaging design for premium moonlight-roasted beans. Waiting for client sign-off on the gold foil.',
        progress: 82,
        status: 'REVIEW',
        collaborators: [
          seedUsers[2].profileImage,
          seedUsers[4].profileImage
        ]
      },
      {
        title: 'The Solstice Project',
        description: 'A personal exploration into generative typography using hand-sketched primitives.',
        progress: 0,
        status: 'DRAFT',
        collaborators: []
      }
    ];

    const pmForCreator = await User.findOne({ email: 'pm@workbuddy.com' });
    const projectsWithCreator = projects.map(p => ({ ...p, creator: pmForCreator._id }));
    await Project.insertMany(projectsWithCreator);
    console.log('Projects seeded!');

    // Seed Tasks
    const tasks = [
      {
        title: 'Brainstorm UI elements',
        category: 'DESIGN',
        status: 'TO DO',
        progress: 0,
        assignedTo: 'uiux@workbuddy.com',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Fix border rendering',
        category: 'BUG',
        status: 'TO DO',
        progress: 0,
        assignedTo: 'frontend@workbuddy.com',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'API Integration',
        category: 'API',
        status: 'IN PROGRESS',
        progress: 45,
        assignedTo: 'backend@workbuddy.com',
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Styleguide setup',
        category: 'DESIGN',
        status: 'DONE',
        progress: 100,
        assignedTo: 'frontend@workbuddy.com',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      // Tasks for pm@workbuddy.com (Priyanshu Roushan)
      {
        title: 'Sprint planning session',
        category: 'DESIGN',
        status: 'IN PROGRESS',
        progress: 50,
        assignedTo: 'pm@workbuddy.com',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Review UI mockups',
        category: 'DESIGN',
        status: 'TO DO',
        progress: 0,
        assignedTo: 'pm@workbuddy.com',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Write product spec',
        category: 'DESIGN',
        status: 'DONE',
        progress: 100,
        assignedTo: 'pm@workbuddy.com',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      // Additional tasks for other users
      {
        title: 'Implement neubrutalist buttons',
        category: 'DESIGN',
        status: 'IN PROGRESS',
        progress: 30,
        assignedTo: 'frontend@workbuddy.com',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Setup mongodb indexes',
        category: 'API',
        status: 'DONE',
        progress: 100,
        assignedTo: 'backend@workbuddy.com',
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Optimize API response time',
        category: 'BUG',
        status: 'IN PROGRESS',
        progress: 60,
        assignedTo: 'backend@workbuddy.com',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Wireframe new settings layout',
        category: 'DESIGN',
        status: 'IN PROGRESS',
        progress: 75,
        assignedTo: 'uiux@workbuddy.com',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Write end-to-end signup tests',
        category: 'BUG',
        status: 'TO DO',
        progress: 0,
        assignedTo: 'qa@workbuddy.com',
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Deploy beta build',
        category: 'API',
        status: 'IN PROGRESS',
        progress: 15,
        assignedTo: 'creator@workbuddy.com',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      }
    ];

    await Task.insertMany(tasks);
    console.log('Tasks seeded!');

    // Seed Activities (with Indian names)
    const activities = [
      {
        user: 'Arjun',
        action: 'added a new card to',
        target: 'Sprint 4',
        type: 'add',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        user: 'Diya',
        action: 'commented on',
        target: 'UI Elements',
        details: '"Love the hand-drawn feel here!"',
        type: 'comment',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        user: 'System',
        action: 'completed backup',
        target: 'system',
        type: 'system',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];

    await Activity.insertMany(activities);
    console.log('Activities seeded!');

    // Seed Calendar Events for October 2024
    const events = [
      {
        title: 'Sketching Workshop 🎨',
        description: 'Re-sketching the logo concepts with the core team.',
        date: new Date(2024, 9, 2),
        color: 'secondary-container',
        collaborators: []
      },
      {
        title: 'Launch Party 🚀',
        description: 'Launching the beta version of the portal.',
        date: new Date(2024, 9, 4),
        color: 'tertiary-container',
        collaborators: []
      },
      {
        title: 'Weekly Sync ☕',
        description: 'Catching up on general updates.',
        date: new Date(2024, 9, 7),
        color: 'primary-container',
        collaborators: []
      },
      {
        title: 'Client Call: Sparkle',
        description: 'Initial review of designs for client Sparkle.',
        date: new Date(2024, 9, 8),
        color: 'secondary-container',
        collaborators: []
      },
      {
        title: 'Deadline: Mockups',
        description: 'Submission of mockup drafts.',
        date: new Date(2024, 9, 11),
        color: 'error-container',
        collaborators: []
      },
      {
        title: 'Nature Hike 🌿',
        description: 'Team outing!',
        date: new Date(2024, 9, 14),
        color: 'tertiary-container',
        collaborators: []
      },
      {
        title: 'Presentation Prep',
        description: 'Assembling slides for the stakeholder pitch.',
        date: new Date(2024, 9, 17),
        color: 'primary-container',
        collaborators: []
      }
    ];

    await Event.insertMany(events);
    console.log('Calendar events seeded!');

    // Seed Team Members (with Indian names)
    const members = [
      {
        name: 'Priyanshu Roushan',
        role: 'Project Manager',
        email: 'pm@workbuddy.com',
        profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsZ0jIxXOiZ2uDS3ufAquNnjv6jtAm2wpuKW69oHGIno88yZC9v2kAC2iGD5rQRd7kNDN3i50dVdYV6gU2m7RAn1b1iJ1Hlh3GdMdZthGITUsnmjxY0FNZrXtSNpIbbwP1UbegW1AaHUyu90ei1Phj9WZ8aq_2WrlB-sm3Z7Z2DV56WJFbxfyY2QA28DI8ngzGku_kaTWuIlIdFg911bCD9zyG1MBYppMZhd0XEIEFSKTAnSOsNV2ohUGuItQACB6d2WWaYOBucFoq',
        themePreference: 'light'
      },
      {
        name: 'Arjun Mehta',
        role: 'Frontend Dev',
        email: 'frontend@workbuddy.com',
        profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqk97GopLCY0b1v6Sz4G0MTbOTGr4dRJXMhL3BhPT8g_2AGlm7mW_jaJlHkGNyRn5pB9F2g3C0UuE5oCoyrsUd5BmfVo3AAJ29AGQ1uzD2h-uEzOPdjnfmjdX0UQEbbvvI6KlB0dFV1DF8g7_SzvtZeuAhi6Cibl4V1XcBCjZzobzMdFHQtCKrLTlSWmLNywjfg9zcjQ1W97h_EW0WviC9vCcxr-zYrz0w1UU-7pYfobtri1KG4msxYGQdi8XaMvHFOWGlVSL7wUPJ',
        themePreference: 'light'
      },
      {
        name: 'Diya Sharma',
        role: 'Backend Dev',
        email: 'backend@workbuddy.com',
        profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvuOi_Ni3o32KuIfRvex6eoTCrmzdBDjJL1ytsnvfThdusWWU4sR9Rz2ddbB8VYcqKMEg-G8yXZUIgWmiZ8A3dYFu_TY9j3VYr0_Y49czlynKT87qDYR6ZjcTajrrrfpFR61scpljPGKmo-DP8p94o5z0ZtvbQp8MXts4BAxX8Lps3UUw1b3aAe4_u5YnHl0ALw3HIs3uFhMVuONuzdLfyayFNZBDi9haUdXJ6yazAhh-tbQ0fbviOiYYrnW_FfpWql6BMVkflb-Rg',
        themePreference: 'dark'
      },
      {
        name: 'Kabir Malhotra',
        role: 'UI UX Person',
        email: 'uiux@workbuddy.com',
        profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5nEVLFQcZqopCODSHhTrMQlmvxKsfKeudUarnkcJ2SOhBf7EfdNNdUPQaHOin_G2_42k2CS78LBmioK8OVeLM5CAGEeUDKSwXMwdDVo2KHOSW7yAWWDzKWz6nwfnKflt_W2XK11YpwLN11lx1EvvApvLjabMDMunlQTNVSdUU0KVHZYxUH2G_mBZcydki5lWMCes_HyrExPruKmBbSHbX_AYrM_fEajJyNAbOii0H6Trlf1QvjbYf_iXEoiyBjne3o40OWBp5j9u-',
        themePreference: 'light'
      },
      {
        name: 'Neha Patil',
        role: 'QA Engineer',
        email: 'qa@workbuddy.com',
        profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB71TuH0oiu-nqLEzwiFLKoldn3tQuLnjk-WJv-zwjy5XW0SyvUt7nJhIQe2U05khd47pxzPVY9mnjXfILye5gO84PjLh8MftCVPfA-7T1RB9OwfyUHYaeSmuxlvnEI-FzS3LNt6xk5GlpOsCm_9cxMmV1bGk4E1W8WvgN4lWv8YjHfv8h1BuNUh3KjhU2YXvEYAO7ydlLKdgbU7GvG1qpqVMU4jnfHRn-RUfkFgwiJSmoMCpwhimp8ENGav_Gt81VyN2lhDcFYbMoH',
        themePreference: 'dark'
      }
    ];

    await TeamMember.insertMany(members);
    console.log('Team members seeded!');

    // Seed Team Wall Sticky Notes (with Indian authors)
    const stickyNotes = [
      {
        content: "Don't forget coffee run at 3pm! ☕️",
        author: 'diya_s',
        color: 'primary-container'
      },
      {
        content: 'New design system update is LIVE! Check Figma. 🚀',
        author: 'arjun_m',
        color: 'tertiary-container'
      },
      {
        content: 'Happy Birthday Kabir! 🎂 🎉',
        author: 'the_crew',
        color: 'secondary-container'
      }
    ];

    await StickyNote.insertMany(stickyNotes);
    console.log('Sticky notes seeded!');

    // Seed project collaboration data
    console.log('Seeding project collaboration data...');
    const pm = await User.findOne({ email: 'pm@workbuddy.com' });
    const frontend = await User.findOne({ email: 'frontend@workbuddy.com' });
    const backend = await User.findOne({ email: 'backend@workbuddy.com' });
    const uiux = await User.findOne({ email: 'uiux@workbuddy.com' });
    const qa = await User.findOne({ email: 'qa@workbuddy.com' });

    const phoenix = await Project.findOne({ title: 'Phoenix Rebrand' });
    const urban = await Project.findOne({ title: 'Urban Oasis App' });
    const lunar = await Project.findOne({ title: 'Lunar Coffee Branding' });
    const solstice = await Project.findOne({ title: 'The Solstice Project' });

    if (phoenix && urban && lunar && solstice) {
      // 1. Create Chat Rooms
      const roomPhoenix = await ChatRoom.create({ projectId: phoenix._id, name: 'Phoenix Rebrand Collaboration Chat' });
      const roomUrban = await ChatRoom.create({ projectId: urban._id, name: 'Urban Oasis App Collaboration Chat' });
      const roomLunar = await ChatRoom.create({ projectId: lunar._id, name: 'Lunar Coffee Branding Collaboration Chat' });
      const roomSolstice = await ChatRoom.create({ projectId: solstice._id, name: 'The Solstice Project Collaboration Chat' });
      console.log('Collaboration Chat Rooms seeded!');

      // 2. Create Project Members
      const allProjects = [phoenix, urban, lunar, solstice];
      for (const p of allProjects) {
        await ProjectMember.create({
          projectId: p._id,
          userId: pm._id,
          email: pm.email,
          role: pm.role
        });
      }

      // Phoenix Members
      await ProjectMember.create({ projectId: phoenix._id, userId: frontend._id, email: frontend.email, role: frontend.role });
      await ProjectMember.create({ projectId: phoenix._id, userId: uiux._id, email: uiux.email, role: uiux.role });

      // Urban Members
      await ProjectMember.create({ projectId: urban._id, userId: frontend._id, email: frontend.email, role: frontend.role });
      await ProjectMember.create({ projectId: urban._id, userId: uiux._id, email: uiux.email, role: uiux.role });
      await ProjectMember.create({ projectId: urban._id, userId: backend._id, email: backend.email, role: backend.role });

      // Lunar Members
      await ProjectMember.create({ projectId: lunar._id, userId: backend._id, email: backend.email, role: backend.role });
      await ProjectMember.create({ projectId: lunar._id, userId: qa._id, email: qa.email, role: qa.role });
      console.log('Project Members seeded!');

      // 3. Create Messages
      const m1 = await Message.create({
        roomId: roomPhoenix._id,
        sender: pm._id,
        senderName: pm.name,
        senderRole: pm.role,
        content: "Welcome to the Phoenix Rebrand collaboration workspace! Let's get the design system updated.",
        readBy: [pm._id, frontend._id, uiux._id]
      });
      const m2 = await Message.create({
        roomId: roomPhoenix._id,
        sender: uiux._id,
        senderName: uiux.name,
        senderRole: uiux.role,
        content: "Already on it! I've uploaded the new typography guidelines on the whiteboard.",
        replyTo: m1._id,
        readBy: [pm._id, frontend._id, uiux._id]
      });
      await Message.create({
        roomId: roomPhoenix._id,
        sender: frontend._id,
        senderName: frontend.name,
        senderRole: frontend.role,
        content: "Looks clean! I will start implementing the typography variables today.",
        readBy: [pm._id, frontend._id, uiux._id]
      });

      await Message.create({
        roomId: roomUrban._id,
        sender: pm._id,
        senderName: pm.name,
        senderRole: pm.role,
        content: "Let's align on the high-fidelity wireframes here.",
        readBy: [pm._id, uiux._id, frontend._id, backend._id]
      });
      console.log('Collaboration Messages seeded!');

      // 4. Create Project Notes (Whiteboard notes)
      await ProjectNote.create({
        noteId: 'note-phoenix-1',
        projectId: phoenix._id,
        createdBy: uiux.name,
        content: "Typography Guidelines:\n- Primary: Outfit (700 for headings)\n- Body: Inter (400)\n- Keep spacing tight & clean",
        positionX: 120,
        positionY: 80,
        width: 220,
        height: 180,
        color: 'tertiary-container',
        isPinned: true
      });
      await ProjectNote.create({
        noteId: 'note-phoenix-2',
        projectId: phoenix._id,
        createdBy: pm.name,
        content: "Sprint 1 Goals:\n- Modernize logo vector\n- Finalize color tokens\n- Draft Figma component set",
        positionX: 400,
        positionY: 100,
        width: 220,
        height: 180,
        color: 'primary-container',
        isPinned: false
      });

      await ProjectNote.create({
        noteId: 'note-urban-1',
        projectId: urban._id,
        createdBy: uiux.name,
        content: "Figma wireframe link: https://figma.com/file/urban-oasis-mockups",
        positionX: 100,
        positionY: 100,
        width: 220,
        height: 150,
        color: 'secondary-container',
        isPinned: false
      });
      console.log('Project Notes seeded!');
    }

    console.log('Data successfully seeded! Exiting...');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
