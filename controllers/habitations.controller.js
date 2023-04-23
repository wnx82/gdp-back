// ./controllers/habitations.controller.js

// const dbClient = require('../utils/').dbClient;
const { dbClient, redisClient } = require('../utils');
const { catchAsync, success } = require('../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('habitations');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'habitations';

const schema = Joi.object({
    id: Joi.string().allow(null).optional().empty(''),
    adresse: {
        rue: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
        numero: Joi.string().allow(null).optional().empty(''),
    },
    demandeur: {
        nom: Joi.string().allow(null).optional().empty(''),
        tel: Joi.string().allow(null).optional().empty(''),
    },
    dates: {
        debut: Joi.date().required(),
        fin: Joi.date().greater(Joi.ref('debut')).required(),
    },
    mesures: Joi.array(),
    vehicule: Joi.string().allow(null).optional().empty(''),
    googlemap: Joi.string().allow(null).optional().empty(''),
});

const findAll = catchAsync(async (req, res) => {
    const message = '📄 Liste des habitations';
    const inCache = await redisClient.get(`${collectionName}:all`);
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const pipeline = [
            {
                $lookup: {
                    from: 'rues',
                    localField: 'adresse.rue',
                    foreignField: '_id',
                    as: 'adresseData',
                },
            },
            {
                $group: {
                    _id: '$_id',
                    demandeur: {
                        $first: '$demandeur',
                    },
                    dates: {
                        $first: '$dates',
                    },
                    adresse: {
                        $push: {
                            numero: '$adresse.numero',
                            _id: {
                                $first: '$adresseData._id',
                            },
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
                    mesures: {
                        $first: '$mesures',
                    },
                    vehicule: {
                        $first: '$vehicule',
                    },
                    googlemap: {
                        $first: '$googlemap',
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

const findActiveHabitations = catchAsync(async (req, res) => {
    const message = '📄 Liste des habitations';
    const inCache = await redisClient.get(`${collectionName}:active`);
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const pipeline = [
            {
                $match: {
                    $and: [
                        {
                            'dates.debut': {
                                $lte: new Date(),
                            },
                        },
                        {
                            'dates.fin': {
                                $gte: new Date(),
                            },
                        },
                    ],
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
                $group: {
                    _id: '$_id',
                    demandeur: {
                        $first: '$demandeur',
                    },
                    dates: {
                        $first: '$dates',
                    },
                    mesures: {
                        $first: '$mesures',
                    },
                    vehicule: {
                        $first: '$vehicule',
                    },
                    googlemap: {
                        $first: '$googlemap',
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
                            _id: {
                                $first: '$adresseData._id',
                            },
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
            `${collectionName}:active`,
            JSON.stringify(data),
            'EX',
            600
        );
        res.status(200).json(data);
    }
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = `📄 Détails de l'habitation`;
        const { id } = req.params;
        let data = null;
        data = await collection.findOne({ _id: new ObjectId(id) });
        if (!data) {
            res.status(404).json({
                message: `⛔ No habitation found with id ${id}`,
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
                    $lookup: {
                        from: 'rues',
                        localField: 'adresse.rue',
                        foreignField: '_id',
                        as: 'adresseData',
                    },
                },
                {
                    $group: {
                        _id: '$_id',
                        demandeur: {
                            $first: '$demandeur',
                        },
                        dates: {
                            $first: '$dates',
                        },
                        adresse: {
                            $push: {
                                numero: '$adresse.numero',
                                nom: {
                                    $first: '$adresseData._id',
                                },
                                _id: {
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
                        mesures: {
                            $first: '$mesures',
                        },
                        vehicule: {
                            $first: '$vehicule',
                        },
                        googlemap: {
                            $first: '$googlemap',
                        },
                        createdAt: {
                            $first: '$createdAt',
                        },
                        updatedAt: {
                            $first: '$updatedAt',
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
            res.status(404).json({
                message: `No habitation found with id ${id}`,
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
    const message = `✏️ Création d'une habitation`;

    const { body } = req;
    if (!body.adresse) {
        return res.status(400).json({ message: 'adresse field is required' });
    }

    const { value, error } = schema.validate(body);

    if (error) {
        return res.status(400).json({ message: error });
    }
    try {
        const { ...rest } = value;
        value.adresse.rue = new ObjectId(value.adresse.rue);
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
                    `----------->L\'habitation a bien été créé<-----------`
                )
            );
        res.status(201).json(data);
        console.log('on efface le redis');
        redisClient.del(`${collectionName}:all`);
    } catch (err) {
        console.log(err);
    }
});
const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'No id provided' });
    }
    const message = `📝 Mise à jour de l'habitation ${id}`;
    const { body } = req;

    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        const updatedAt = new Date();
        value.adresse.rue = new ObjectId(value.adresse.rue);
        const { modifiedCount } = await collection.updateOne(
            { _id: ObjectId(id) },
            { $set: { ...value, updatedAt } },
            { returnDocument: 'after' }
        );
        if (modifiedCount === 0) {
            return res.status(404).json({ message: 'Habitation not found' });
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
        const habitation = await collection.findOne({ _id: new ObjectId(id) });
        if (!isNaN(habitation.deletedAt)) {
            // Constat already deleted, return appropriate response
            const message = `L'habitation a déjà été supprimée de manière logique.`;
            return res.status(200).json(habitation);
        }
        //suppression logique
        const message = `🗑️ Suppression d'une habitation de manière logique`;
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
        const message = `🗑️ Suppression d'une habitation de manière physique`;
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
const restoreMany = catchAsync(async (req, res) => {
    const result = await collection.updateMany(
        { deletedAt: { $exists: true } },
        { $unset: { deletedAt: "" } }
    );
    const restoredCount = result.nModified;
    if (restoredCount === 0) {
        return res.status(404).json({ message: "Aucune donnée trouvée à restaurer." });
    }
    redisClient.del(`${collectionName}:all`);
    res.status(200).json({ message: `${restoredCount} données restaurées.` });
});


module.exports = {
    findAll,
    findActiveHabitations,
    findOne,
    create,
    updateOne,
    deleteOne,
    deleteMany,
    restoreMany
};
