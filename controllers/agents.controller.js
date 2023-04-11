// ./controllers/agents.controller.js

// const dbClient = require('../utils/').dbClient;
const { dbClient, redisClient } = require('../utils/');
const { catchAsync, success } = require('../helpers/');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('agents');
const bcrypt = require('bcrypt');
const moment = require('moment');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'agents';

const schema = Joi.object({
    id: Joi.string().allow(null).optional().empty(''),
    email: Joi.string().email().required().max(200),
    password: Joi.string().required(),
    userAccess: Joi.number().integer().min(0).max(10).required(),
    matricule: Joi.number().integer().min(0).max(999).required(),
    firstname: Joi.string().max(25).allow(null).optional().empty(''),
    lastname: Joi.string().allow(null).optional().empty(''),
    birthday: Joi.date().allow(null).optional().empty(''),
    tel: Joi.string().max(30).allow(null).optional().empty(''),
    iceContact: Joi.string().required(),
    adresse: {
        rue: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .allow(null)
            .optional(),
        numero: Joi.string().allow(null).optional().empty(''),
    },
    picture: Joi.string().allow(null).optional().empty(''),
    formations: Joi.array(),
});
const findAll = catchAsync(async (req, res) => {
    const message = '📄 Liste des agents';
    const inCache = await redisClient.get(`${collectionName}:all`);
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const pipeline = [
            {
                $project: {
                    password: 0,
                },
            },
            {
                $lookup: {
                    from: 'rues',
                    localField: 'adresse.rue',
                    foreignField: '_id',
                    as: 'adresseData',
                },
            },
            {
                $project: {
                    _id: 1,
                    email: 1,
                    matricule: 1,
                    firstname: 1,
                    lastname: 1,
                    birthday: 1,
                    tel: 1,
                    iceContact: 1,
                    picture: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    deletedAt: 1,
                    formations: 1,
                    'adresse.numero': 1,
                    'adresseData.nom': 1,
                    'adresseData.denomination': 1,
                    'adresseData.nomComplet': 1,
                    'adresseData.quartier': 1,
                    'adresseData.cp': 1,
                    'adresseData.localite': 1,
                },
            },
            {
                $group: {
                    _id: '$_id',
                    email: {
                        $first: '$email',
                    },
                    matricule: {
                        $first: '$matricule',
                    },
                    firstname: {
                        $first: '$firstname',
                    },
                    lastname: {
                        $first: '$lastname',
                    },
                    birthday: {
                        $first: '$birthday',
                    },
                    tel: {
                        $first: '$tel',
                    },
                    iceContact: {
                        $first: '$iceContact',
                    },
                    picture: {
                        $first: '$picture',
                    },
                    formations: {
                        $first: '$formations',
                    },
                    createdAt: {
                        $first: '$createdAt',
                    },
                    updatedAt: {
                        $first: '$updatedAt',
                    },
                    deletedAt: {
                        $first: '$deletedAt',
                    },
                    adresse: {
                        $push: {
                            numero: '$adresse.numero',
                            nom: {
                                $first: '$adresseData.nom',
                            },
                            denomination: {
                                $first: '$adresseData.denomination',
                            },
                            nomComplet: {
                                $first: '$adresseData.nomComplet',
                            },
                            quartier: {
                                $first: '$adresseData.quartier',
                            },
                            cp: {
                                $first: '$adresseData.cp',
                            },
                            localite: {
                                $first: '$adresseData.localite',
                            },
                        },
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
        const message = `📄 Détails de l'agent`;
        const { id } = req.params;
        let data;
        data = await collection.findOne({ _id: new ObjectId(id) });
        if (!data) {
            res.status(404).json({
                message: `⛔ No agent found with id ${id}`,
            });
            return;
        }
        const inCache = await redisClient.get(`${collectionName}:${id}`);
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
                    $project: {
                        password: 0,
                    },
                },
                {
                    $lookup: {
                        from: 'rues',
                        localField: 'adresse.rue',
                        foreignField: '_id',
                        as: 'adresseData',
                    },
                },
                {
                    $project: {
                        _id: 1,
                        email: 1,
                        matricule: 1,
                        firstname: 1,
                        lastname: 1,
                        birthday: 1,
                        tel: 1,
                        iceContact: 1,
                        picture: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        deletedAt: 1,
                        formations: 1,
                        'adresse.numero': 1,
                        'adresseData.nom': 1,
                        'adresseData.denomination': 1,
                        'adresseData.nomComplet': 1,
                        'adresseData.quartier': 1,
                        'adresseData.cp': 1,
                        'adresseData.localite': 1,
                    },
                },
                {
                    $group: {
                        _id: '$_id',
                        email: {
                            $first: '$email',
                        },
                        matricule: {
                            $first: '$matricule',
                        },
                        firstname: {
                            $first: '$firstname',
                        },
                        lastname: {
                            $first: '$lastname',
                        },
                        birthday: {
                            $first: '$birthday',
                        },
                        tel: {
                            $first: '$tel',
                        },
                        iceContact: {
                            $first: '$iceContact',
                        },
                        picture: {
                            $first: '$picture',
                        },
                        formations: {
                            $first: '$formations',
                        },
                        createdAt: {
                            $first: '$createdAt',
                        },
                        updatedAt: {
                            $first: '$updatedAt',
                        },
                        deletedAt: {
                            $first: '$deletedAt',
                        },
                        adresse: {
                            $push: {
                                numero: '$adresse.numero',
                                nom: {
                                    $first: '$adresseData.nom',
                                },
                                denomination: {
                                    $first: '$adresseData.denomination',
                                },
                                nomComplet: {
                                    $first: '$adresseData.nomComplet',
                                },
                                quartier: {
                                    $first: '$adresseData.quartier',
                                },
                                cp: {
                                    $first: '$adresseData.cp',
                                },
                                localite: {
                                    $first: '$adresseData.localite',
                                },
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
            res.status(404).json({ message: `No agent found with id ${id}` });
            return;
        } else {
            res.status(200).json(data);
        }
    } catch (e) {
        console.error(e);
    }
});

const create = catchAsync(async (req, res) => {
    const message = `✏️ Création d'un agent`;

    const { body } = req;

    if (typeof body.email === 'undefined') {
        return res.status(400).json({ message: 'Email field is required' });
    }
    if (!body.email) {
        return res.status(400).json({ message: 'Email field is required' });
    }
    if (!body.password) {
        return res.status(400).json({ message: 'Password field is required' });
    }
    // Set default picture if empty
    if (!body.picture) {
        body.picture =
            'https://cdn-icons-png.flaticon.com/512/1946/1946392.png';
    }

    const { value, error } = schema.validate(body);
    // Handle validation errors
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    if (error) {
        return res.status(400).json({ message: error });
    }
    try {
        const { email, password, ...rest } = value;
        // Check for existing email
        const existingUser = await collection.findOne({
            email,
        });

        if (value.adresse) {
            value.adresse.rue = new ObjectId(value.adresse.rue);
        }
        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        //on efface le pwd
        delete password;
        const hash = await bcrypt.hash(password, 10);
        const createdAt = new Date();
        const updatedAt = new Date();
        const data = await collection
            .insertOne({
                ...rest,
                password: hash,
                email,
                createdAt,
                updatedAt,
            })
            .then(
                console.log(`----------->L\'agent a bien été créé<-----------`)
            );
        res.status(201).json(data);
        redisClient.del(`${collectionName}:all`);
        // res.status(201).json(data);
    } catch (err) {
        console.log(err);
    }
});

const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'No id provided' });
    }

    // add this block to check if the agent with the given ID exists
    try {
        const agent = await collection.findOne({ _id: ObjectId(id) });
        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Server error' });
    }

    const message = `📝 Mise à jour de l'agent ${id}`;
    const { body } = req;
    if (!body.email) {
        return res.status(400).json({ message: 'Email field is required' });
    }
    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    try {
        value.adresse.rue = new ObjectId(value.adresse.rue);
        const updatedAt = new Date();
        const { modifiedCount } = await collection.updateOne(
            { _id: ObjectId(id) },
            { $set: { ...value, updatedAt } },
            { returnDocument: 'after' }
        );
        if (modifiedCount === 0) {
            return res.status(404).json({ message: 'Agent not found' });
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
        //Vérification si l'agent a déjà été supprimé de manière logique
        const agent = await collection.findOne({ _id: new ObjectId(id) });
        redisClient.flushall();
        if (!isNaN(agent.deletedAt)) {
            // Agent already deleted, return appropriate response
            const message = `🗑️ L'agent a déjà été supprimé de manière logique.`;
            return res.status(200).json(agent);
        }
        // Vérification si l'agent a le matricule A101
        if (
            agent.matricule === '101' ||
            agent.lastname === 'admin' ||
            agent.firstname === 'admin'
        ) {
            const message = `🚫 Impossible de supprimer l'agent avec le matricule A101.`;
            return res.status(403).json({ message });
        }

        //suppression logique

        const message = `🗑️ Suppression d'un agent de manière logique`;
        const data = await collection.findOneAndUpdate(
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
        // res.status(200).json({
        //     message: "L'agent a bien été supprimé de manière logique.",
        //     result,
        // });
    } else if (parseInt(force, 10) === 1) {
        //suppression physique
        const message = `🗑️ Suppression d'un agent de manière physique`;
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
    const result = await collection.deleteMany({
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
