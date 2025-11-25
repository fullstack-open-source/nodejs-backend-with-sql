/**
 * Request Queue Middleware
 * Manages request queuing during traffic spikes to prevent server overload
 */

const logger = require('../logger/logger');

class RequestQueue {
  constructor(options = {}) {
    this.maxQueueSize = options.maxQueueSize || 100;
    this.maxWaitTime = options.maxWaitTime || 30000; // 30 seconds
    this.queue = [];
    this.processing = 0;
    this.maxConcurrent = options.maxConcurrent || 50;
  }

  async enqueue(req, res, next) {
    // Skip queuing for health checks and static assets
    if (req.path === '/health' || req.path === '/api/health' || req.path.startsWith('/api-docs')) {
      return next();
    }

    // If queue is full, reject request
    if (this.queue.length >= this.maxQueueSize) {
      logger.warn('Request queue is full, rejecting request', { 
        path: req.path,
        queueSize: this.queue.length 
      });
      return res.status(503).json({
        success: false,
        error: {
          code: 503,
          message: 'Service temporarily unavailable - server is overloaded',
          hint: 'Please try again in a few moments'
        }
      });
    }

    // If we're under max concurrent, process immediately
    if (this.processing < this.maxConcurrent) {
      this.processing++;
      try {
        await this.processRequest(req, res, next);
      } finally {
        this.processing--;
        this.processQueue();
      }
      return;
    }

    // Otherwise, queue the request
    return new Promise((resolve) => {
      const queueItem = {
        req,
        res,
        next,
        resolve,
        timestamp: Date.now()
      };

      this.queue.push(queueItem);
      const { isDebugMode, debug } = require('../utils/debug');
      if (isDebugMode()) {
        debug('Request queued', { 
          path: req.path,
          queueSize: this.queue.length,
          processing: this.processing 
        });
      }

      // Set timeout for queued request
      setTimeout(() => {
        const index = this.queue.indexOf(queueItem);
        if (index > -1) {
          this.queue.splice(index, 1);
          logger.warn('Request queue timeout', { 
            path: req.path,
            waitTime: Date.now() - queueItem.timestamp 
          });
          queueItem.res.status(504).json({
            success: false,
            error: {
              code: 504,
              message: 'Request timeout - server is busy',
              hint: 'Please try again later'
            }
          });
          queueItem.resolve();
        }
      }, this.maxWaitTime);
    });
  }

  async processRequest(req, res, next) {
    return new Promise((resolve) => {
      const originalEnd = res.end;
      res.end = function(...args) {
        originalEnd.apply(this, args);
        resolve();
      };
      next();
    });
  }

  processQueue() {
    while (this.queue.length > 0 && this.processing < this.maxConcurrent) {
      const item = this.queue.shift();
      this.processing++;
      
      this.processRequest(item.req, item.res, item.next)
        .then(() => {
          this.processing--;
          item.resolve();
          this.processQueue();
        })
        .catch((error) => {
          logger.error('Error processing queued request', { error: error.message });
          this.processing--;
          item.resolve();
          this.processQueue();
        });
    }
  }

  getStats() {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      maxConcurrent: this.maxConcurrent,
      maxQueueSize: this.maxQueueSize
    };
  }
}

// Singleton instance
let requestQueue = null;

function getRequestQueue(options) {
  if (!requestQueue) {
    requestQueue = new RequestQueue(options);
  }
  return requestQueue;
}

function requestQueueMiddleware(options) {
  const queue = getRequestQueue(options);
  return (req, res, next) => {
    queue.enqueue(req, res, next);
  };
}

module.exports = {
  requestQueueMiddleware,
  RequestQueue,
  getRequestQueue
};

