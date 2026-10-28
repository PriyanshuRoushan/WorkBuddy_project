import { AsyncLocalStorage } from 'node:async_hooks';
import mongoose from 'mongoose';

const storage = new AsyncLocalStorage();
const tenantCache = new Map();

export const runWithTenant = (context, callback) => storage.run(context, callback);
export const currentTenant = () => storage.getStore();

export const tenantModelProxy = (name, schema, fallbackModel) => new Proxy(fallbackModel, {
  get(target, property, receiver) {
    const model = storage.getStore()?.models?.[name] || target;
    const value = Reflect.get(model, property, model === target ? receiver : model);
    return typeof value === 'function' ? value.bind(model) : value;
  },
  construct(target, args) {
    const Model = storage.getStore()?.models?.[name] || target;
    return new Model(...args);
  }
});

export const getTenantModels = (databaseName, modelDefinitions) => {
  if (!databaseName) throw new Error('Company database is not configured');
  if (tenantCache.has(databaseName)) return tenantCache.get(databaseName);
  const db = mongoose.connection.useDb(databaseName, { useCache: true });
  const models = Object.fromEntries(modelDefinitions.map(({ name, schema }) => [
    name,
    db.models[name] || db.model(name, schema)
  ]));
  const context = { databaseName, db, models };
  tenantCache.set(databaseName, context);
  return context;
};
