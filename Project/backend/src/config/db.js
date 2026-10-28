import mongoose from 'mongoose';
import dns from 'node:dns';

const DEFAULT_MONGO_URI = 'mongodb://localhost:27017/doodlesaas';
const DEFAULT_DNS_FALLBACKS = ['1.1.1.1', '8.8.8.8'];

const getMongoUri = () => (
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MOGODB_URI ||
  DEFAULT_MONGO_URI
);

const getErrorCode = (error) => {
  let currentError = error;
  while (currentError) {
    if (currentError.code) return currentError.code;
    currentError = currentError.cause;
  }
  return undefined;
};

const isDnsLookupError = (error) => {
  return ['EBADRESP', 'ESERVFAIL', 'ENOTFOUND', 'ETIMEOUT', 'EAI_AGAIN']
    .includes(getErrorCode(error));
};

const getDnsFallbacks = () => {
  const configuredServers = process.env.MONGODB_DNS_SERVERS;
  if (!configuredServers) return DEFAULT_DNS_FALLBACKS;

  return configuredServers
    .split(',')
    .map(server => server.trim())
    .filter(Boolean);
};

const connectDB = async () => {
  const mongoUri = getMongoUri();

  try {
    let conn;

    try {
      conn = await mongoose.connect(mongoUri, process.env.CONTROL_DB_NAME ? { dbName: process.env.CONTROL_DB_NAME } : {});
    } catch (error) {
      const shouldRetryWithDnsFallback = mongoUri.startsWith('mongodb+srv://') && isDnsLookupError(error);
      if (!shouldRetryWithDnsFallback) throw error;

      const dnsFallbacks = getDnsFallbacks();
      if (dnsFallbacks.length === 0) throw error;

      console.warn(`MongoDB SRV lookup failed via system DNS (${getErrorCode(error)}). Retrying with fallback DNS.`);
      dns.setServers(dnsFallbacks);
      conn = await mongoose.connect(mongoUri, process.env.CONTROL_DB_NAME ? { dbName: process.env.CONTROL_DB_NAME } : {});
    }

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
