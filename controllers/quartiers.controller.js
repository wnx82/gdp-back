// ./controllers/quartiers.controller.js

// const dbClient = require('../utils/').dbClient;
const { dbClient, redisClient } = require('../utils');
const { catchAsync, success } = require('../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('quartiers');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;

const findAll = catchAsync(async (req, res) => {
    const message = '📄 Liste des quartiers';
    const inCache = await redisClient.get('quartiers:all');
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const data = await collection.find({}).toArray();
        redisClient.set('quartiers:all', JSON.stringify(data), 'EX', 600);
        res.status(200).json(data);
    }
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = `📄 Détails du quartier`;
        const { id } = req.params;
        let data = null;

        data = await collection.findOne({ _id: new ObjectId(id) });
        if (!data) {
            res.status(404).json({
                message: `No quartier found with id ${id}`,
            });
            return;
        }
        const inCache = await redisClient.get(`quartier:${id}`);
        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            const pipeline = [
                {
                    $match: {
                        _id: new ObjectId(id),
                    },
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
                        title: {
                            $first: '$title',
                        },
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
            redisClient.set(`quartier:${id}`, JSON.stringify(data), 'EX', 600);
        }
        if (!data) {
            res.status(404).json({
                message: `⛔ No quartier found with id ${id}`,
            });
            return;
        } else {
            res.status(200).json(data);
        }
    } catch (e) {
        console.error(e);
    }
});
const schema = Joi.object({
    title: Joi.string().required(),
    missions: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .required(),
});

const create = catchAsync(async (req, res) => {
    const message = `✏️ Création d'un quartier`;

    const { body } = req;
    const { value, error } = schema.validate(body);
    // Handle validation errors
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    try {
        const missionsID = value.missions.map(p => {
            return new ObjectId(p);
        });
        value.missions = missionsID;
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
                    `----------->Le quartier a bien été créé<-----------`
                )
            );
        // res.status(201).json(data);
        res.status(201).json(data);
        redisClient.del('quartiers:all');
    } catch (err) {
        console.log(err);
    }
});

const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'No id provided' });
    }
    const message = `📝 Mise à jour du quartier ${id}`;

    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    let updateValue = { ...value };

    if (!value.missions) {
        delete updateValue.missions;
    } else {
        updateValue.missions = value.missions.map(value => new ObjectId(value));
    }
    try {
        const updatedAt = new Date();
        const { modifiedCount } = await collection.updateOne(
            { _id: ObjectId(id) },
            { $set: { ...updateValue, updatedAt } },
            { returnDocument: 'after' }
        );
        if (modifiedCount === 0) {
            return res.status(404).json({ message: 'Quartier not found' });
        }
        res.status(200).json(value);
        redisClient.del('quartiers:all');
        redisClient.del(`quartier:${id}`);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});

const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;

    if (force === undefined || parseInt(force, 10) === 0) {
        //Vérification si le quartier a déjà été supprimé de manière logique
        const quartier = await collection.findOne({ _id: new ObjectId(id) });
        redisClient.flushall();
        if (!isNaN(quartier.deletedAt)) {
            // Quartier already deleted, return appropriate response
            const message = `La quartier a déjà été supprimé de manière logique.`;
            return res.status(200).json(quartier);
        }

        //suppression logique

        const message = `🗑️ Suppression d'une quartier de manière logique`;
        const data = await collection.findOneAndUpdate(
            {
                _id: new ObjectId(id),
            },
            {
                $set: { deletedAt: new Date() },
            }
        );
        res.status(200).json(data);
        redisClient.del('quartiers:all');
        redisClient.del(`quartier:${id}`);
        // res.status(200).json({
        //     message: "Le quartier a bien été supprimé de manière logique.",
        //     result,
        // });
    } else if (parseInt(force, 10) === 1) {
        //suppression physique
        const message = `🗑️ Suppression d'un quartier de manière physique`;
        console.log('suppression physique/valeur force:' + force);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            console.log('Successfully deleted');
            res.status(200).json(success(message));
            redisClient.del('quartiers:all');
            redisClient.del(`quartier:${id}`);
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
