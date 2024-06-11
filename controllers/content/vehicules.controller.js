const { dbClient, redisClient } = require('../../utils');
const { catchAsync, success } = require('../../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('vehicules');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'vehicules';

const schema = Joi.object({
    id: Joi.string().allow(null).optional().empty(''),
    marque: Joi.string().allow(null).optional().empty(''),
    modele: Joi.string().allow(null).optional().empty(''),
    immatriculation: Joi.string().allow(null).optional().empty(''),
});

const findAll = catchAsync(async (req, res) => {
    const inCache = await redisClient.get(`${collectionName}:all`);
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const data = await collection.find({}).toArray();
        redisClient.set(`${collectionName}:all`, JSON.stringify(data), 'EX', 600);
        return res.status(200).json(data);
    }
});

const findOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const inCache = await redisClient.get(`${collectionName}:${id}`);
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const data = await collection.findOne({ _id: new ObjectId(id) });
        if (!data) {
            return res.status(404).json({ message: `⛔ No vehicule found with id ${id}` });
        }
        redisClient.set(`${collectionName}:${id}`, JSON.stringify(data), 'EX', 600);
        return res.status(200).json(data);
    }
});

const create = catchAsync(async (req, res) => {
    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({ message: error.details.map(err => err.message).join(', ') });
    }

    try {
        const createdAt = new Date();
        const updatedAt = new Date();
        const data = await collection.insertOne({ ...value, createdAt, updatedAt });
        console.log(`----------->Le vehicule a bien été créé<-----------`);
        res.status(201).json(data);
        redisClient.del(`${collectionName}:all`);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
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
        return res.status(400).json({ message: error.details.map(d => d.message).join(', ') });
    }

    try {
        const updatedAt = new Date();
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...value, updatedAt } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Vehicule not found' });
        }

        res.status(200).json(value);
        redisClient.del(`${collectionName}:all`);
        redisClient.del(`${collectionName}:${id}`);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;

    if (force === undefined || parseInt(force, 10) === 0) {
        const vehicule = await collection.findOne({ _id: new ObjectId(id) });
        if (!vehicule) {
            return res.status(404).json({ message: 'Vehicule not found' });
        }
        if (vehicule.deletedAt) {
            return res.status(200).json(vehicule);
        }

        const data = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { deletedAt: new Date() } }
        );
        redisClient.del(`${collectionName}:all`);
        redisClient.del(`${collectionName}:${id}`);
        return res.status(200).json(data);
    } else if (parseInt(force, 10) === 1) {
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            redisClient.del(`${collectionName}:all`);
            redisClient.del(`${collectionName}:${id}`);
            return res.status(200).json(success('🗑️ Suppression d\'une vehicule de manière physique'));
        } else {
            return res.status(404).json({ message: 'Failed to delete' });
        }
    } else {
        return res.status(400).json({ message: 'Malformed parameter "force"' });
    }
});

const deleteMany = catchAsync(async (req, res) => {
    const result = await collection.deleteMany({ deletedAt: { $exists: true } });
    const deletedCount = result.deletedCount;
    if (!deletedCount) {
        return res.status(404).json({ message: 'Aucune donnée trouvée à supprimer.' });
    }
    redisClient.del(`${collectionName}:all`);
    return res.status(200).json({ message: `${deletedCount} donnée(s) supprimée(s).` });
});

const restoreMany = catchAsync(async (req, res) => {
    const result = await collection.updateMany(
        { deletedAt: { $exists: true } },
        { $unset: { deletedAt: '' } }
    );
    const restoredCount = result.nModified;
    if (restoredCount === 0) {
        return res.status(404).json({ message: 'Aucune donnée trouvée à restaurer.' });
    }
    redisClient.del(`${collectionName}:all`);
    return res.status(200).json({ message: `${restoredCount} données restaurées.` });
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