//utils/redis-client.util.js

const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_PORT);

module.exports = redis;
