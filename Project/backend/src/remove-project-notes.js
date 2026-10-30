import dotenv from 'dotenv';
import dns from 'node:dns';
import { MongoClient } from 'mongodb';

dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MOGODB_URI;
const controlDatabaseName = process.env.CONTROL_DB_NAME || 'workbuddy_control';
const removedCollectionName = 'projectnotes';

if (!mongoUri) throw new Error('A MongoDB URI is required');

const removeProjectNotes = async () => {
  if (mongoUri.startsWith('mongodb+srv://')) {
    dns.setServers((process.env.MONGODB_DNS_SERVERS || '1.1.1.1,8.8.8.8')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean));
  }

  const client = new MongoClient(mongoUri);
  await client.connect();

  try {
    const companies = await client.db(controlDatabaseName)
      .collection('control_companies')
      .find({}, { projection: { databaseName: 1 } })
      .toArray();
    const tenantDatabaseNames = [...new Set(companies.map(company => company.databaseName).filter(Boolean))];

    for (const databaseName of tenantDatabaseNames) {
      const database = client.db(databaseName);
      const exists = await database.listCollections({ name: removedCollectionName }, { nameOnly: true }).hasNext();
      if (exists) {
        await database.collection(removedCollectionName).drop();
        console.log(`Removed ${databaseName}.${removedCollectionName}`);
      } else {
        console.log(`Already absent: ${databaseName}.${removedCollectionName}`);
      }
    }

    console.log(`Project notes cleanup complete for ${tenantDatabaseNames.length} company databases.`);
  } finally {
    await client.close();
  }
};

removeProjectNotes().catch(error => {
  console.error(`Project notes cleanup failed: ${error.message}`);
  process.exit(1);
});
