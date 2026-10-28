import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { tenantModelProxy } from '../tenancy/tenantContext.js';

const userSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  roleTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoleTemplate'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    select: false
  },
  accessRole: {
    type: String,
    enum: ['CEO', 'HR', 'MANAGER', 'TEAM_HEAD', 'EMPLOYEE', 'VIEWER'],
    default: 'EMPLOYEE',
    index: true
  },
  jobTitle: {
    type: String,
    trim: true,
    default: 'Employee'
  },
  employeeId: {
    type: String,
    trim: true,
    uppercase: true
  },
  accountStatus: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED'],
    default: 'PENDING',
    index: true
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },
  team: {
    type: String,
    trim: true,
    default: ''
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reportingHistory: [{
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    department: { type: String, default: '' },
    team: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now }
  }],
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  profileImage: {
    type: String,
    default: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCKlzErB5bTRryWZ9kKt0oiK9DwbcHdLdJB9qybJhLy-dzJ5DM31amBATHedwlN3X9J7VD96TmCF3mFQcMczf8WTwvXqOHWAd44WpluP6efrp03TZotpx9kJuc2IrqAGsXcS_K6_GLEdcSkeQNN1f4J5thBvpNgg_chr5QC74edErxb-JF3PPjxApBzJtKa-NfCvyS-T1sD7yuzJb6-GlhxYHfE4AfkjDPYPfznuzdH46FkMEgleVV-s5nRecyZXxMB8TGuAAsSsJC'
  },
  bio: {
    type: String,
    default: ''
  },
  sketchStyle: {
    type: String,
    default: 'Pencil'
  },
  gridDensity: {
    type: Number,
    default: 50
  },
  notifySparks: {
    type: Boolean,
    default: true
  },
  notifyScribbles: {
    type: Boolean,
    default: false
  },
  dynamicProfile: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  aggregatedMetrics: {
    normalizedSkillScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    normalizedRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    synergyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    currentWorkload: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  topCollaborators: [{
    peerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    synergyScore: {
      type: Number,
      default: 0
    },
    projectsWorkedTogether: {
      type: Number,
      default: 0
    }
  }],
  themePreference: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  }
}, {
  timestamps: true
});

userSchema.index({ organizationId: 1, email: 1 }, { unique: true });
userSchema.index({ organizationId: 1, employeeId: 1 }, { unique: true, sparse: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (!this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default tenantModelProxy('User', userSchema, User);
