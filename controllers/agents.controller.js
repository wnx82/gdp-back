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

const findAll = catchAsync(async (req, res) => {
    const message = 'Liste des agents';
    const inCache = await redisClient.get('agents:all');
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const data = await collection.find({}).toArray();
        redisClient.set('agents:all', JSON.stringify(data), 'EX', 600);
        // res.status(200).json(data);
        // res.status(200).json({ message: message, data: data });
        res.status(200).json(success(message, data));
    }
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = `Détails de l'agent`;
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ message: 'No id provided' });
        }
        if (!ObjectId.isValid(id)) {
            res.status(400).json({
                message: 'Invalid id provided',
            });
        }
        const data = await collection.findOne({ _id: new ObjectId(id) });
        if (!data) {
            res.status(404).json({ message: `No agent found with id ${id}` });
        }
        const inCache = await redisClient.get(`agent:${id}`);
        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            redisClient.set(`agent:${id}`, JSON.stringify(data), 'EX', 600);
            res.status(200).json(success(message, data));
        }
        // res.status(200).json(success(`Détails l'agent : `, data));
    } catch (e) {
        console.error(e);
    }
});
const create = catchAsync(async (req, res) => {
    const message = `Création d'un agent`;
    const schema = Joi.object({
        firstname: Joi.string(),
        lastname: Joi.string(),
        birthday: Joi.date(),
        tel: Joi.string(),
        email: Joi.string().email().required(),
        matricule: Joi.string().required(),
        adresse: {
            rue: Joi.string(),
            cp: Joi.string(),
            localite: Joi.string(),
        },
        password: Joi.string().required(),
        picture: Joi.string(),
        formations: Joi.array(),
    });
    const { body } = req;
    if (!body.email) {
        return res.status(400).json({ message: 'Email field is required' });
    }

    if (!body.password) {
        return res.status(400).json({ message: 'Password field is required' });
    }
    const { value, error } = schema.validate(body);

    if (error) {
        return res.status(400).json({ message: error });
    }
    try {
        const { email, password, ...rest } = value;
        // Check for existing email
        const existingUser = await collection.findOne({
            email,
        });

        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        //on efface le pwd
        delete password;
        const hash = await bcrypt.hash(password, 10);

        const data = await collection
            .insertOne({
                password: hash,
                email,
                ...rest,
            })
            .then(
                console.log(`----------->L\'agent a bien été créé<-----------`)
            );
        res.status(201).json(success(message, data));
        // res.status(201).json(data);
    } catch (err) {
        console.log(err);
    }
});
const updateOne = catchAsync(async (req, res) => {
    const message = `Modification d'un agent`;
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: 'No id provided' });
    }
    const { body } = req;
    const schema = Joi.object({
        firstname: Joi.string(),
        lastname: Joi.string(),
        birthday: Joi.date(),
        tel: Joi.string(),
        email: Joi.string().email(),
        matricule: Joi.string().required(),
        adresse: {
            rue: Joi.string(),
            cp: Joi.string(),
            localite: Joi.string(),
        },
        password: Joi.string(),
        picture: Joi.string(),
        formations: Joi.array(),
    });

    const { value, error } = schema.validateAsync(body);
    if (error) {
        res.status(400).json(error);
    }
    const data = await collection.findOneAndUpdate(
        {
            _id: new ObjectId(id),
        },
        {
            $set: schema,
        },
        {
            returnDocument: 'after',
            // upsert:
        }
    );
    res.status(200).json(success(message, data));
    // res.status(200).json(data);
});

const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: 'No id provided' });
    }
    const { force } = req.query;

    if (force === undefined || parseInt(force, 10) === 0) {
        //suppression logique
        const message = `Suppression d'un agent de manière logique`;
        const data = await collection.updateOne(
            {
                _id: new ObjectId(id),
            },
            {
                $set: { deletedAt: new Date() },
            }
        );
        res.status(200).json(success(message, data));
        redisClient.del('agents:all');
        // res.status(200).json({
        //     message: "L'agent a bien été supprimé de manière logique.",
        //     result,
        // });
    } else if (parseInt(force, 10) === 1) {
        //suppression physique
        const message = `Suppression d'un agent de manière physique`;
        console.log('suppression physique/valeur force:' + force);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            console.log('Successfully deleted');
            res.status(200).json(success(message));
            redisClient.del('agents:all');
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
