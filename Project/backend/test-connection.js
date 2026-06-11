import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('Initiating database connection test...');
    await connectDB();
    
    const db = mongoose.connection.db;
    console.log(`Connected successfully to database: "${db.databaseName}"`);
    
    const collections = await db.listCollections().toArray();
    console.log('\n--- Collection Status ---');
    if (collections.length === 0) {
      console.log('No collections found. Database is currently empty.');
    } else {
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`- Collection: "${col.name}" | Document Count: ${count}`);
      }
    }
    console.log('-------------------------\n');
    
    console.log('Database connection check complete. Exiting...');
    process.exit(0);
  } catch (error) {
    console.error('Database connection test failed:', error);
    process.exit(1);
  }
};

testConnection();
