// ./controllers/status.controller.js

const { MongoClient } = require('mongodb');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_PORT);
const url = `mongodb://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PWD}@${process.env.MONGO_DB_HOST}:${process.env.MONGO_DB_PORT}`;

const status = async (req, res) => {
    try {
        // MongoDB status
        const mongoClient = new MongoClient(url);
        const checkMongo = async () => {
            try {
                await mongoClient.connect();
                console.log('MongoDB is connected');
                return 'MongoDB is connected';
            } catch (error) {
                console.log('MongoDB is not connected');
                throw new Error('MongoDB is not connected');
            } finally {
                await mongoClient.close();
            }
        };
        const mongoStatus = await checkMongo();

        // Redis status
        const redisClient = redis;
        const checkRedis = () => {
            return new Promise((resolve, reject) => {
                redisClient.ping((error, result) => {
                    if (error) {
                        console.log('Redis is not connected');
                        throw new Error('Redis is not connected');
                    } else {
                        console.log('Redis is connected');
                        resolve('Redis is connected');
                    }
                });
            });
        };
        const redisStatus = await checkRedis();

        // Close Redis connection
        await redis.quit();

        res.json({ mongo: mongoStatus, redis: redisStatus });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error: ' + error.message);
    }
};

module.exports = {
    status,
};
