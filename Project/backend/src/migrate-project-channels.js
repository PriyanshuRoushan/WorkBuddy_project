import dotenv from 'dotenv';
import dns from 'node:dns';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MOGODB_URI;
const controlDatabaseName = process.env.CONTROL_DB_NAME || 'workbuddy_control';
if (!mongoUri) throw new Error('A MongoDB URI is required');

const migrate = async () => {
  if (mongoUri.startsWith('mongodb+srv://')) {
    dns.setServers((process.env.MONGODB_DNS_SERVERS || '1.1.1.1,8.8.8.8').split(',').map(value => value.trim()).filter(Boolean));
  }
  const client = new MongoClient(mongoUri);
  await client.connect();
  try {
    const companies = await client.db(controlDatabaseName).collection('control_companies')
      .find({}, { projection: { databaseName: 1 } }).toArray();
    for (const databaseName of [...new Set(companies.map(company => company.databaseName).filter(Boolean))]) {
      const database = client.db(databaseName);
      const rooms = database.collection('chatrooms');
      const projects = await database.collection('projects').find({}).toArray();
      const indexes = await rooms.indexes().catch(() => []);
      for (const index of indexes) {
        if (index.unique && Object.keys(index.key).length === 1 && index.key.projectId === 1) {
          await rooms.dropIndex(index.name);
        }
      }

      for (const project of projects) {
        let general = await rooms.findOne({ projectId: project._id, slug: 'general' });
        if (!general) {
          general = await rooms.findOne({ projectId: project._id, slug: { $exists: false } });
          if (general) {
            await rooms.updateOne({ _id: general._id }, { $set: {
              name: 'General', slug: 'general', type: 'GENERAL',
              description: 'Project-wide discussion and everyday updates.',
              createdBy: project.creatorId || project.creator
            } });
          } else {
            await rooms.insertOne({
              _id: new ObjectId(), organizationId: project.organizationId, projectId: project._id,
              name: 'General', slug: 'general', type: 'GENERAL',
              description: 'Project-wide discussion and everyday updates.',
              createdBy: project.creatorId || project.creator, participants: [], isArchived: false,
              isDirectMessage: false, createdAt: new Date(), updatedAt: new Date()
            });
          }
        }
        await rooms.updateOne(
          { projectId: project._id, slug: 'announcements' },
          { $setOnInsert: {
            _id: new ObjectId(), organizationId: project.organizationId, projectId: project._id,
            name: 'Announcements', slug: 'announcements', type: 'ANNOUNCEMENTS',
            description: 'Important project updates and decisions.',
            createdBy: project.creatorId || project.creator, participants: [], isArchived: false,
            isDirectMessage: false, createdAt: new Date(), updatedAt: new Date()
          } },
          { upsert: true }
        );
      }
      await rooms.createIndex({ organizationId: 1, projectId: 1, slug: 1 }, { unique: true, name: 'organizationId_1_projectId_1_slug_1' });
      await database.createCollection('channelstates').catch(error => {
        if (error.codeName !== 'NamespaceExists') throw error;
      });
      await database.collection('channelstates').createIndex(
        { organizationId: 1, channelId: 1, userId: 1 },
        { unique: true, name: 'organizationId_1_channelId_1_userId_1' }
      );
      console.log('Migrated project channels in ' + databaseName);
    }
  } finally {
    await client.close();
  }
};

migrate().catch(error => {
  console.error('Project channel migration failed: ' + error.message);
  process.exit(1);
});
