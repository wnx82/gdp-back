// ./controllers/validations.controller.js

const { dbClient, redisClient } = require('../utils');
const { catchAsync, success } = require('../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('validations');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;

const sendHabitation = require('../helpers/sendHabitation');

const schema = Joi.object({
    agent: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .required(),
    habitation: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .required(),
    date: Joi.date().required(),
    note: Joi.string().allow(null).optional().empty(''),
});

const findAll = catchAsync(async (req, res) => {
    const message = '📄 Liste des validations';
    const inCache = await redisClient.get('validations:all');
    if (inCache) {
        return res.status(200).json(success(message, JSON.parse(inCache)));
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
                    agent: '$populatedAgent',
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
                    agent: 1,
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
        const message = `📄 Détails de la validation`;
        const { id } = req.params;
        let data = null;
        const inCache = await redisClient.get(`validation:${id}`);
        if (inCache) {
            return res.status(200).json(success(message, JSON.parse(inCache)));
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
    const message = `✏️ Création d'une validation`;

    const { body } = req;
    const { value, error } = schema.validate(body);

    if (error) {
        return res.status(400).json({ message: error });
    }
    try {
        const agentsID = value.agent.map(p => {
            return new ObjectId(p);
        });
        value.agent = agentsID;

        const habitationsID = value.habitation.map(p => {
            return new ObjectId(p);
        });
        value.habitation = habitationsID;

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
                    `----------->La validation a bien été créé<-----------`
                )
            );
        res.status(201).json(success(message, data));
        redisClient.del('validations:all');
        // Récupérer l'insertedId
        const insertedId = data.insertedId;

        // Récupération des données par aggregate et envoi de la validation par mail
        const { agentData, habitationData, note } = await collection
            .aggregate([
                {
                    $match: {
                        _id: new ObjectId(insertedId),
                    },
                },
                {
                    $lookup: {
                        from: 'agents',
                        localField: 'agent',
                        foreignField: '_id',
                        as: 'agentData',
                    },
                },
                {
                    $unwind: {
                        path: '$agentData',
                    },
                },
                {
                    $project: {
                        'agentData.matricule': 1,
                        habitation: 1,
                        note: 1,
                        date: 1,
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
                        'agentData.matricule': 1,
                        'habitationData.adresse.rue': 1,
                        habitation: 1,
                        note: 1,
                        date: 1,
                    },
                },
            ])
            .next();

        sendHabitation(agentData, habitationData, note);
    } catch (err) {
        console.log(err);
    }
});
const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'No id provided' });
    }
    const message = `📝 Mise à jour de la validation ${id}`;

    const { body } = req;

    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    let updateValue = { ...value };

    if (!value.agent) {
        delete updateValue.agent;
    } else {
        updateValue.agent = value.agent.map(value => new ObjectId(value));
    }
    if (!value.habitation) {
        delete updateValue.habitation;
    } else {
        updateValue.habitation = value.habitation.map(
            value => new ObjectId(value)
        );
    }
    try {
        const updatedAt = new Date();
        const { modifiedCount } = await collection.updateOne(
            { _id: ObjectId(id) },
            { $set: { ...updateValue, updatedAt } },
            { returnDocument: 'after' }
        );
        if (modifiedCount === 0) {
            return res.status(404).json({ message: 'Validation not found' });
        }
        res.status(200).json(success(message, value));
        redisClient.del('validations:all');
        redisClient.del(`validation:${id}`);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});

const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;
    if (force === undefined || parseInt(force, 10) === 0) {
        //Vérification si l'habitation a déjà été supprimée de manière logique
        const validation = await collection.findOne({ _id: new ObjectId(id) });
        if (!isNaN(validation.deletedAt)) {
            // Constat already deleted, return appropriate response
            const message = `La validation a déjà été supprimée de manière logique.`;
            return res.status(200).json(success(message, validation));
        }
        //suppression logique
        const message = `🗑️ Suppression d'une validation de manière logique`;
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
        const message = `🗑️ Suppression d'une validation de manière physique`;
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
