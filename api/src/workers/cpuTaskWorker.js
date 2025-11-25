/**
 * CPU Task Worker
 * Handles CPU-intensive tasks in a separate thread
 */

const { parentPort } = require('worker_threads');

parentPort.on('message', async (data) => {
  try {
    const { task, payload } = data;
    let result;

    switch (task) {
      case 'hashPassword':
        const bcrypt = require('bcryptjs');
        result = await bcrypt.hash(payload.password, payload.rounds || 10);
        break;

      case 'comparePassword':
        const bcryptCompare = require('bcryptjs');
        result = await bcryptCompare.compare(payload.password, payload.hash);
        break;

      case 'processImage':
        // Placeholder for image processing tasks
        result = { processed: true, data: payload };
        break;

      case 'generateReport':
        // Placeholder for report generation
        result = { report: 'generated', data: payload };
        break;

      default:
        throw new Error(`Unknown task: ${task}`);
    }

    parentPort.postMessage({ data: result });
  } catch (error) {
    parentPort.postMessage({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

