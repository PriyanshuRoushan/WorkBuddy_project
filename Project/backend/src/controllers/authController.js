import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Identity from '../control/Identity.js';
import Company from '../control/Company.js';
import { getTenantModels, runWithTenant } from '../tenancy/tenantContext.js';
import { modelDefinitions } from '../tenancy/modelRegistry.js';

// Helper to generate JWT Token
const generateToken = (id, companyId) => {
  return jwt.sign({ id, companyId }, process.env.JWT_SECRET || 'doodlesaas_super_secret_key', {
    expiresIn: '30d'
  });
};

const sessionCookieBaseOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/'
});

const sessionCookieOptions = () => ({
  ...sessionCookieBaseOptions(),
  maxAge: 30 * 24 * 60 * 60 * 1000
});

const attachSession = (res, user, company) => {
  const token = generateToken(user._id, company._id);
  res.cookie('workbuddy_session', token, sessionCookieOptions());
  return token;
};

const publicUser = user => ({
  _id: user._id,
  name: user.name,
  displayName: user.displayName,
  email: user.email,
  employeeId: user.employeeId,
  accessRole: user.accessRole,
  role: user.accessRole,
  jobTitle: user.jobTitle,
  department: user.department,
  team: user.team,
  accountStatus: user.accountStatus,
  profileImage: user.profileImage,
  organizationId: user.organizationId
});

