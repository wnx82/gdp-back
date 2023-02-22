// ./controllers/habitations.controller.js

// const dbClient = require('../utils/').dbClient;
const { dbClient, redisClient } = require('../utils');
const { catchAsync, success } = require('../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('habitations');
const moment = require('moment');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;

const findAll = catchAsync(async (req, res) => {
    const message = 'Liste des habitations';
    const inCache = await redisClient.get('habitations:all');
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const data = await collection.find({}).toArray();
        redisClient.set('habitations:all', JSON.stringify(data), 'EX', 600);
        res.status(200).json(success(message, data));
    }
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = `Détails de l'habitation`;
        const { id } = req.params;
        let data = null;
        const inCache = await redisClient.get(`habitation:${id}`);

        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            data = await collection.findOne({ _id: new ObjectId(id) });
            redisClient.set(
                `habitation:${id}`,
                JSON.stringify(data),
                'EX',
                600
            );
        }
        if (!data) {
            res.status(404).json({
                message: `No habitation found with id ${id}`,
            });
            return;
        } else {
            res.status(200).json(success(message, data));
        }

        // res.status(200).json(success(`Détails l'agent : `, data));
    } catch (e) {
        console.error(e);
    }
});
const create = catchAsync(async (req, res) => {
    const message = `Création d'une habitation`;
    const schema = Joi.object({
        adresse: {
            rue: Joi.string(),
            cp: Joi.string(),
            localite: Joi.string(),
        },
        demandeur: {
            nom: Joi.string(),
            tel: Joi.string(),
        },
        date: {
            debut: Joi.date().required(),
            fin: Joi.date().greater(Joi.ref('debut')).required(),
        },
        mesures: Joi.array(),
        vehicule: Joi.string(),
        googlemap: Joi.string(),
    });
    const { body } = req;
    if (!body.adresse) {
        return res.status(400).json({ message: 'adresse field is required' });
    }

    const { value, error } = schema.validate(body);

    if (error) {
        return res.status(400).json({ message: error });
    }
    try {
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
                    `----------->L\'habitation a bien été créé<-----------`
                )
            );
        res.status(201).json(success(message, data));
        console.log('on efface le redis');
        redisClient.del('habitations:all');
    } catch (err) {
        console.log(err);
    }
});
const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'No id provided' });
    }
    const message = `Mise à jour de l'habitation ${id}`;
    const schema = Joi.object({
        adresse: {
            rue: Joi.string(),
            cp: Joi.string(),
            localite: Joi.string(),
        },
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
            return res.status(404).json({ message: 'Habitation not found' });
        }
        res.status(200).json(success(message, value));
        redisClient.del('habitations:all');
        redisClient.del(`habitation:${id}`);
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
        const message = `Suppression d'une habitation de manière logique`;
        const data = await collection.updateOne(
            {
                _id: new ObjectId(id),
            },
            {
                $set: { deletedAt: new Date() },
            }
        );
        res.status(200).json(success(message, data));
        redisClient.del('habitations:all');
        redisClient.del(`habitation:${id}`);
    } else if (parseInt(force, 10) === 1) {
        //suppression physique
        const message = `Suppression d'une habitation de manière physique`;
        console.log('suppression physique/valeur force:' + force);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            console.log('Successfully deleted');
            res.status(200).json(success(message));
            redisClient.del('habitations:all');
            redisClient.del(`habitation:${id}`);
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
