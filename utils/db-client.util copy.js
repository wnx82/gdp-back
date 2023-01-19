// db-client.util.js
const { MongoClient } = require('mongodb');

// const url = `mongodb://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PWD}@${process.env.MONGO_DB_HOST}:${process.env.MONGO_DB_PORT}`;
const url = `mongodb://${process.env.MONGO_DB_HOST}:${process.env.MONGO_DB_PORT}`;
//const url = process.env.MONGO_DB_URL;
const client = new MongoClient(url);

(async () => {
    try {
        await client.connect();

        console.log(
            `\u001b[1;34mConnected to MongoDB on  : \u001b[1;31m${url} \u001b[0m `
        );
    } catch (e) {
        console.error(`Failed to connect to MongoDB: ${e}`);
        process.exit(1);
    }
})();

module.exports = client;
