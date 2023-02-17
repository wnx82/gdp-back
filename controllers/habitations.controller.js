// ./controllers/habitations.controller.js

// const dbClient = require('../utils/').dbClient;
const { dbClient, redisClient } = require('../utils/');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('habitations');
const bcrypt = require('bcrypt');
const catchAsync = require('../helpers/catchAsync');
// const { success } = require('../helpers/helper');
const moment = require('moment');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectID;

const findAll = catchAsync(async (req, res) => {
    const inCache = await redisClient.get('habitations:all');
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const data = await collection.find({}).toArray();
        redisClient.set('habitations:all', JSON.stringify(data), 'EX', 600);
        res.status(200).json(data);
    }
});

const findOne = catchAsync(async (req, res) => {
    try {
        const { id } = req.params;
        // console.log(id);
        if (!id) {
            res.status(400).json({ message: 'No id provided' });
        }
        if (!ObjectId.isValid(id)) {
            res.status(400).json({
                message: 'Invalid id provided',
            });
        }
        const data = await collection.findOne({ _id: new ObjectId(id) });

        // console.log(data);
        if (!data) {
            res.status(404).json({
                message: `No habitation found with id ${id}`,
            });
        }
        const inCache = await redisClient.get(`habitation:${id}`);
        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            redisClient.set(
                `habitation:${id}`,
                JSON.stringify(data),
                'EX',
                600
            );
            res.status(200).json(data);
        }
        // res.status(200).json(success(`Détails l'agent : `, data));
    } catch (e) {
        console.error(e);
    }
});
const create = catchAsync(async (req, res) => {
    const schema = Joi.object({
        adresse: {
            rue: Joi.string(),
            cp: Joi.string(),
            localite: Joi.string(),
        },
        cp: Joi.string(),
        localite: Joi.string(),
        demandeur: {
            nom: Joi.string(),
            tel: Joi.string(),
        },
        date: {
            debut: Joi.string(),
            fin: Joi.string(),
        },
        mesures: Joi.array(),
        vehicule: Joi.string(),
        googlemap: Joi.string(),
    });
    const { body } = req;
    if (!body.adresse) {
        return res.status(400).json({ message: 'Adresse field is required' });
    }

    const { value, error } = schema.validate(body);

    if (error) {
        return res.status(400).json({ message: error });
    }
    try {
        const { email, password, ...rest } = value;
        const data = await collection
            .insertOne({
                ...rest,
            })
            .then(
                console.log(
                    `----------->L\'habitation a bien été créé<-----------`
                )
            );
        res.status(201).json(data);
    } catch (err) {
        console.log(err);
    }
});
const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: 'No id provided' });
    }
    const { body } = req;
    const schema = Joi.object({
        adresse: {
            rue: Joi.string(),
            cp: Joi.string(),
            localite: Joi.string(),
        },
        cp: Joi.string(),
        localite: Joi.string(),
        demandeur: {
            nom: Joi.string(),
            tel: Joi.string(),
        },
        date: {
            debut: Joi.string(),
            fin: Joi.string(),
        },
        mesures: Joi.array(),
        vehicule: Joi.string(),
        googlemap: Joi.string(),
    });

    const { value, error } = schema.validateAsync(body);
    if (error) {
        res.status(400).json(error);
    }
    const data = await collection.findOneAndUpdate(
        {
            _id: new ObjectId(id),
        },
        {
            $set: schema,
        },
        {
            returnDocument: 'after',
            // upsert:
        }
    );
    res.status(200).json(data);
});

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
                _id: new ObjectId(id),
            },
            {
                $set: { deletedAt: new Date() },
            }
        );
        res.status(200).json({
            message: "L'habitation a bien été supprimé de manière logique.",
            result,
        });
    } else if (parseInt(force, 10) === 1) {
        //suppression physique
        console.log('suppression physique/valeur force:' + force);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            console.log('Successfully deleted');
            res.status(200).json({
                message: 'Successfully deleted physically',
            });
        } else {
            res.status(404).json({ message: 'Failed to delete' });
        }
    } else {
        res.status(400).json({ message: 'Malformed parameter "force"' });
    }
});

module.exports = {
    findAll,
    findOne,
    create,
    updateOne,
    deleteOne,
};
