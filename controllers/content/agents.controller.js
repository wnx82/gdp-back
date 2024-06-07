// ./controllers/agents.controller.js

const { dbClient, redisClient } = require('../../utils');
const { catchAsync, success } = require('../../helpers');
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
    password: Joi.string().optional(),
    userAccess: Joi.number().integer().min(0).max(10).required(),
    matricule: Joi.number().integer().min(0).max(999).required(),
    firstname: Joi.string().max(25).allow(null).optional().empty(''),
    lastname: Joi.string().allow(null).optional().empty(''),
    birthday: Joi.date().allow(null).optional().empty(''),
    tel: Joi.string().max(30).allow(null).optional().empty(''),
    iceContact: Joi.string().allow(null).optional().empty(''),
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
                $project: {
                    _id: 1,
                    email: 1,
                    matricule: 1,
                    firstname: 1,
                    lastname: 1,
                    birthday: 1,
                    tel: 1,
                    iceContact: 1,
                    userAccess: 1,
                    picture: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    deletedAt: 1,
                    formations: 1,
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
                    $project: {
                        _id: 1,
                        email: 1,
                        matricule: 1,
                        firstname: 1,
                        lastname: 1,
                        birthday: 1,
                        tel: 1,
                        iceContact: 1,
                        userAccess: 1,
                        picture: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        deletedAt: 1,
                        formations: 1,
                    },
                },
            ];
            const data = await collection.aggregate(pipeline).toArray();
            redisClient.set(
                `${collectionName}:${id}`,
                JSON.stringify(data),
                'EX',
                600
            );
            if (!data.length) {
                res.status(404).json({ message: `No agent found with id ${id}` });
                return;
            } else {
                res.status(200).json(data[0]);
            }
        }
    } catch (e) {
        console.error(e);
    }
});

