// ./controllers/rues.controller.js

// const dbClient = require('../utils/').dbClient;
const { dbClient, redisClient } = require('../utils');
const { catchAsync, success } = require('../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('rues');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;

const schema = Joi.object({
    nom: Joi.string().allow(null).optional().empty(''),
    denomination: Joi.string().allow(null).optional().empty(''),
    quartier: Joi.string().allow(null).optional().empty(''),
    cp: Joi.number().allow(null).optional().empty(''),
    localite: Joi.string().allow(null).optional().empty(''),
    codeRue: Joi.string().allow(null).optional().empty(''),
    traductionNl: Joi.string().allow(null).optional().empty(''),
    xMin: Joi.alternatives().try(Joi.string().empty(''), Joi.number()),
    xMax: Joi.alternatives().try(Joi.string().empty(''), Joi.number()),
    yMin: Joi.alternatives().try(Joi.string().empty(''), Joi.number()),
    yMax: Joi.alternatives().try(Joi.string().empty(''), Joi.number()),
    idTronconCentral: Joi.string().allow(null).optional().empty(''),
});
const findAll = catchAsync(async (req, res, next) => {
    let { localite } = req.query;
    let { cp } = req.query;
    let { nom } = req.query;
    let { quartier } = req.query;
    let { page = 1, pageSize = 10 } = req.query; // ajouter les paramètres de pagination page et pageSize

    const skip = (page - 1) * pageSize; // calculer le nombre d'éléments à sauter
    const limit = parseInt(pageSize); // convertir la valeur de pageSize en entier

    if (localite) {
        // votre code pour localite
        const data = await collection
            .aggregate([
                {
                    $match: {
                        localite: localite,
                    },
                },
                { $skip: skip }, // ajouter la pagination
                { $limit: limit },
            ])
            .toArray();

        res.status(200).json(data);
        return;
    }

    if (cp) {
        // votre code pour cp
        const data = await collection
            .aggregate([
                {
                    $match: {
                        cp: postalCode,
                    },
                },
                { $skip: skip }, // ajouter la pagination
                { $limit: limit },
            ])
            .toArray();

        res.status(200).json(data);
        return;
    }

    if (nom) {
        // votre code pour nom
        const data = await collection
            .aggregate([
                {
                    $match: {
                        nom: {
                            $regex: nom,
                            $options: 'i',
                        },
                    },
                },
                { $skip: skip }, // ajouter la pagination
                { $limit: limit },
            ])
            .toArray();

        res.status(200).json(data);
        return;
    }

    if (quartier) {
        // votre code pour quartier
        const data = await collection
            .aggregate([
                {
                    $match: {
                        quartier: {
                            $regex: quartier,
                            $options: 'i',
                        },
                    },
                },
                { $skip: skip }, // ajouter la pagination
                { $limit: limit },
            ])
            .toArray();

        res.status(200).json(data);
        return;
    }

    // votre code pour la liste complète
    const data = await collection
        .find({})
        .skip(skip) // ajouter la pagination
        .limit(limit)
        .toArray();

    res.status(200).json(data);
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = `📄 Détails de la rue`;
        const { id } = req.params;
        let data = null;
        data = await collection.findOne({ _id: new ObjectId(id) });
        if (!data) {
            res.status(404).json({
                message: `⛔ No street found with id ${id}`,
            });
            return;
        }
        const inCache = await redisClient.get(`rue:${id}`);

        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            data = await collection.findOne({ _id: new ObjectId(id) });
            redisClient.set(`rue:${id}`, JSON.stringify(data), 'EX', 600);
        }

        if (!data) {
            res.status(404).json({
                message: `No street found with id ${id}`,
            });
            return;
        } else {
            res.status(200).json(data);
        }
    } catch (e) {
        console.error(e);
    }
});
const create = catchAsync(async (req, res) => {
    const message = `✏️ Création d'une rue`;

    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({
            message: error.details.map(err => err.message).join(', '),
        });
    }

    try {
        const { ...rest } = value;
        const createdAt = new Date();
        const updatedAt = new Date();
        const data = await collection
            .insertOne({
                ...rest,
                createdAt,
                updatedAt,
            })
            .then();
        res.status(201).json(data);
        console.log(`--> 📝 Rue ${data.insertedId} créée`);
        redisClient.del('rues:all');
    } catch (err) {
        console.log(err);
    }
});
const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'No id provided' });
    }
    const message = `📝 Mise à jour de la rue ${id}`;
    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        console.log(error);
        const errors = error.details.map(d => d.message);
        return res.status(400).json({ message: 'Validation error', errors });
    }
    let updateValue = { ...value };

    try {
        // Vérifier si l'ID de la rue existe dans la collection
        const rue = await collection.findOne({ _id: ObjectId(id) });
        if (!rue) {
            return res.status(404).json({ message: 'ID Street not found' });
        }

        const updatedAt = new Date();
        const { modifiedCount } = await collection.findOneAndUpdate(
            { _id: ObjectId(id) },
            { $set: { ...updateValue, updatedAt } },
            { returnDocument: 'after' }
        );
        if (modifiedCount === 0) {
            return res.status(404).json({ message: 'Street not modified' });
        }
        res.status(200).json(value);
        redisClient.del('rues:all');
        redisClient.del(`rue:${id}`);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});
const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;
    if (force === undefined || parseInt(force, 10) === 0) {
        //Vérification si le rue a déjà été supprimé de manière logique
        const rue = await collection.findOne({ _id: new ObjectId(id) });
        if (!isNaN(rue.deletedAt)) {
            // Constat already deleted, return appropriate response
            const message = `🗑️ La rue a déjà été supprimée de manière logique.`;
            return res.status(200).json(rue);
        }
        //suppression logique
        const message = `🗑️ Suppression d'une rue de manière logique`;
        const data = await collection.updateOne(
            {
                _id: new ObjectId(id),
            },
            {
                $set: { deletedAt: new Date() },
            }
        );
        res.status(200).json(data);
        redisClient.del('rues:all');
        redisClient.del(`rue:${id}`);
    } else if (parseInt(force, 10) === 1) {
        //suppression physique
        const message = `🗑️ Suppression d'une rue de manière physique`;
        console.log('suppression physique/valeur force:' + force);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            console.log('Successfully deleted');
            res.status(200).json(success(message));
            redisClient.del('rues:all');
            redisClient.del(`rue:${id}`);
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
