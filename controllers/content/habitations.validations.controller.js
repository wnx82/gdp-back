// ./controllers/validations.controller.js

const { dbClient, redisClient } = require('../../utils');
const { catchAsync, success } = require('../../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('validations');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'validations';
const sendHabitation = require('../../helpers/sendHabitation');

const schema = Joi.object({
    id: Joi.string().allow(null).optional().empty(''),
    agents: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .required(),
    habitation: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .allow(null)
        .optional()
        .empty(''),
    date: Joi.date().required(),
    note: Joi.string().allow(null).optional().empty(''),
});

const findAll = catchAsync(async (req, res) => {
    const inCache = await redisClient.get(`${collectionName}:all`);
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const pipeline = [
            {
                $lookup: {
                    from: 'agents',
                    localField: 'agents',
                    foreignField: '_id',
                    as: 'agentsData',
                },
            },
            {
                $lookup: {
                    from: 'habitations',
                    localField: 'habitation',
                    foreignField: '_id',
                    as: 'habitationData',
                },
            },
            {
                $unwind: {
                    path: '$habitationData',
                },
            },
            {
                $project: {
                    'agentsData._id': 1,
                    'agentsData.matricule': 1,
                    'habitationData._id': 1,
                    'habitationData.adresse.rue': 1,
                    'habitationData.adresse.numero': 1,
                    'habitationData.adresse.localite': 1,
                    note: 1,
                    date: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    deletedAt: 1,
                },
            },
            {
                $lookup: {
                    from: 'rues',
                    localField: 'habitationData.adresse.rue',
                    foreignField: '_id',
                    as: 'RueData',
                },
            },
            {
                $group: {
                    _id: '$_id',
                    date: { $first: '$date' },
                    note: { $first: '$note' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                    deletedAt: { $first: '$deletedAt' },
                    agents: {
                        $first: {
                            _id: '$agentsData._id',
                            matricule: '$agentsData.matricule',
                        },
                    },
                    habitation: {
                        $first: {
                            _id: '$habitationData._id',
                            adresse: {
                                rue: { $arrayElemAt: ['$RueData.nomComplet', 0] },
                                localite: { $arrayElemAt: ['$RueData.localite', 0] },
                                numero: '$habitationData.adresse.numero',
                            },
                        },
                    },
                },
            },
            {
                $sort: { date: -1 },
            },
        ];

        const data = await collection.aggregate(pipeline).toArray();
        redisClient.set(`${collectionName}:all`, JSON.stringify(data), 'EX', 600);
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
                return res.status(404).json({ message: `No validation found with id ${id}` });
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
        return res.status(400).json({ message: error.details.map(err => err.message).join(', ') });
    }

    try {
        const agentsID = value.agents.map(p => new ObjectId(p));
        value.agents = agentsID;

        const agents = await database.collection('agents').find({ _id: { $in: agentsID } }).toArray();
        if (agents.length !== agentsID.length) {
            return res.status(400).json({ message: 'Invalid agent ID provided' });
        }

        value.habitation = new ObjectId(value.habitation);
        const habitationVerif = await database.collection('habitations').findOne({ _id: value.habitation });
        if (!habitationVerif) {
            return res.status(400).json({ message: 'Invalid habitation ID provided' });
        }

        const createdAt = new Date();
        const updatedAt = new Date();
        const data = await collection.insertOne({ ...value, createdAt, updatedAt });
        res.status(201).json(data);
        redisClient.del(`${collectionName}:all`);

        const insertedId = data.insertedId;

        const result = await collection
            .aggregate([
                { $match: { _id: new ObjectId(insertedId) } },
                {
                    $lookup: {
                        from: 'agents',
                        localField: 'agents',
                        foreignField: '_id',
                        as: 'agentsData',
                    },
                },
                {
                    $lookup: {
                        from: 'habitations',
                        localField: 'habitation',
                        foreignField: '_id',
                        as: 'habitationData',
                    },
                },
                {
                    $unwind: { path: '$habitationData' },
                },
                {
                    $project: {
                        'agentsData._id': 1,
                        'agentsData.matricule': 1,
                        'habitationData._id': 1,
                        'habitationData.adresse.rue': 1,
                        'habitationData.adresse.numero': 1,
                        'habitationData.adresse.localite': 1,
                        note: 1,
                        date: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        deletedAt: 1,
                    },
                },
                {
                    $lookup: {
                        from: 'rues',
                        localField: 'habitationData.adresse.rue',
                        foreignField: '_id',
                        as: 'RueData',
                    },
                },
                {
                    $group: {
                        _id: '$_id',
                        date: { $first: '$date' },
                        note: { $first: '$note' },
                        createdAt: { $first: '$createdAt' },
                        updatedAt: { $first: '$updatedAt' },
                        deletedAt: { $first: '$deletedAt' },
                        agents: {
                            $first: {
                                _id: '$agentsData._id',
                                matricule: '$agentsData.matricule',
                            },
                        },
                        habitation: {
                            $first: {
                                _id: '$habitationData._id',
                                adresse: {
                                    rue: { $first: '$RueData.nomComplet' },
                                    localite: { $first: '$RueData.localite' },
                                    numero: '$habitationData.adresse.numero',
                                },
                            },
                        },
                    },
                },
            ])
            .next();

        if (result) {
            const { agents, habitation, note } = result;
            sendHabitation(agents, habitation, note);
        }
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
        return res.status(400).json({ message: error.details.map(d => d.message).join(', ') });
    }

    let updateValue = { ...value };
    if (updateValue.agents) {
        updateValue.agents = updateValue.agents.map(agent => new ObjectId(agent));
    }
    if (updateValue.habitation) {
        updateValue.habitation = new ObjectId(updateValue.habitation);
    }

    try {
        const updatedAt = new Date();
        const updateResult = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateValue, updatedAt } }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ message: 'Validation not found' });
        }

        const updatedDocument = await collection.findOne({ _id: new ObjectId(id) });
        if (!updatedDocument) {
            return res.status(404).json({ message: 'Validation not found after update' });
        }

        res.status(200).json(updatedDocument);
        redisClient.del(`${collectionName}:all`);
        redisClient.del(`${collectionName}:${id}`);
    } catch (err) {
        console.log('Server error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;
    if (force === undefined || parseInt(force, 10) === 0) {
        const validation = await collection.findOne({ _id: new ObjectId(id) });
        if (!isNaN(validation?.deletedAt?.getTime())) {
            return res.status(200).json(validation);
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
            res.status(200).json(success(`🗑️ Suppression d'une validation de manière physique`));
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
