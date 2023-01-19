const dbClient = require('../utils').dbClient;
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('appointments');

// const findAll = async (req, res) => {
//     console.log('Liste contrôleur appointments');
//     const data = await collection.find({}).toArray();
//     res.status(200).json(data);
// };

const findAll = async (req, res) => {
    console.log('Liste contrôleur users');
    const data = await collection.find({}).toArray();
    res.status(200).json(data);
};
const getAppointement = async (req, res) => {};
const createAppointement = async (req, res) => {};
const updateAppointement = async (req, res) => {};
const deleteAppointement = async (req, res) => {};

module.exports = {
    findAll,
    getAppointement,
    createAppointement,
    updateAppointement,
    deleteAppointement,
};
