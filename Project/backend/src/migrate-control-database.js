import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import dns from 'node:dns';

dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MOGODB_URI;
const targetDatabaseName = process.env.CONTROL_DB_NAME || 'workbuddy_control';
const controlCollections = [
  'control_companies',
  'control_identities',
  'control_subscriptions',
  'control_support_agents',
  'control_support_tickets',
  'control_support_access_grants',
  'control_audit_logs'
];

if (!mongoUri) throw new Error('A MongoDB URI is required');

const copyIndexOptions = index => {
  const allowed = ['name', 'unique', 'sparse', 'expireAfterSeconds', 'partialFilterExpression', 'collation'];
  return Object.fromEntries(allowed.filter(key => index[key] !== undefined).map(key => [key, index[key]]));
};

const migrate = async () => {
  if (mongoUri.startsWith('mongodb+srv://')) {
    dns.setServers((process.env.MONGODB_DNS_SERVERS || '1.1.1.1,8.8.8.8').split(',').map(item => item.trim()).filter(Boolean));
  }
  const client = new MongoClient(mongoUri);
  await client.connect();
  const source = client.db();
  const target = client.db(targetDatabaseName);
  if (source.databaseName === target.databaseName) throw new Error('Source and target control databases are the same');

  const copied = [];
  for (const collectionName of controlCollections) {
    const sourceCollection = source.collection(collectionName);
    const targetCollection = target.collection(collectionName);
    const documents = await sourceCollection.find({}).toArray();
    if (documents.length) {
      await targetCollection.bulkWrite(documents.map(document => ({
        replaceOne: { filter: { _id: document._id }, replacement: document, upsert: true }
      })), { ordered: false });
    } else {
      await target.createCollection(collectionName).catch(error => {
        if (error.codeName !== 'NamespaceExists') throw error;
      });
    }

    const indexes = await sourceCollection.indexes().catch(() => []);
    for (const index of indexes.filter(item => item.name !== '_id_')) {
      await targetCollection.createIndex(index.key, copyIndexOptions(index));
    }

    const [sourceCount, targetCount] = await Promise.all([
      sourceCollection.countDocuments(),
      targetCollection.countDocuments()
    ]);
    if (sourceCount !== targetCount) {
      throw new Error(`${collectionName} verification failed: source=${sourceCount}, target=${targetCount}`);
    }
    copied.push({ collectionName, count: sourceCount });
  }

  console.log(`Control database copied and verified: ${source.databaseName} -> ${target.databaseName}`);
  console.log('Original collections were retained as a rollback backup.');
  copied.forEach(item => console.log(`${item.collectionName}: ${item.count} documents verified`));
  await client.close();
};

migrate().catch(error => {
  console.error(`Control database migration failed: ${error.message}`);
  process.exit(1);
});
