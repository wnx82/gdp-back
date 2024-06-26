// ./controllers/quartiers.controller.js

const { dbClient, redisClient } = require('../../utils');
const { catchAsync, success } = require('../../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('quartiers');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'quartiers';

const schema = Joi.object({
    id: Joi.string().allow(null).optional().empty(''),
    title: Joi.string().required(),
    missions: Joi.array()
        .items(Joi.any().allow(null, '', Joi.object()))
        .min(1)
        .required(),
});

const findAll = catchAsync(async (req, res) => {
    const inCache = await redisClient.get(`${collectionName}:all`);
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const data = await collection.find({}).toArray();
        redisClient.set(
            `${collectionName}:all`,
            JSON.stringify(data),
            'EX',
            600
        );
        res.status(200).json(data);
    }
});

const findOne = catchAsync(async (req, res) => {
    try {
        const { id } = req.params;
        let data = null;

        data = await collection.findOne({ _id: new ObjectId(id) });
        if (!data) {
            return res.status(404).json({ message: `No quartier found with id ${id}` });
        }

        const inCache = await redisClient.get(`${collectionName}:${id}`);
        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            const pipeline = [
                {
                    $match: { _id: new ObjectId(id) },
                },
                {
                    $lookup: {
                        from: 'missions',
                        localField: 'missions',
                        foreignField: '_id',
                        as: 'missionsData',
                    },
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        titleMission: '$missionsData.title',
                        description: '$missionsData.description',
                        horaire: '$missionsData.horaire',
                        priority: '$missionsData.priority',
                        contact: '$missionsData.contact',
                    },
                },
                {
                    $group: {
                        _id: '$_id',
                        title: { $first: '$title' },
                        missions: {
                            $push: {
                                titleMissions: '$titleMission',
                                descriptions: '$description',
                                horaires: '$horaire',
                                priority: '$priority',
                                contacts: '$contact',
                            },
                        },
                    },
                },
            ];
            data = await collection.aggregate(pipeline).toArray();
            redisClient.set(
                `${collectionName}:${id}`,
                JSON.stringify(data),
                'EX',
                600
            );
        }
        if (!data) {
            return res.status(404).json({ message: `No quartier found with id ${id}` });
        } else {
            return res.status(200).json(data);
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
        // Vérifiez si les missions sont déjà des chaînes d'ID
        const missionsID = value.missions.map(p => new ObjectId(p));
        value.missions = missionsID;

        const { ...rest } = value;
        const createdAt = new Date();
        const updatedAt = new Date();
        console.log('INSERTING DATA:', { ...rest, createdAt, updatedAt });

        const data = await collection.insertOne({
            ...rest,
            createdAt,
            updatedAt,
        });
        console.log(`----------->Le quartier a bien été créé<-----------`);

        res.status(201).json(data);
        redisClient.del(`${collectionName}:all`);
        console.log('REDIS CACHE DELETED');
    } catch (err) {
        console.log('QUARTIER CREATION ERROR:', err);
        res.status(500).json({ message: 'Quartier creation failed' });
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
    let updateValue = { ...value };

    if (updateValue.missions) {
        updateValue.missions = updateValue.missions.map(mission => new ObjectId(mission));
    }
    // if (value.missions) {
    //     updateValue.missions = value.missions.map(m => new ObjectId(m._id));
    // }
    try {
        const updatedAt = new Date();
        const { modifiedCount } = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateValue, updatedAt } },
            { returnDocument: 'after' }
        );
        if (modifiedCount === 0) {
            return res.status(404).json({ message: 'Quartier not found' });
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
        const quartier = await collection.findOne({ _id: new ObjectId(id) });
        if (!isNaN(quartier?.deletedAt?.getTime())) {
            return res.status(200).json(quartier);
        }

        const references = await Promise.all([
            database.collection('dailies').findOne({ quartiers: new ObjectId(id) }),
            database.collection('rapports').findOne({ quartiers: new ObjectId(id) })
        ]);

        if (references.some(reference => reference !== null)) {
            return res.status(400).json({ message: 'Le quartier est référencé dans les dailies ou les rapports et ne peut pas être supprimé.' });
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
            res.status(200).json(success(`🗑️ Suppression d'un quartier de manière physique`));
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
        { $unset: { deletedAt: '' } }
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
