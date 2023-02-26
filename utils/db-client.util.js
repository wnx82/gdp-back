// db-client.util.js
const { MongoClient } = require('mongodb');

const url = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}`;

const client = new MongoClient(url);

async function connectToDB() {
    try {
        await client.connect();
        // Vérifier la connexion
        await client.db('agents').command({ ping: 1 });
        console.log(
            `\u001b[1;34mConnected to MongoDB on: \u001b[1;31m${url}\u001b[0m`
        );
    } catch (e) {
        console.error(`Failed to connect to MongoDB: ${e}`);
        process.exit(1);
    }
}

connectToDB();

module.exports = client;