const create = catchAsync(async (req, res) => {
    console.log('Create agent request received');
    const message = `✏️ Création d'un agent`;
    const { body } = req;

    if (typeof body.email === 'undefined') {
        console.log('Email field is undefined');
        return res.status(400).json({ message: 'Email field is required' });
    }
    if (!body.email) {
        console.log('Email field is empty');
        return res.status(400).json({ message: 'Email field is required' });
    }
    if (!body.password) {
        console.log('Password field is empty');
        return res.status(400).json({ message: 'Password field is required' });
    }
    // Set default picture if empty
    if (!body.picture) {
        console.log('Picture field is empty. Setting default picture');
        body.picture =
            'https://cdn-icons-png.flaticon.com/512/1946/1946392.png';
    }

    const { value, error } = schema.validate(body);
    // Handle validation errors
    if (error) {
        console.log(`Validation error: ${error.details[0].message}`);
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        const { email, matricule, password, ...rest } = value;
        // Check for existing email
        const existingUser = await collection.findOne({
            email,
        });
        const existingMatricule = await collection.findOne({
            matricule,
        });

        if (existingUser) {
            console.log('Email already exists');
            return res.status(409).json({ message: 'Email already exists' });
        }
        if (existingMatricule) {
            console.log('Matricule already exists');
            return res
                .status(409)
                .json({ message: 'Matricule already exists' });
        }
        //on efface le pwd
        delete password;
        const hash = await bcrypt.hash(password, 10);
        const createdAt = new Date();
        const updatedAt = new Date();
        const data = await collection.insertOne({
            ...rest,
            password: hash,
            matricule,
            email,
            createdAt,
            updatedAt,
        });
        console.log('Agent created successfully');
        res.status(201).json(data);
        redisClient.del(`${collectionName}:all`);
    } catch (err) {
        console.log(`Error while creating agent: ${err}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    console.log('id:', id);
    if (!id) {
        console.log('No id provided');
        return res.status(400).json({ message: 'No id provided' });
    }

    // Check if the agent with the given ID exists
    try {
        const agent = await collection.findOne({ _id: new ObjectId(id) }); // Utilisation de new ObjectId(id)
        if (!agent) {
            console.log('Agent not found');
            return res.status(404).json({ message: 'Agent not found' });
        }
    } catch (err) {
        console.error('Error finding agent:', err);
        return res.status(500).json({ message: 'Server error while finding agent' });
    }

    const message = `📝 Mise à jour de l'agent ${id}`;
    const { body } = req;

    // Check for existing email
    if (body.email) {
        const existingUser = await collection.findOne({
            email: body.email,
            _id: { $ne: new ObjectId(id) }, // Ajout de new ici
        });

        if (existingUser) {
            console.log('Email already exists');
            return res.status(409).json({ message: 'Email already exists' });
        }
    }

    // Check for existing matricule
    if (body.matricule) {
        const existingMatricule = await collection.findOne({
            matricule: body.matricule,
            _id: { $ne: new ObjectId(id) }, // Ajout de new ici
        });

        if (existingMatricule) {
            console.log('Matricule already exists');
            return res.status(409).json({ message: 'Matricule already exists' });
        }
    }

    if (!body.email) {
        console.log('Email field is required');
        return res.status(400).json({ message: 'Email field is required' });
    }
    const { value, error } = schema.validate(body);
    // console.log('value:', value);
    if (error) {
        // console.log('Error:', error);
        return res.status(400).json({ message: error.details[0].message });
    }
    try {
        const updatedAt = new Date();
        console.log('Updated at:', updatedAt);
        const { modifiedCount } = await collection.updateOne(
            { _id: new ObjectId(id) }, // Ajout de new ici
            { $set: { ...value, updatedAt } },
            { returnDocument: 'after' }
        );
        console.log('Modified count:', modifiedCount);
        if (modifiedCount === 0) {
            console.log('Agent not found');
            return res.status(404).json({ message: 'Agent not found' });
        }
        res.status(200).json(value);
        redisClient.del(`${collectionName}:all`);
        redisClient.del(`${collectionName}:${id}`);
    } catch (err) {
        console.error('Error updating agent:', err);
        res.status(500).json({ message: 'Server error while updating agent' });
    }
});


const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;

    if (force === undefined || parseInt(force, 10) === 0) {
        // Vérification si l'agent a déjà été supprimé de manière logique
        const agent = await collection.findOne({ _id: new ObjectId(id) });
        if (agent.deletedAt instanceof Date) {
            return res.status(200).json({ message: `🗑️ L'agent a déjà été supprimé de manière logique.` });
        }

        // Vérification si l'agent a le matricule A101
        if (agent.matricule === '101'|| agent.userAccess === 0) {
            return res.status(403).json({ message: `🚫 Impossible de supprimer un administrateur.` });
        }

        // Vérification de l'intégrité référentielle
        const references = await Promise.all([
            database.collection('constats').findOne({ agents: new ObjectId(id) }),
            database.collection('dailies').findOne({ agents: new ObjectId(id) }),
            database.collection('rapports').findOne({ agents: new ObjectId(id) }),
            database.collection('validations').findOne({ agents: new ObjectId(id) })
        ]);

        const referencedTables = ['constats', 'dailies', 'missions', 'rapports', 'validations'];
        const hasReferences = references.some((ref, index) => ref !== null);

        if (hasReferences) {
            return res.status(400).json({ message: `Cet agent est référencé dans d'autres tables et ne peut pas être supprimé.` });
        }

        // Suppression logique
        const data = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { deletedAt: new Date() } }
        );
        res.status(200).json(data);
        redisClient.del(`${collectionName}:all`);
        redisClient.del(`${collectionName}:${id}`);
    } else if (parseInt(force, 10) === 1) {
        // Suppression physique
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            res.status(200).json({ message: `🗑️ Suppression d'un agent de manière physique.` });
            redisClient.del(`${collectionName}:all`);
            redisClient.del(`${collectionName}:${id}`);
        } else {
            res.status(404).json({ message: 'Impossible de supprimer l\'agent.' });
        }
    } else {
        res.status(400).json({ message: 'Paramètre "force" mal formé.' });
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
        { $unset: { deletedAt: '' } }
    );
    const restoredCount = result.modifiedCount;
    if (restoredCount === 0) {
        return res
            .status(404)
            .json({ message: 'Aucune donnée trouvée à restaurer.' });
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
