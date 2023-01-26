// const dbClient = require('../utils').dbClient;
// const database = dbClient.db(process.env.MONGO_DB_DATABASE);
// const collection = database.collection('agents');
const dbClient = require('../utils/').dbClient;
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('agents');
const catchAsync = require('../helpers/catchAsync');
const { success } = require('../helpers/helper');
const moment = require('moment');
const Joi = require('joi');

const findAll = catchAsync(async (req, res) => {
    const message = 'Liste des agents';
    const data = await collection.find({}).toArray();
    res.status(200).json(data);
    // res.status(200).json(success(message, data));
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = 'Liste des agents';
        const { id, lastname, firstname } = req.params;

        if (!id) {
            res.status(400).json({ message: 'No id provided' });
        }
        const data = await collection.findOne({ id: id });
        if (!data) {
            res.status(404).json({ message: `No agent found with id ${id}` });
        }
        res.status(200).json(success(`Détails l'agent : `, data));
        //res.status(200).json(data);
    } catch (e) {
        console.error(e);
    }
});
const create = catchAsync(async (req, res) => {
    const schema = Joi.object({
        lastname: Joi.string(),
        firstname: Joi.string(),
        birthday: Joi.date(),
        email: Joi.string().email(),
        matricule: Joi.string().required(),
        adresse: {
            rue: Joi.string(),
            cp: Joi.string(),
            localite: Joi.string(),
        },

        tel: Joi.string(),
        password: Joi.string(),
    });
    const { body } = req;

    const { value, error } = schema.validate(body);

    if (error) {
        return res.status(400).json({ message: error });
    }
    try {
        const { ...rest } = value;
        const data = await collection
            .insertOne({
                ...rest,
            })
            .then(
                console.log(`----------->L\'agent a bien été créé<-----------`)
            );
        res.status(201).json(data);
    } catch (err) {
        console.log(err);
    }
});
const updateOne = catchAsync(async (req, res) => {});

const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: 'No id provided' });
    }
    const { force } = req.query;

    if (force === undefined || parseInt(force, 10) === 0) {
        //suppression logique
        const result = await collection.updateOne(
            {
                _id: id, //filter
            },
            {
                $set: { deleteAt: new Date() },
            }
        );
        res.status(200).json(result);
    }
    if (parseInt(force, 10) === 1) {
        //suppression physique
        const result = await collection.deleteOne({ _id: id });
        // if (result.deletedCount === 1) {
        //     console.log('Successfully deleted');
        // }
        res.status(204);
    }
    res.status(400).json({ message: 'Malformed parameter "force"' });
});

module.exports = {
    findAll,
    findOne,
    create,
    updateOne,
    deleteOne,
};
