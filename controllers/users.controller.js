const dbClient = require('../utils/').dbClient;
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('users');

const findAll = async (req, res) => {
    console.log('Liste contrôleur users');
    const data = await collection.find({}).toArray();
    res.status(200).json(data);
};

const findOne = async (req, res) => {};
const create = async (req, res) => {};
const updateOne = async (req, res) => {};
const deleteOne = async (req, res) => {};

module.exports = {
    findAll,
    findOne,
    create,
    updateOne,
    deleteOne,
};
