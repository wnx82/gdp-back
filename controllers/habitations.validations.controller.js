// ./controllers/validations.controller.js

const { dbClient, redisClient } = require('../utils');
const { catchAsync, success } = require('../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('validations');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'validations';
const sendHabitation = require('../helpers/sendHabitation');

const schema = Joi.object({
    id: Joi.string().allow(null).optional().empty(''),
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
    const inCache = await redisClient.get(`${collectionName}:all`);
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
                    deletedAt: 1,
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
                    deletedAt: 1,
                },
            },
            {
                $lookup: {
                    from: 'rues',
                    localField: 'habitation.adresse.rue',
                    foreignField: '_id',
                    as: 'DataRue',
                },
            },
            {
                $addFields: {
                    'habitation.adresse.rue': {
                        $first: '$DataRue.nomComplet',
                    },
                    'habitation.adresse.quartier': {
                        $first: '$DataRue.quartier',
                    },
                    'habitation.adresse.cp': {
                        $first: '$DataRue.cp',
                    },
                    'habitation.adresse.localite': {
                        $first: '$DataRue.localite',
                    },
                },
            },
        ];
        const data = await collection.aggregate(pipeline).toArray();
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
        const message = `📄 Détails de la validation`;
        const { id } = req.params;
        let data = null;
        data = await collection.findOne({ _id: new ObjectId(id) });
        if (!data) {
            res.status(404).json({
                message: `⛔ No validation found with id ${id}`,
            });
            return;
        }
        const inCache = await redisClient.get(`${collectionName}:${id}`);
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
            res.status(200).json(data);
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
        const agents = await database
            .collection('agents')
            .find({
                _id: { $in: agentsID },
            })
            .toArray();
        const habitations = await database
            .collection('habitations')
            .find({
                _id: { $in: habitationsID },
            })
            .toArray();

        if (agents.length !== agentsID.length) {
            return res
                .status(400)
                .json({ message: 'Invalid agent ID provided' });
        }
        if (habitations.length !== habitationsID.length) {
            return res
                .status(400)
                .json({ message: 'Invalid habitation ID provided' });
        }

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
        res.status(201).json(data);
        redisClient.del(`${collectionName}:all`);
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
        //Vérification si l'habitation a déjà été supprimée de manière logique
        const validation = await collection.findOne({ _id: new ObjectId(id) });
        if (!isNaN(validation.deletedAt)) {
            // Constat already deleted, return appropriate response
            const message = `La validation a déjà été supprimée de manière logique.`;
            return res.status(200).json(validation);
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
        res.status(200).json(data);
        redisClient.del(`${collectionName}:all`);
        redisClient.del(`${collectionName}:${id}`);
    } else if (parseInt(force, 10) === 1) {
        //suppression physique
        const message = `🗑️ Suppression d'une validation de manière physique`;
        console.log('suppression physique/valeur force:' + force);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            console.log('Successfully deleted');
            res.status(200).json(success(message));
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
    const result = await collection(collectionName).deleteMany({
        deletedAt: { $exists: true },
    });
    const deletedCount = result.deletedCount;
    if (!deletedCount) {
        return res
            .status(404)
            .json({ message: 'Aucune donnée trouvée à supprimer.' });
    }
    redisClient.del(`${collectionName}:all`);
    res.status(200).json({
        message: `${deletedCount} donnée(s) supprimée(s).`,
    });
});

module.exports = {
    findAll,
    findOne,
    create,
    updateOne,
    deleteOne,
    deleteMany,
};
