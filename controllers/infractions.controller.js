// ./controllers/infractions.controller.js

// const dbClient = require('../utils/').dbClient;
const { dbClient, redisClient } = require('../utils');
const { catchAsync, success } = require('../helpers');
const database = dbClient.db(process.env.MONGODB_DATABASE);
const collection = database.collection('infractions');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;

const findAll = catchAsync(async (req, res) => {
    const message = '📄 Liste des infractions';
    const inCache = await redisClient.get('infractions:all');
    if (inCache) {
        return res.status(200).json(success(message, JSON.parse(inCache)));
    } else {
        const data = await collection.find({}).toArray();
        redisClient.set('infractions:all', JSON.stringify(data), 'EX', 600);
        res.status(200).json(success(message, data));
    }
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = `📄 Détails de l'infraction`;
        const { id } = req.params;
        let data = null;
        const inCache = await redisClient.get(`infraction:${id}`);
        if (inCache) {
            return res.status(200).json(success(message, JSON.parse(inCache)));
        } else {
            data = await collection.findOne({ _id: new ObjectId(id) });
            redisClient.set(
                `infraction:${id}`,
                JSON.stringify(data),
                'EX',
                600
            );
        }
        if (!data) {
            res.status(404).json({
                message: `No infraction found with id ${id}`,
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
    const message = `✏️ Création d'une infraction`;
    const schema = Joi.object({
        category: Joi.string().required(),
        priority: Joi.number(),
        list: Joi.array(),
    });
    const { body } = req;
    const { value, error } = schema.validate(body);
    // Handle validation errors
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    try {
        const { ...rest } = value;
        const createdAt = new Date();
        const updatedAt = new Date();
        const data = await collection
            .insertOne({
                ...rest,
                createdAt,
                updatedAt,
            })
            .then(
                console.log(
                    `----------->L\'infraction a bien été créé<-----------`
                )
            );
        // res.status(201).json(data);
        res.status(201).json(success(message, data));
        redisClient.del('infractions:all');
    } catch (err) {
        console.log(err);
    }
});

const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'No id provided' });
    }
    const message = `📝 Mise à jour de l'infraction ${id}`;
    const schema = Joi.object({
        category: Joi.string().required(),
        priority: Joi.number(),
        list: Joi.array(),
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
            return res.status(404).json({ message: 'Infraction not found' });
        }
        res.status(200).json(success(message, value));
        redisClient.del('infractions:all');
        redisClient.del(`infraction:${id}`);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});

const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;

    if (force === undefined || parseInt(force, 10) === 0) {
        //Vérification si l'infraction a déjà été supprimée de manière logique
        const infraction = await collection.findOne({ _id: new ObjectId(id) });
        redisClient.flushall();
        if (!isNaN(infraction.deletedAt)) {
            // Infraction already deleted, return appropriate response
            const message = `L'infraction a déjà été supprimé de manière logique.`;
            return res.status(200).json(success(message, infraction));
        }

        //suppression logique

        const message = `🗑️ Suppression d'un infraction de manière logique`;
        const data = await collection.findOneAndUpdate(
            {
                _id: new ObjectId(id),
            },
            {
                $set: { deletedAt: new Date() },
            }
        );
        res.status(200).json(success(message, data));
        redisClient.del('infractions:all');
        redisClient.del(`infraction:${id}`);
        // res.status(200).json({
        //     message: "L'infraction a bien été supprimé de manière logique.",
        //     result,
        // });
    } else if (parseInt(force, 10) === 1) {
        //suppression physique
        const message = `🗑️ Suppression d'un infraction de manière physique`;
        console.log('suppression physique/valeur force:' + force);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            console.log('Successfully deleted');
            res.status(200).json(success(message));
            redisClient.del('infractions:all');
            redisClient.del(`infraction:${id}`);
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
