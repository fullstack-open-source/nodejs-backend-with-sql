/**
 * Worker Thread Pool
 * Manages CPU-intensive tasks in separate threads to avoid blocking the event loop
 */

const { Worker } = require('worker_threads');
const os = require('os');
const path = require('path');
const logger = require('../logger/logger');

class WorkerPool {
  constructor(workerFile, poolSize = null) {
    this.workerFile = workerFile;
    this.poolSize = poolSize || Math.max(2, os.cpus().length - 1); // Leave one CPU for main thread
    this.workers = [];
    this.queue = [];
    this.activeWorkers = new Set();
    
    this.initialize();
  }

  initialize() {
    for (let i = 0; i < this.poolSize; i++) {
      this.createWorker();
    }
    logger.info(`Worker pool initialized with ${this.poolSize} workers`, { 
      poolSize: this.poolSize,
      workerFile: this.workerFile 
    });
  }

  createWorker() {
    const worker = new Worker(this.workerFile);
    
    worker.on('message', (result) => {
      this.activeWorkers.delete(worker);
      this.processQueue();
      
      if (result.error) {
        logger.error('Worker error', { error: result.error });
      }
    });

    worker.on('error', (error) => {
      logger.error('Worker thread error', { error: error.message });
      this.activeWorkers.delete(worker);
      this.removeWorker(worker);
      this.createWorker(); // Replace failed worker
      this.processQueue();
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        logger.warn('Worker exited with code', { code });
        this.removeWorker(worker);
        this.createWorker(); // Replace exited worker
      }
    });

    this.workers.push(worker);
    return worker;
  }

  removeWorker(worker) {
    const index = this.workers.indexOf(worker);
    if (index > -1) {
      this.workers.splice(index, 1);
    }
  }

  async execute(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };
      
      if (this.activeWorkers.size < this.workers.length) {
        this.runTask(task);
      } else {
        this.queue.push(task);
      }
    });
  }

  processQueue() {
    if (this.queue.length === 0) return;
    
    if (this.activeWorkers.size < this.workers.length) {
      const task = this.queue.shift();
      this.runTask(task);
    }
  }

  runTask(task) {
    const worker = this.getAvailableWorker();
    if (!worker) {
      this.queue.push(task);
      return;
    }

    this.activeWorkers.add(worker);
    
    const messageHandler = (result) => {
      worker.removeListener('message', messageHandler);
      this.activeWorkers.delete(worker);
      
      if (result.error) {
        task.reject(new Error(result.error));
      } else {
        task.resolve(result.data);
      }
      
      this.processQueue();
    };

    worker.once('message', messageHandler);
    worker.postMessage(task.data);
  }

  getAvailableWorker() {
    for (const worker of this.workers) {
      if (!this.activeWorkers.has(worker)) {
        return worker;
      }
    }
    return null;
  }

  async terminate() {
    logger.info('Terminating worker pool', { poolSize: this.workers.length });
    const promises = this.workers.map(worker => worker.terminate());
    await Promise.all(promises);
    this.workers = [];
    this.activeWorkers.clear();
    this.queue = [];
  }
}

module.exports = { WorkerPool };

