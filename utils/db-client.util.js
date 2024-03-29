// db-client.util.js
const { MongoClient } = require('mongodb');
// const url = `${process.env.MONGO_DB_URL}`;
const url = `mongodb://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PWD}@${process.env.MONGO_DB_HOST}:${process.env.MONGO_DB_PORT}`;
const client = new MongoClient(url);

(async () => {
    try {
        await client.connect();
        // Establish and verify connection
        await client.db(process.env.MONGO_DB_DATABASE).command({ ping: 1 });
        console.log(
            `\u001b[1;34mConnected to MongoDB on  : \u001b[1;31m${url} \u001b[0m `
        );
    } catch (e) {
        console.error(`Failed to connect to MongoDB: ${e}`);
        process.exit(1);
    }
})();

// run().catch(console.dir);

module.exports = client;
