import redisClient from './config-redis.js';

/**
 * Generate Redis key for app account users
 * @param {string} userId - The user ID
 * @param {string} appAccountId - The app account ID
 * @returns {string} Redis key
 */
const generateKey = (userId, appAccountId) => {
    return `appAccountUsers:${userId}:${appAccountId}`;
};

/**
 * Set user role for an app account
 * @param {string} userId - The user ID
 * @param {string} appAccountId - The app account ID
 * @param {string} role - The role (account-admin | account-user)
 * @returns {Promise<string>} Redis response
 */
export const setUserRole = async (userId, appAccountId, role) => {
  const key = generateKey(userId, appAccountId);
  return await redisClient.set(key, role);
};

/**
 * Get user role for an app account
 * @param {string} userId - The user ID
 * @param {string} appAccountId - The app account ID
 * @returns {Promise<string|null>} User role or null if not found
 */
export const getUserRole = async (userId, appAccountId) => {
  const key = generateKey(userId, appAccountId);
  return await redisClient.get(key);
};

/**
 * Remove user role for an app account
 * @param {string} userId - The user ID
 * @param {string} appAccountId - The app account ID
 * @returns {Promise<number>} Number of keys deleted (0 or 1)
 */
export const removeUserRole = async (userId, appAccountId) => {
  const key = generateKey(userId, appAccountId);
  return await redisClient.del(key);
};

/**
 * Check if user has permission for an app account
 * @param {string} userId - The user ID
 * @param {string} appAccountId - The app account ID
 * @param {string[]} roles - The roles to check as array of strings (account-admin | account-user)
 * @returns {Promise<boolean>} True if user has permission, false otherwise
 */
export const hasPermission = async (userId, appAccountId, roles) => {
  const role = await getUserRole(userId, appAccountId);
  return roles.includes(role);
};

/**
 * Delete all app account users for an app account
 * @param {string} appAccountId - The app account ID
 * @returns {Promise<number>} Number of keys deleted
 */
export const deleteAppAccountUsers = async (appAccountId) => {
  const pattern = `appAccountUsers:*:${appAccountId}`;
  const keys = await redisClient.keys(pattern);
  
  if (keys.length === 0) {
    return 0;
  }
  
  return await redisClient.del(...keys);
};


/**
 * Delete all keys
 * @returns {Promise<number>} Number of keys deleted
 */
export const deleteAllKeys = async () => {
  const pattern = `appAccountUsers:*`;
  const keys = await redisClient.keys(pattern);
  
  if (keys.length === 0) {
    return 0;
  }
  
  return await redisClient.del(...keys);
};

/**
 * Add bulk app account users
 * @param {Array<{userId: string, appAccountId: string, role: string}>} appAccountUsers - Array of users
 * @returns {Promise<number>} Number of keys added
 */
export const bulkAdd = async (appAccountUsers) => {
  if (!appAccountUsers || appAccountUsers.length === 0) {
    return 0;
  }

  const keyValuePairs = appAccountUsers.flatMap(user => [
    generateKey(user.userId, user.appAccountId),
    user.role
  ]);

  await redisClient.mset(keyValuePairs);
  return appAccountUsers.length;
};
