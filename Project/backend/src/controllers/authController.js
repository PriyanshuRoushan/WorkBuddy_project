import User from '../models/User.js';
import TeamMember from '../models/TeamMember.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import jwt from 'jsonwebtoken';

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'doodlesaas_super_secret_key', {
    expiresIn: '30d'
  });
};

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Resolve profileImage if they were invited in TeamMember
    const teamMember = await TeamMember.findOne({ email });
    let profileImage;
    if (teamMember) {
      profileImage = teamMember.profileImage;
    }

    const userFields = { name, email, password, role };
    if (profileImage) {
      userFields.profileImage = profileImage;
    }

    const user = await User.create(userFields);

    // Auto-create ProjectMember records for any projects they are already collaborators on
    if (profileImage) {
      const matchingProjects = await Project.find({ collaborators: profileImage });
      for (const project of matchingProjects) {
        await ProjectMember.create({
          projectId: project._id,
          userId: user._id,
          email: user.email,
          role: user.role
        }).catch(err => console.log('Auto project member mapping check skipped:', err.message));
      }
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const oldEmail = user.email;
    const oldImage = user.profileImage;

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    user.profileImage = req.body.profileImage || user.profileImage;
    user.sketchStyle = req.body.sketchStyle || user.sketchStyle;
    user.gridDensity = req.body.gridDensity !== undefined ? req.body.gridDensity : user.gridDensity;
    user.notifySparks = req.body.notifySparks !== undefined ? req.body.notifySparks : user.notifySparks;
    user.notifyScribbles = req.body.notifyScribbles !== undefined ? req.body.notifyScribbles : user.notifyScribbles;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    // 1. Sync update to TeamMember collection
    const tmUpdate = { name: updatedUser.name, email: updatedUser.email, profileImage: updatedUser.profileImage };
    await TeamMember.findOneAndUpdate({ email: oldEmail }, tmUpdate);

    // 2. Sync profile image inside Project.collaborators array for all projects
    if (oldImage !== updatedUser.profileImage) {
      await Project.updateMany(
        { collaborators: oldImage },
        { $set: { "collaborators.$": updatedUser.profileImage } }
      );
    }

    // 3. Sync changes inside ProjectMember objects
    await ProjectMember.updateMany(
      { userId: updatedUser._id },
      { email: updatedUser.email, role: updatedUser.role }
    );
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profileImage: updatedUser.profileImage,
      bio: updatedUser.bio,
      sketchStyle: updatedUser.sketchStyle,
      gridDensity: updatedUser.gridDensity,
      notifySparks: updatedUser.notifySparks,
      notifyScribbles: updatedUser.notifyScribbles,
      token: generateToken(updatedUser._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