export const inspectInvitation = async (req, res) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const identity = await Identity.findOne({ invitationTokenHash: tokenHash, status: 'PENDING' });
    const company = identity ? await Company.findById(identity.companyId) : null;
    if (!identity || !company) return res.status(404).json({ message: 'This invitation is invalid or has expired' });
    const tenant = getTenantModels(company.databaseName, modelDefinitions);
    await runWithTenant({ ...tenant, company }, async () => {
      const invitation = await Invitation.findOne({ tokenHash, acceptedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } }).populate('userId', 'name email employeeId jobTitle accessRole');
      if (!invitation?.userId) return res.status(404).json({ message: 'This invitation is invalid or has expired' });
      res.json({ user: publicUser(invitation.userId), company: company.name, expiresAt: invitation.expiresAt });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptInvitation = async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters' });
  try {
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const identity = await Identity.findOne({ invitationTokenHash: tokenHash, status: 'PENDING' });
    const company = identity ? await Company.findById(identity.companyId) : null;
    if (!identity || !company) return res.status(404).json({ message: 'This invitation is invalid or has expired' });
    const tenant = getTenantModels(company.databaseName, modelDefinitions);
    await runWithTenant({ ...tenant, company }, async () => {
      const invitation = await Invitation.findOne({ tokenHash, acceptedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } });
      if (!invitation) return res.status(404).json({ message: 'This invitation is invalid or has expired' });
      const user = await User.findById(invitation.userId).select('+password');
      if (!user || user.accountStatus === 'SUSPENDED') return res.status(403).json({ message: 'This account is unavailable' });
      user.password = password; user.accountStatus = 'ACTIVE'; await user.save();
      invitation.acceptedAt = new Date(); await invitation.save();
      identity.status = 'ACTIVE'; identity.invitationTokenHash = undefined; await identity.save();
      res.json({ ...publicUser(user), companyId: company._id, token: attachSession(res, user, company) });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password, companySlug } = req.body;
  try {
    const selectedCompany = companySlug ? await Company.findOne({ slug: companySlug.toLowerCase().trim(), status: 'ACTIVE' }) : null;
    if (companySlug && !selectedCompany) return res.status(404).json({ message: 'Company workspace not found' });
    const identities = await Identity.find({ email: email.toLowerCase(), status: { $ne: 'SUSPENDED' }, ...(selectedCompany && { companyId: selectedCompany._id }) });
    if (identities.length !== 1) return res.status(identities.length > 1 ? 409 : 401).json({ message: identities.length > 1 ? 'This email belongs to multiple companies. Company selection is required.' : 'Invalid email or password' });
    const identity = identities[0];
    const company = await Company.findOne({ _id: identity.companyId, status: 'ACTIVE' });
    if (!company) return res.status(403).json({ message: 'Company workspace is not active' });
    const tenant = getTenantModels(company.databaseName, modelDefinitions);
    await runWithTenant({ ...tenant, company }, async () => {
      const user = await User.findById(identity.tenantUserId).select('+password');
      if (user?.accountStatus === 'PENDING') return res.status(403).json({ message: 'Accept your email invitation and create a password first' });
      if (user?.accountStatus === 'SUSPENDED') return res.status(403).json({ message: 'Your account has been suspended. Contact HR or your CEO.' });
      if (user && await user.matchPassword(password)) return res.json({ ...publicUser(user), companyId: company._id, companyName: company.name, token: attachSession(res, user, company) });
      res.status(401).json({ message: 'Invalid email or password' });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const restoreSession = async (req, res) => {
  const token = attachSession(res, req.user, req.company);
  res.json({ ...publicUser(req.user), companyId: req.company._id, companyName: req.company.name, token });
};

export const logoutUser = (req, res) => {
  res.clearCookie('workbuddy_session', sessionCookieBaseOptions());
  res.json({ message: 'Logged out' });
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('managerId', 'name employeeId jobTitle');
    if (user) {
      res.json({ ...user.toObject(), companyId: req.company?._id, companyName: req.company?.name });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const oldEmail = user.email;
    const oldImage = user.profileImage;

    if (req.body.displayName !== undefined && req.body.displayName.trim().length > 80) return res.status(400).json({ message: 'Display name must contain 80 characters or fewer' });
    user.displayName = req.body.displayName !== undefined ? req.body.displayName.trim() : user.displayName;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    user.profileImage = req.body.profileImage !== undefined ? req.body.profileImage : user.profileImage;
    user.sketchStyle = req.body.sketchStyle || user.sketchStyle;
    user.gridDensity = req.body.gridDensity !== undefined ? req.body.gridDensity : user.gridDensity;
    user.notifySparks = req.body.notifySparks !== undefined ? req.body.notifySparks : user.notifySparks;
    user.notifyScribbles = req.body.notifyScribbles !== undefined ? req.body.notifyScribbles : user.notifyScribbles;
    user.themePreference = req.body.themePreference || user.themePreference;

    if (req.body.password) {
      if (req.body.password.length < 8) return res.status(400).json({ message: 'New password must contain at least 8 characters' });
      if (!req.body.currentPassword || !(await user.matchPassword(req.body.currentPassword))) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    // Keep legacy avatar arrays in sync while the frontend migrates to ProjectMember.
    if (oldImage !== updatedUser.profileImage) {
      await Project.updateMany(
        { organizationId: updatedUser.organizationId, collaborators: oldImage },
        { $set: { "collaborators.$": updatedUser.profileImage } }
      );
    }

    await ProjectMember.updateMany(
      { organizationId: updatedUser.organizationId, userId: updatedUser._id },
      { email: updatedUser.email }
    );
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      displayName: updatedUser.displayName,
      email: updatedUser.email,
      role: updatedUser.accessRole,
      accessRole: updatedUser.accessRole,
      jobTitle: updatedUser.jobTitle,
      employeeId: updatedUser.employeeId,
      department: updatedUser.department,
      team: updatedUser.team,
      accountStatus: updatedUser.accountStatus,
      companyId: req.company?._id,
      companyName: req.company?.name,
      profileImage: updatedUser.profileImage,
      organizationId: updatedUser.organizationId,
      bio: updatedUser.bio,
      sketchStyle: updatedUser.sketchStyle,
      gridDensity: updatedUser.gridDensity,
      notifySparks: updatedUser.notifySparks,
      notifyScribbles: updatedUser.notifyScribbles,
      themePreference: updatedUser.themePreference,
      token: attachSession(res, updatedUser, req.company)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
