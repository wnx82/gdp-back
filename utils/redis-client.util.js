//utils/redis-client.util.js

const Redis = require('ioredis');

const redis = new Redis({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    // password: process.env.REDIS_PASSWORD
});

redis.on('connect', () => {
    console.log(
        `\u001b[1;34mConnected to Redis on : \u001b[1;31m${process.env.REDIS_HOST}:${process.env.REDIS_PORT} \u001b[0m`
    );
});

module.exports = redis;
