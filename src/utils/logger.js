// src/utils/logger.js

import log from 'loglevel';

// Set the default log level (you can adjust this based on environment)
log.setLevel(process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

export default log;