const { dbClient, redisClient } = require('../../utils');
const { catchAsync, success } = require('../../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('rues');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'rues';

const schema = Joi.object({
    id: Joi.string().allow(null).optional().empty(''),
    nom: Joi.string().allow(null).optional().empty(''),
    denomination: Joi.string().allow(null).optional().empty(''),
    nomComplet: Joi.string().allow(null).optional().empty(''),
    quartier: Joi.string().allow(null).optional().empty(''),
    cp: Joi.number().allow(null).optional().empty(''),
    localite: Joi.string().allow(null).optional().empty(''),
    codeRue: Joi.string().allow(null).optional().empty(''),
    traductionNl: Joi.string().allow(null).optional().empty(''),
    xMin: Joi.alternatives().try(
        Joi.string().allow(null).optional().empty(''),
        Joi.number()
    ),
    xMax: Joi.alternatives().try(
        Joi.string().allow(null).optional().empty(''),
        Joi.number()
    ),
    yMin: Joi.alternatives().try(
        Joi.string().allow(null).optional().empty(''),
        Joi.number()
    ),
    yMax: Joi.alternatives().try(
        Joi.string().allow(null).optional().empty(''),
        Joi.number()
    ),
    idTronconCentral: Joi.string().allow(null).optional().empty(''),
});

const findAll = catchAsync(async (req, res) => {
    const { localite, cp, nom, quartier } = req.query;

    if (localite) {
        const formattedLocalite = localite.charAt(0).toUpperCase() + localite.slice(1);
        const inCache = await redisClient.get(`${collectionName}:${formattedLocalite}`);
        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            const data = await collection.aggregate([{ $match: { localite: formattedLocalite } }]).toArray();
            redisClient.set(`${collectionName}:${formattedLocalite}`, JSON.stringify(data), 'EX', 600);
            return res.status(200).json(data);
        }
    }

    if (cp) {
        const postalCode = parseInt(cp);
        const inCache = await redisClient.get(`${collectionName}:${cp}`);
        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            const data = await collection.aggregate([{ $match: { cp: postalCode } }]).toArray();
            redisClient.set(`${collectionName}:${cp}`, JSON.stringify(data), 'EX', 600);
            return res.status(200).json(data);
        }
    }

    if (nom) {
        const inCache = await redisClient.get(`${collectionName}:${nom}`);
        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            const data = await collection.aggregate([
                { $match: { nom: { $regex: nom, $options: 'i' } } }
            ]).toArray();
            redisClient.set(`${collectionName}:${nom}`, JSON.stringify(data), 'EX', 600);
            return res.status(200).json(data);
        }
    }

    if (quartier) {
        const inCache = await redisClient.get(`${collectionName}:${quartier}`);
        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            const data = await collection.aggregate([
                { $match: { quartier: { $regex: quartier, $options: 'i' } } }
            ]).toArray();
            redisClient.set(`${collectionName}:${quartier}`, JSON.stringify(data), 'EX', 600);
            return res.status(200).json(data);
        }
    }

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
            return res.status(404).json({ message: `⛔ No street found with id ${id}` });
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
        const { ...rest } = value;
        const createdAt = new Date();
        const updatedAt = new Date();
        const data = await collection.insertOne({ ...rest, createdAt, updatedAt });
        res.status(201).json(data);
        redisClient.del(`${collectionName}:all`);
    } catch (err) {
        console.log(err);
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
        const rue = await collection.findOne({ _id: new ObjectId(id) });
        if (!rue) {
            return res.status(404).json({ message: 'ID Street not found' });
        }

        const updatedAt = new Date();
        const { modifiedCount } = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...value, updatedAt } }
        );

        if (modifiedCount === 0) {
            return res.status(404).json({ message: 'Street not modified' });
        }

        res.status(200).json(value);
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
        const rue = await collection.findOne({ _id: new ObjectId(id) });
        if (!rue) {
            return res.status(404).json({ message: 'Street not found' });
        }
        if (rue.deletedAt) {
            return res.status(200).json(rue);
        }

        const references = await database.collection('constats').findOne({ 'adresse.rue': new ObjectId(id) });
        if (references) {
            return res.status(400).json({ message: 'La rue est référencée dans d\'autres tables et ne peut pas être supprimée.' });
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
            return res.status(200).json(success('🗑️ Suppression d\'une rue de manière physique'));
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