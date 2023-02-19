// ./controllers/validations.controller.js

// const dbClient = require('../utils/').dbClient;
const { dbClient, redisClient } = require('../utils/');
const { catchAsync, success } = require('../helpers/');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('validations');
const moment = require('moment');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;

const findAll = catchAsync(async (req, res) => {
    const message = 'Liste des validations';
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
    redisClient.set('agents:all', JSON.stringify(data), 'EX', 600);
    res.status(200).json(success(message, data));
});

const findOne = catchAsync(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        res.status(400).json({ message: 'No id provided' });
    }
    const data = await Validation.findOne({ _id: id });
    if (!data) {
        res.status(404).json({ message: `No user found with id ${id}` });
    }

    res.status(200).json(data);
});
const create = catchAsync(async (req, res) => {
    const message = `Création d'une validation`;
    const schema = Joi.object({
        firstname: Joi.string().max(25),
        lastname: Joi.string(),
        birthday: Joi.date(),
        tel: Joi.string().max(30),
        email: Joi.string().email().required().max(200),
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
    try {
        //console.log(req.body);
        console.log(lastname, firstname, matricule);
        console.log(new Date() + ' : requete lancée');

        //console.log(req.body);
        if (!matricule) {
            res.status(403).json('Champ matricule vide!');
            //req.flash('error', 'Certains champs ne peuvent pas être vides!');
            //res.redirect('/validations/create');
            return;
        }
        const data = await Validation.create({
            lastname: lastname,
            firstname: firstname,
            matricule: matricule,
        }).then(
            console.log(
                `----------->L\'validation ${matricule} a bien été créé<-----------`
            )
        );
        res.status(201).json(data);
    } catch (err) {
        console.log(err);
    }
});
const updateOne = catchAsync(async (req, res) => {});
const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: 'No id provided' });
    }
    const { force } = req.query;

    if (force === undefined || parseInt(force, 10) === 0) {
        //suppression logique
        const result = await Validation.updateOne(
            {
                _id: id, //filter
            },
            {
                $set: { deleteAt: new Date() },
            }
        );
        res.status(200).json(result);
    }
    if (parseInt(force, 10) === 1) {
        //suppression physique
        const result = await Validation.deleteOne({ _id: id });
        // if (result.deletedCount === 1) {
        //     console.log('Successfully deleted');
        // }
        res.status(204);
    }
    res.status(400).json({ message: 'Malformed parameter "force"' });
});

module.exports = {
    findAll,
    findOne,
    create,
    updateOne,
    deleteOne,
};
