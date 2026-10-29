import crypto from 'crypto';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Invitation from '../models/Invitation.js';
import { generateEmployeeId } from '../utils/employeeId.js';
import { sendInvitationEmail } from '../utils/mailer.js';
import { ACCESS_ROLES, isRoleBelow } from '../config/accessControl.js';
import Identity from '../control/Identity.js';

const safeFields = '-password';

export const listPeople = async (req, res) => {
  try {
    const users = await User.find({ organizationId: req.user.organizationId })
      .select(safeFields)
      .populate('managerId', 'name employeeId')
      .sort({ name: 1 });
    res.json(users);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const invitePerson = async (req, res) => {
  const { name, email, accessRole = 'EMPLOYEE', jobTitle = 'Employee', department = '', team = '', managerId = null } = req.body;
  if (!name?.trim() || !email?.trim()) return res.status(400).json({ message: 'Name and email are required' });
  if (!ACCESS_ROLES.includes(accessRole)) return res.status(400).json({ message: 'Invalid access role' });
  if (!isRoleBelow(req.user.accessRole, accessRole)) {
    return res.status(403).json({ message: 'You can only invite employees with a role below your own' });
  }
  try {
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ organizationId: req.user.organizationId, email: normalizedEmail })) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }
    const organization = await Organization.findById(req.user.organizationId);
    const employeeId = await generateEmployeeId(organization);
    const user = await User.create({
      organizationId: organization._id, name: name.trim(), email: normalizedEmail,
      employeeId, accessRole, jobTitle, department, team, managerId: managerId || null,
      accountStatus: 'PENDING', invitedBy: req.user._id
    });
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await Invitation.create({ organizationId: organization._id, userId: user._id, email: normalizedEmail, tokenHash, invitedBy: req.user._id, expiresAt });
    if (req.company) await Identity.create({ email: normalizedEmail, companyId: req.company._id, tenantUserId: user._id, status: 'PENDING', invitationTokenHash: tokenHash });
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
    const inviteUrl = `${frontendUrl}/accept-invite/${rawToken}`;
    let mail;
    try {
      mail = await sendInvitationEmail({
        to: normalizedEmail,
        name: user.name,
        companyName: organization.name,
        employeeRole: user.jobTitle || user.accessRole,
        inviterName: req.user.displayName || req.user.name,
        inviterDesignation: req.user.jobTitle || req.user.accessRole,
        contactEmail: req.company?.ownerEmail || req.user.email || process.env.MAIL_REPLY_TO,
        inviteUrl,
        expiresAt
      });
    }
    catch (error) {
      await Invitation.deleteOne({ tokenHash });
      if (req.company) await Identity.deleteOne({ companyId: req.company._id, tenantUserId: user._id });
      await User.deleteOne({ _id: user._id });
      throw error;
    }
    res.status(201).json({ user, emailDelivered: mail.delivered, ...(mail.developmentUrl && { developmentInviteUrl: mail.developmentUrl }) });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const updatePerson = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!user) return res.status(404).json({ message: 'Employee not found' });
    if (!isRoleBelow(req.user.accessRole, user.accessRole)) {
      return res.status(403).json({ message: 'You cannot manage an employee at your level or above' });
    }
    if (req.user.accessRole === 'TEAM_HEAD') {
      if (!req.user.team || user.team !== req.user.team) return res.status(403).json({ message: 'Team Heads can update job titles only within their own team' });
      user.jobTitle = req.body.jobTitle ?? user.jobTitle;
      await user.save();
      return res.json(await user.populate('managerId', 'name employeeId'));
    }
    if (req.body.accessRole !== undefined) {
      if (!ACCESS_ROLES.includes(req.body.accessRole)) return res.status(400).json({ message: 'Invalid access role' });
      if (!isRoleBelow(req.user.accessRole, req.body.accessRole)) {
        return res.status(403).json({ message: 'You cannot assign a role at your level or above' });
      }
    }
    const previousAssignment = { managerId: user.managerId, department: user.department, team: user.team };
    const allowed = ['accessRole', 'jobTitle', 'department', 'team'];
    for (const field of allowed) if (req.body[field] !== undefined) user[field] = req.body[field];
    const assignmentChanged = (req.body.managerId !== undefined && String(previousAssignment.managerId || '') !== String(req.body.managerId || ''))
      || (req.body.department !== undefined && previousAssignment.department !== req.body.department)
      || (req.body.team !== undefined && previousAssignment.team !== req.body.team);
    if (assignmentChanged) {
      user.reportingHistory.push({ ...previousAssignment, changedBy: req.user._id });
    }
    if (req.body.managerId !== undefined) {
      user.managerId = req.body.managerId || null;
    }
    await user.save();
    res.json(await user.populate('managerId', 'name employeeId'));
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const setAccountStatus = async (req, res) => {
  const accountStatus = req.body.accountStatus;
  if (!['ACTIVE', 'SUSPENDED'].includes(accountStatus)) return res.status(400).json({ message: 'Invalid account status' });
  if (String(req.user._id) === req.params.id) return res.status(400).json({ message: 'You cannot suspend your own account' });
  try {
    const user = await User.findOne({ _id: req.params.id, organizationId: req.user.organizationId }).select(safeFields);
    if (!user) return res.status(404).json({ message: 'Employee not found' });
    if (!isRoleBelow(req.user.accessRole, user.accessRole)) {
      return res.status(403).json({ message: 'You cannot suspend or restore an employee at your level or above' });
    }
    user.accountStatus = accountStatus;
    await user.save();
    if (accountStatus === 'SUSPENDED') await Invitation.updateMany({ userId: user._id, acceptedAt: null }, { revokedAt: new Date() });
    if (req.company) await Identity.updateOne({ companyId: req.company._id, tenantUserId: user._id }, { status: accountStatus });
    res.json(user);
  } catch (error) { res.status(400).json({ message: error.message }); }
};
