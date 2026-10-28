import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import SupportAgent from './control/SupportAgent.js';
dotenv.config();
const { SUPPORT_NAME, SUPPORT_EMAIL, SUPPORT_PASSWORD } = process.env;
if (!SUPPORT_NAME || !SUPPORT_EMAIL || !SUPPORT_PASSWORD) { console.error('SUPPORT_NAME, SUPPORT_EMAIL and SUPPORT_PASSWORD are required'); process.exit(1); }
await connectDB();
try {
  if (await SupportAgent.exists({ email: SUPPORT_EMAIL.toLowerCase() })) throw new Error('Support agent already exists');
  const agent = await SupportAgent.create({ name: SUPPORT_NAME, email: SUPPORT_EMAIL.toLowerCase(), password: SUPPORT_PASSWORD });
  console.log(`Provisioned support agent ${agent.email}`);
} catch (error) { console.error(error.message); process.exitCode = 1; } finally { await mongoose.disconnect(); }
