// ./controllers/rapports.controller.js

const { dbClient, redisClient } = require('../utils');
const { catchAsync, success } = require('../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('rapports');
const moment = require('moment');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;

const sendRapport = require('../helpers/sendRapport');

const schema = Joi.object({
    // daily: Joi.string().allow(null).optional().empty(''),
    daily: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    date: Joi.date().required(),
    agents: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .required(),
    horaire: Joi.string().allow(null).optional().empty(''),
    vehicule: Joi.string().allow(null).optional().empty(''),
    quartiers: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    missions: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    notes: Joi.array().items(Joi.string().allow(null).optional().empty('')),

    annexes: Joi.array()
        .items(Joi.string().allow(null).optional().empty(''))
        .optional(),
});

const findAll = catchAsync(async (req, res) => {
    const message = '📄 Liste des rapports';
    const inCache = await redisClient.get('rapports:all');
    if (inCache) {
        return res.status(200).json(success(message, JSON.parse(inCache)));
    } else {
        const data = await collection.find({}).toArray();
        redisClient.set('rapports:all', JSON.stringify(data), 'EX', 600);
        res.status(200).json(success(message, data));
    }
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = `📄 Détails du rapport`;
        const { id } = req.params;
        let data = null;
        const inCache = await redisClient.get(`rapport:${id}`);

        if (inCache) {
            return res.status(200).json(success(message, JSON.parse(inCache)));
        } else {
            data = await collection.findOne({ _id: new ObjectId(id) });
            redisClient.set(`rapport:${id}`, JSON.stringify(data), 'EX', 600);
        }

        if (!data) {
            res.status(404).json({
                message: `No rapport found with id ${id}`,
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
    const message = `✏️ Création d'un rapport`;

    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({
            message: error.details.map(err => err.message).join(', '),
        });
    }

    try {
        value.daily = new ObjectId(value.daily);
        const agentsID = value.agents.map(p => {
            return new ObjectId(p);
        });
        value.agents = agentsID;
        const quartiersID = value.quartiers.map(p => {
            return new ObjectId(p);
        });
        value.quartiers = quartiersID;
        const missionsID = value.missions.map(p => {
            return new ObjectId(p);
        });
        value.missions = missionsID;

        const { ...rest } = value;
        const createdAt = new Date();
        const updatedAt = new Date();
        const donnees = await collection
            .insertOne({
                ...rest,
                createdAt,
                updatedAt,
            })
            .then(
                console.log(
                    `----------->Le rapport a bien été créé<-----------`
                )
            );
        res.status(201).json(success(message, donnees));
        redisClient.del('rapports:all');
        // Récupérer l'insertedId
        const insertedId = donnees.insertedId;

        // Récupération des données par aggregate et envoi de la validation par mail
        const { data } = await collection
            .aggregate([
                {
                    $match: {
                        _id: new ObjectId(insertedId),
                    },
                },
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
                        from: 'missions',
                        localField: 'missions',
                        foreignField: '_id',
                        as: 'missionsData',
                    },
                },
                {
                    $lookup: {
                        from: 'quartiers',
                        localField: 'quartiers',
                        foreignField: '_id',
                        as: 'quartiersData',
                    },
                },
                {
                    $project: {
                        date: 1,
                        horaire: 1,
                        vehicule: 1,
                        habitation: 1,
                        notes: 1,
                        annexes: 1,
                        'agentsData.matricule': 1,
                        'agentsData.lastname': 1,
                        'agentsData.firstname': 1,
                        'quartiersData.title': 1,
                        'missionsData.title': 1,
                        createdAt: 1,
                    },
                },
                {
                    $group: {
                        _id: '$_id',
                        data: {
                            $push: {
                                date: '$date',
                                horaire: '$horaire',
                                vehicule: '$vehicule',
                                notes: '$notes',
                                annexes: '$annexes',
                                matricules: '$agentsData.matricule',
                                lastnames: '$agentsData.lastname',
                                firstnames: '$agentsData.firstname',
                                quartiers: '$quartiersData.title',
                                missions: '$missionsData.title',
                                createdAt: '$createdAt',
                            },
                        },
                    },
                },
            ])
            .next();
        // console.log(data);
        sendRapport(insertedId, data[0]);
        // console.log(data[0].matricules);
    } catch (err) {
        console.log(err);
    }
});
const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'No id provided' });
    }
    const message = `📝 Mise à jour du rapport ${id}`;
    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        console.log(error);
        const errors = error.details.map(d => d.message);
        return res.status(400).json({ message: 'Validation error', errors });
    }
    let updateValue = { ...value };
    updateValue.daily = new ObjectId(updateValue.daily);
    if (!value.daily) {
        delete updateValue.daily;
    } else {
        updateValue.daily = value.daily.map(value => new ObjectId(value));
    }

    if (!value.agents) {
        delete updateValue.agents;
    } else {
        updateValue.agents = value.agents.map(value => new ObjectId(value));
    }
    if (!value.quartiers) {
        delete updateValue.quartiers;
    } else {
        updateValue.quartiers = value.quartiers.map(
            value => new ObjectId(value)
        );
    }
    if (!value.missions) {
        delete updateValue.missions;
    } else {
        updateValue.missions = value.missions.map(value => new ObjectId(value));
    }

    try {
        const updatedAt = new Date();
        const { modifiedCount } = await collection.findOneAndUpdate(
            { _id: ObjectId(id) },
            { $set: { ...updateValue, updatedAt } },
            { returnDocument: 'after' }
        );
        if (modifiedCount === 0) {
            return res.status(404).json({ message: 'Constat not found' });
        }
        res.status(200).json(success(message, value));
        redisClient.del('rapports:all');
        redisClient.del(`rapport:${id}`);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});
const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;
    if (force === undefined || parseInt(force, 10) === 0) {
        //Vérification si le rapport a déjà été supprimé de manière logique
        const rapport = await collection.findOne({ _id: new ObjectId(id) });
        if (!isNaN(rapport.deletedAt)) {
            // Constat already deleted, return appropriate response
            const message = `Le rapport a déjà été supprimé de manière logique.`;
            return res.status(200).json(success(message, rapport));
        }
        //suppression logique
        const message = `🗑️ Suppression d'un rapport de manière logique`;
        const data = await collection.updateOne(
            {
                _id: new ObjectId(id),
            },
            {
                $set: { deletedAt: new Date() },
            }
        );
        res.status(200).json(success(message, data));
        redisClient.del('rapports:all');
        redisClient.del(`rapport:${id}`);
    } else if (parseInt(force, 10) === 1) {
        //suppression physique
        const message = `🗑️ Suppression d'un rapport de manière physique`;
        console.log('suppression physique/valeur force:' + force);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            console.log('Successfully deleted');
            res.status(200).json(success(message));
            redisClient.del('rapports:all');
            redisClient.del(`rapport:${id}`);
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
