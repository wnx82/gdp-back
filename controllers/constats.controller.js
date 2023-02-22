// ./controllers/constats.controller.js

// const dbClient = require('../utils/').dbClient;
const { dbClient, redisClient } = require('../utils');
const { catchAsync, success } = require('../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('constats');
const moment = require('moment');
// const Joi = require('joi');
const Joi = require('joi-oid');
const ObjectId = require('mongodb').ObjectId;

const findAll = catchAsync(async (req, res) => {
    const message = 'Liste des constats';
    const inCache = await redisClient.get('constats:all');
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const data = await collection.find({}).toArray();
        redisClient.set('constats:all', JSON.stringify(data), 'EX', 600);
        res.status(200).json(success(message, data));
    }
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = `Détails du constat`;
        const { id } = req.params;
        let data = null;
        const inCache = await redisClient.get(`constat:${id}`);

        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            data = await collection.findOne({ _id: new ObjectId(id) });
            redisClient.set(`constat:${id}`, JSON.stringify(data), 'EX', 600);
        }

        if (!data) {
            res.status(404).json({
                message: `No constat found with id ${id}`,
            });
            return;
        } else {
            res.status(200).json(success(message, data));
        }
    } catch (e) {
        console.error(e);
    }
});

const create = catchAsync(async (req, res) => {
    const message = `Création d'un constat`;
    const schema = Joi.object({
        agents: Joi.array()
            .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
            .min(1)
            .required(),
        // agents: Joi.array().items(Joi.string()).required(),
        date: Joi.date().required(),
        vehicule: Joi.object({
            marque: Joi.string(),
            modele: Joi.string(),
            couleur: Joi.string(),
            type: Joi.string(),
            immatriculation: Joi.string(),
        }),

        adresse: Joi.object({
            rue: Joi.string(),
            cp: Joi.string(),
            localite: Joi.string(),
        }),

        infraction: Joi.array().items(Joi.string()).required(),
        pv: Joi.boolean().required(),
        note: Joi.string(),
    });
    const { body } = req;
    if (!body.adresse) {
        return res.status(400).json({ message: 'adresse field is required' });
    }

    const { value, error } = schema.validate(body);

    if (error) {
        return res.status(400).json({
            message: error.details.map(err => err.message).join(', '),
        });
    }

    try {
        const agentsID = value.agents.map(p => {
            return new ObjectId(p);
        });
        value.agents = agentsID;

        const { ...rest } = value;
        const createdAt = new Date();
        const updatedAt = new Date();
        const data = await collection
            .insertOne({
                createdAt,
                updatedAt,
                ...rest,
            })
            .then(
                console.log(
                    `----------->Le constat a bien été créé<-----------`
                )
            );
        res.status(201).json(success(message, data));
        //on efface le redis
        console.log('on efface le redis');
        redisClient.del('constats:all');
    } catch (err) {
        console.log(err);
    }
});
const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'No id provided' });
    }
    const message = `Mise à jour du constat ${id}`;

    const schema = Joi.object({
        agents: Joi.array()
            .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
            .min(1)
            .required(),

        date: Joi.date().required(),
        vehicule: Joi.object({
            marque: Joi.string(),
            modele: Joi.string(),
            couleur: Joi.string(),
            type: Joi.string(),
            immatriculation: Joi.string(),
        }),

        adresse: Joi.object({
            rue: Joi.string(),
            cp: Joi.string(),
            localite: Joi.string(),
        }),

        infraction: Joi.array().items(Joi.string()).required(),
        pv: Joi.boolean().required(),
        note: Joi.string(),
    });
    const { body } = req;

    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    try {
        const updatedAt = new Date();
        const { modifiedCount } = await collection.updateOne(
            { _id: ObjectId(id) },
            { $set: { ...value, updatedAt } },
            { returnDocument: 'after' }
        );
        if (modifiedCount === 0) {
            return res.status(404).json({ message: 'Constat not found' });
        }
        res.status(200).json(success(message, value));
        redisClient.del('constats:all');
        redisClient.del(`constat:${id}`);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});
const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;
    if (force === undefined || parseInt(force, 10) === 0) {
        //suppression logique
        const message = `Suppression d'un constat de manière logique`;
        const data = await collection.updateOne(
            {
                _id: new ObjectId(id),
            },
            {
                $set: { deletedAt: new Date() },
            }
        );
        res.status(200).json(success(message, data));
        redisClient.del('constats:all');
        redisClient.del(`constat:${id}`);
    } else if (parseInt(force, 10) === 1) {
        //suppression physique
        const message = `Suppression d'un constat de manière physique`;
        console.log('suppression physique/valeur force:' + force);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            console.log('Successfully deleted');
            res.status(200).json(success(message));
            redisClient.del('constats:all');
            redisClient.del(`constat:${id}`);
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
