/**
 * Worker Utilities
 * Helper functions for using worker threads
 */

const path = require('path');
const { WorkerPool } = require('../workers/workerPool');

let workerPool = null;

function getWorkerPool() {
  if (!workerPool) {
    const workerFile = path.join(__dirname, '../workers/cpuTaskWorker.js');
    workerPool = new WorkerPool(workerFile);
  }
  return workerPool;
}

/**
 * Execute CPU-intensive task in worker thread
 * @param {string} task - Task name
 * @param {object} payload - Task payload
 * @returns {Promise<any>} Task result
 */
async function executeInWorker(task, payload) {
  const pool = getWorkerPool();
  return await pool.execute({ task, payload });
}

/**
 * Hash password in worker thread (non-blocking)
 * @param {string} password - Password to hash
 * @param {number} rounds - Bcrypt rounds (default: 10)
 * @returns {Promise<string>} Hashed password
 */
async function hashPasswordInWorker(password, rounds = 10) {
  return await executeInWorker('hashPassword', { password, rounds });
}

/**
 * Compare password in worker thread (non-blocking)
 * @param {string} password - Plain password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
async function comparePasswordInWorker(password, hash) {
  return await executeInWorker('comparePassword', { password, hash });
}

/**
 * Terminate worker pool (for graceful shutdown)
 */
async function terminateWorkerPool() {
  if (workerPool) {
    await workerPool.terminate();
    workerPool = null;
  }
}

module.exports = {
  executeInWorker,
  hashPasswordInWorker,
  comparePasswordInWorker,
  terminateWorkerPool,
  getWorkerPool
};

