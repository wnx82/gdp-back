// ./controllers/validations.controller.js

// const dbClient = require('../utils/').dbClient;
const { dbClient, redisClient } = require('../utils');
const { catchAsync, success } = require('../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('validations');
const moment = require('moment');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;

const findAll = catchAsync(async (req, res) => {
    const message = 'Liste des validations';
    const inCache = await redisClient.get('validations:all');
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const pipeline = [
            {
                $lookup: {
                    from: 'agents',
                    localField: 'agent',
                    foreignField: '_id',
                    as: 'populatedAgent',
                },
            },
            {
                $project: {
                    agents: '$populatedAgent',
                    habitation: 1,
                    message: 1,
                    date: 1,
                    createdAt: 1,
                    updateAt: 1,
                },
            },
            {
                $lookup: {
                    from: 'habitations',
                    localField: 'habitation',
                    foreignField: '_id',
                    as: 'populatedHabitation',
                },
            },
            {
                $project: {
                    agents: 1,
                    habitation: '$populatedHabitation',
                    message: 1,
                    date: 1,
                    createdAt: 1,
                    updateAt: 1,
                },
            },
        ];
        const data = await collection.aggregate(pipeline).toArray();
        redisClient.set('validations:all', JSON.stringify(data), 'EX', 600);
        res.status(200).json(success(message, data));
    }
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = `Détails de la validation`;
        const { id } = req.params;
        let data = null;
        const inCache = await redisClient.get(`validation:${id}`);
        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            data = await collection.findOne({ _id: new ObjectId(id) });
            redisClient.set(
                `validation:${id}`,
                JSON.stringify(data),
                'EX',
                600
            );
        }
        if (!data) {
            res.status(404).json({
                message: `No validation found with id ${id}`,
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
    const message = `Création d'une validation`;
    const schema = Joi.object({
        message: Joi.string(),
        date: Joi.date().required(),
        agent: Joi.objectId().required(),
        habitation: Joi.objectId().required(),
    });
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
                    `----------->La validation a bien été créé<-----------`
                )
            );
        res.status(201).json(success(message, data));
        console.log('on efface le redis');
        redisClient.del('validations:all');
    } catch (err) {
        console.log(err);
    }
});
const updateOne = catchAsync(async (req, res) => {
    const message = `Modification d'une validation`;
    const { id } = req.params;
    const { body } = req;
    const schema = Joi.object({
        message: Joi.string(),
        date: Joi.date().required(),
        agent: Joi.objectId().required(),
        habitation: Joi.objectId().required(),
    });

    const { value, error } = schema.validateAsync(body);
    if (error) {
        res.status(400).json(error);
    }

    const pipeline = [
        { $match: { _id: ObjectId(id) } },
        { $set: body },
        { $set: { updated_at: new Date() } },
        { $project: { _id: 1 } },
    ];

    const data = await collection.aggregate(pipeline).toArray();
    const updatedDoc = await collection.findOne({ _id: ObjectId(id) });
    res.status(200).json(success(message, updatedDoc));
    redisClient.del(`validation:${id}`);
});

const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;
    if (force === undefined || parseInt(force, 10) === 0) {
        //suppression logique
        const message = `Suppression d'une validation de manière logique`;
        const data = await collection.updateOne(
            {
                _id: new ObjectId(id),
            },
            {
                $set: { deletedAt: new Date() },
            }
        );
        res.status(200).json(success(message, data));
        redisClient.del('validations:all');
        redisClient.del(`validation:${id}`);
    } else if (parseInt(force, 10) === 1) {
        //suppression physique
        const message = `Suppression d'une validation de manière physique`;
        console.log('suppression physique/valeur force:' + force);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            console.log('Successfully deleted');
            res.status(200).json(success(message));
            redisClient.del('validations:all');
            redisClient.del(`validation:${id}`);
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
