import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Project Manager', 'Frontend Dev', 'Backend Dev', 'UI UX Person', 'Observer', 'Admin', 'Designer'],
    default: 'Designer'
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
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
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
export default User;
