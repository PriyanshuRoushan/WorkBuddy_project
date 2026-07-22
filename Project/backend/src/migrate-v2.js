import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Organization from './models/Organization.js';
import User from './models/User.js';
import TeamMember from './models/TeamMember.js';
import Project from './models/Project.js';
import ProjectMember from './models/ProjectMember.js';
import Task from './models/Task.js';
import Activity from './models/Activity.js';
import Event from './models/Event.js';
import StickyNote from './models/StickyNote.js';
import ChatRoom from './models/ChatRoom.js';
import Message from './models/Message.js';
import ProjectNote from './models/ProjectNote.js';

dotenv.config();

const migrate = async () => {
  await connectDB();

  const organization = await Organization.findOneAndUpdate(
    { name: 'WorkBuddy Studio' },
    {
      $setOnInsert: {
        name: 'WorkBuddy Studio',
        industry: 'Creative Collaboration'
      }
    },
    { upsert: true, new: true }
  );

  await User.updateMany(
    { organizationId: { $exists: false } },
    { $set: { organizationId: organization._id } }
  );

  // Merge legacy directory-only teammates into User as pending accounts.
  const legacyMembers = await TeamMember.find();
  for (const member of legacyMembers) {
    const existingUser = await User.findOne({
      organizationId: organization._id,
      email: member.email
    });
    if (!existingUser) {
      await User.create({
        organizationId: organization._id,
        name: member.name,
        email: member.email,
        password: `migrated-${mongoose.Types.ObjectId()}`,
        role: member.role,
        profileImage: member.profileImage,
        themePreference: member.themePreference
      });
    }
  }

  await Project.updateMany(
    { organizationId: { $exists: false } },
    { $set: { organizationId: organization._id } }
  );

  const projects = await Project.find({ organizationId: organization._id });
  for (const project of projects) {
    const creatorId = project.creatorId || project.creator;
    if (creatorId) {
      project.creatorId = creatorId;
      await project.save();
      const creator = await User.findById(creatorId);
      if (creator) {
        await ProjectMember.updateOne(
          { organizationId: organization._id, projectId: project._id, userId: creator._id },
          {
            $set: { email: creator.email, role: 'Admin' },
            $setOnInsert: {
              organizationId: organization._id,
              projectId: project._id,
              userId: creator._id
            }
          },
          { upsert: true }
        );
      }
    }

    const legacyCollaborators = await User.find({
      organizationId: organization._id,
      profileImage: { $in: project.collaborators || [] }
    });
    for (const user of legacyCollaborators) {
      await ProjectMember.updateOne(
        { organizationId: organization._id, projectId: project._id, userId: user._id },
        {
          $set: { email: user.email, role: 'Editor' },
          $setOnInsert: {
            organizationId: organization._id,
            projectId: project._id,
            userId: user._id
          }
        },
        { upsert: true }
      );
    }
  }

  await ProjectMember.updateMany(
    { organizationId: { $exists: false } },
    { $set: { organizationId: organization._id } }
  );

  const legacyTasks = await Task.collection.find({
    $or: [
      { organizationId: { $exists: false } },
      { assignedTo: { $type: 'string' } }
    ]
  }).toArray();
  for (const task of legacyTasks) {
    const update = { organizationId: organization._id };
    const legacyEmail = typeof task.assignedTo === 'string' ? task.assignedTo : task.assignedToEmail;
    if (legacyEmail) {
      const assignee = await User.findOne({
        organizationId: organization._id,
        email: legacyEmail.toLowerCase()
      });
      if (assignee) {
        update.assignedTo = assignee._id;
        update.assignedToEmail = assignee.email;
      }
    }
    if (task.status === 'DONE' && !task.completedAt) {
      update.completedAt = task.updatedAt || new Date();
    }
    await Task.collection.updateOne({ _id: task._id }, { $set: update });
  }

  const tenantModels = [Activity, Event, StickyNote, ChatRoom, Message, ProjectNote];
  for (const Model of tenantModels) {
    await Model.updateMany(
      { organizationId: { $exists: false } },
      { $set: { organizationId: organization._id } }
    );
  }

  await Message.updateMany(
    { senderId: { $exists: false } },
    [{ $set: { senderId: '$sender' } }]
  );

  console.log(`WorkBuddy v2 migration complete for organization ${organization._id}`);
  await mongoose.disconnect();
};

migrate().catch(async (error) => {
  console.error('WorkBuddy v2 migration failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
