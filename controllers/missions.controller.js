// ./controllers/missions.controller.js

// const dbClient = require('../utils/').dbClient;
const { dbClient, redisClient } = require('../utils');
const { catchAsync, success } = require('../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('missions');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;

const schema = Joi.object({
    id : Joi.string().allow(null).optional().empty(''),
    title: Joi.string().required(),
    description: Joi.string().allow(null).optional().empty(''),
    category: Joi.string().allow(null).optional().empty(''),
    horaire: Joi.string().allow(null).optional().empty(''),
    priority: Joi.number().allow(null).optional().empty(''),
    contact: Joi.string().allow(null).optional().empty(''),
    visibility: Joi.boolean().optional(),
    annexes: Joi.array()
        .items(Joi.string().allow(null).optional().empty(''))
        .optional(),
});

const findAll = catchAsync(async (req, res) => {
    const message = '📄 Liste des missions';
    const inCache = await redisClient.get('missions:all');
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const data = await collection.find({}).toArray();
        redisClient.set('missions:all', JSON.stringify(data), 'EX', 600);
        res.status(200).json(data);
    }
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = `📄 Détails de la mission`;
        const { id } = req.params;
        let data = null;
        data = await collection.findOne({ _id: new ObjectId(id) });
        if (!data) {
            res.status(404).json({
                message: `⛔ No mission found with id ${id}`,
            });
            return;
        }
        const inCache = await redisClient.get(`mission:${id}`);
        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            data = await collection.findOne({ _id: new ObjectId(id) });
            redisClient.set(`mission:${id}`, JSON.stringify(data), 'EX', 600);
        }
        if (!data) {
            res.status(404).json({
                message: `No mission found with id ${id}`,
            });
            return;
        } else {
            res.status(200).json(data);
        }
    } catch (e) {
        console.error(e);
    }
});

const create = catchAsync(async (req, res) => {
    const message = `✏️ Création d'une mission`;

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
                    `----------->La mission a bien été créé<-----------`
                )
            );
        // res.status(201).json(data);
        res.status(201).json(data);
        redisClient.del('missions:all');
    } catch (err) {
        console.log(err);
    }
});

const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'No id provided' });
    }
    const message = `📝 Mise à jour de la mission ${id}`;

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
            return res.status(404).json({ message: 'Mission not found' });
        }
        res.status(200).json(value);
        redisClient.del('missions:all');
        redisClient.del(`mission:${id}`);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});

const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;

    if (force === undefined || parseInt(force, 10) === 0) {
        //Vérification si l'mission a déjà été supprimée de manière logique
        const mission = await collection.findOne({ _id: new ObjectId(id) });
        redisClient.flushall();
        if (!isNaN(mission.deletedAt)) {
            // Mission already deleted, return appropriate response
            const message = `La mission a déjà été supprimé de manière logique.`;
            return res.status(200).json(mission);
        }

        //suppression logique

        const message = `🗑️ Suppression d'une mission de manière logique`;
        const data = await collection.findOneAndUpdate(
            {
                _id: new ObjectId(id),
            },
            {
                $set: { deletedAt: new Date() },
            }
        );
        res.status(200).json(data);
        redisClient.del('missions:all');
        redisClient.del(`mission:${id}`);
        // res.status(200).json({
        //     message: "L'mission a bien été supprimé de manière logique.",
        //     result,
        // });
    } else if (parseInt(force, 10) === 1) {
        //suppression physique
        const message = `🗑️ Suppression d'une mission de manière physique`;
        console.log('suppression physique/valeur force:' + force);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            console.log('Successfully deleted');
            res.status(200).json(success(message));
            redisClient.del('missions:all');
            redisClient.del(`mission:${id}`);
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
