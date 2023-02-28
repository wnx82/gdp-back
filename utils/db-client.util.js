// db-client.util.js
const { MongoClient } = require('mongodb');
console.log(`Connection url => ${process.env.MONGO_DB_URL}`);
const url = `${process.env.MONGO_DB_URL}`;
const client = new MongoClient(url);

(async () => {
    try {
        await client.connect();
        // Establish and verify connection
        await client.db('agents').command({ ping: 1 });
        console.log(
            `\u001b[1;34mConnected to MongoDB on  : \u001b[1;31m${url} \u001b[0m `
        );
    } catch (e) {
        console.error(`Failed to connect to MongoDB: ${e}`);
        process.exit(1);
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
})();

// run().catch(console.dir);

module.exports = client;
