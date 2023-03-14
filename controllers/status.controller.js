// ./controllers/status.controller.js
const { MongoClient } = require('mongodb');
const { dbClient, redisClient } = require('../utils');

const status = async (req, res) => {
    try {
        // MongoDB status
        const checkMongo = async () => {
            try {
                await dbClient
                    .db(process.env.MONGO_DB_DATABASE)
                    .command({ ping: 1 });
                console.log('✅ MongoDB is connected');
                return '✅ MongoDB is connected';
            } catch (error) {
                console.log('⛔ MongoDB is not connected');
                throw new Error('⛔ MongoDB is not connected');
            }
        };
        const mongoStatus = await checkMongo();
        // Redis status
        const checkRedis = () => {
            return new Promise((resolve, reject) => {
                if (redisClient.status === 'ready') {
                    console.log('✅ Redis is connected');
                    resolve('✅ Redis is connected');
                } else {
                    console.log('⛔ Redis is not connected');
                    reject(new Error('⛔ Redis is not connected'));
                }
            });
        };
        const redisStatus = await checkRedis();

        if (!res.headersSent) {
            res.json({ mongo: mongoStatus, redis: redisStatus });
        }
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).send('Server error: ' + error.message);
        }
    }
};

module.exports = {
    status,
};
