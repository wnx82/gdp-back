// ./controllers/infractions.controller.js

const { dbClient, redisClient } = require('../../utils');
const { catchAsync, success } = require('../../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('infractions');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'infractions';

const schema = Joi.object({
    id: Joi.string().allow(null).optional().empty(''),
    category: Joi.string().required(),
    priority: Joi.number().allow(null).optional().empty(''),
    list: Joi.array(),
});

const findAll = catchAsync(async (req, res) => {
    const inCache = await redisClient.get(`${collectionName}:all`);
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const data = await collection.find({}).toArray();
        redisClient.set('infractions:all', JSON.stringify(data), 'EX', 600);
        res.status(200).json(data);
    }
});

const findOne = catchAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const inCache = await redisClient.get(`${collectionName}:${id}`);
        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            const data = await collection.findOne({ _id: new ObjectId(id) });
            redisClient.set(`${collectionName}:${id}`, JSON.stringify(data), 'EX', 600);
            if (!data) {
                return res.status(404).json({ message: `No infraction found with id ${id}` });
            } else {
                return res.status(200).json(data);
            }
        }
    } catch (e) {
        console.error(e);
    }
});

const create = catchAsync(async (req, res) => {
    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        const createdAt = new Date();
        const updatedAt = new Date();
        const data = await collection.insertOne({
            ...value,
            createdAt,
            updatedAt,
        });
        res.status(201).json(data);
        redisClient.del(`${collectionName}:all`);
    } catch (err) {
        console.log(err);
    }
});

const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'No id provided' });
    }
    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        const updatedAt = new Date();
        const updateResult = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...value, updatedAt } }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ message: 'Infraction not found' });
        }

        const updatedDocument = await collection.findOne({ _id: new ObjectId(id) });
        res.status(200).json(updatedDocument);
        redisClient.del(`${collectionName}:all`);
        redisClient.del(`${collectionName}:${id}`);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});

const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;

    if (force === undefined || parseInt(force, 10) === 0) {
        const infraction = await collection.findOne({ _id: new ObjectId(id) });
        if (!isNaN(infraction?.deletedAt?.getTime())) {
            return res.status(200).json(infraction);
        }

        const data = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { deletedAt: new Date() } }
        );
        res.status(200).json(data);
        redisClient.del(`${collectionName}:all`);
        redisClient.del(`${collectionName}:${id}`);
    } else if (parseInt(force, 10) === 1) {
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            res.status(200).json(success(`🗑️ Suppression d'une infraction de manière physique`));
            redisClient.del(`${collectionName}:all`);
            redisClient.del(`${collectionName}:${id}`);
        } else {
            res.status(404).json({ message: 'Failed to delete' });
        }
    } else {
        res.status(400).json({ message: 'Malformed parameter "force"' });
    }
});

const deleteMany = catchAsync(async (req, res) => {
    const result = await collection.deleteMany({
        deletedAt: { $exists: true },
    });
    const deletedCount = result.deletedCount;
    if (!deletedCount) {
        return res.status(404).json({ message: 'Aucune donnée trouvée à supprimer.' });
    }
    redisClient.del(`${collectionName}:all`);
    res.status(200).json({ message: `${deletedCount} donnée(s) supprimée(s).` });
});

const restoreMany = catchAsync(async (req, res) => {
    const result = await collection.updateMany(
        { deletedAt: { $exists: true } },
        { $unset: { deletedAt: "" } }
    );
    const restoredCount = result.nModified;
    if (restoredCount === 0) {
        return res.status(404).json({ message: 'Aucune donnée trouvée à restaurer.' });
    }
    redisClient.del(`${collectionName}:all`);
    res.status(200).json({ message: `${restoredCount} données restaurées.` });
});

module.exports = {
    findAll,
    findOne,
    create,
    updateOne,
    deleteOne,
    deleteMany,
    restoreMany,
};
