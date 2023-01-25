// const dbClient = require('../utils').dbClient;
// const database = dbClient.db(process.env.MONGO_DB_DATABASE);
// const collection = database.collection('agents');
const Agent = require('../models/Agent');
const catchAsync = require('../helpers/catchAsync');
const { success } = require('../helpers/helper');
const moment = require('moment');

const findAll = catchAsync(async (req, res) => {
    const message = 'Liste des agents';
    const data = await Agent.find();
    res.status(200).json(data);
    // res.status(200).json(success(message, data));
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = 'Liste des agents';
        const { id, lastname, firstname } = req.params;

        if (!id) {
            res.status(400).json({ message: 'No id provided' });
        }
        const data = await Agent.findOne({ _id: id.trim() });
        if (!data) {
            res.status(404).json({ message: `No user found with id ${id}` });
        }
        res.status(200).json(success(`Détails l'agent : `, data));
        //res.status(200).json(data);
    } catch (e) {
        console.error(e);
    }
});
const create = catchAsync(async (req, res) => {
    const { lastname, firstname, matricule, birthday, adresse, cp, tel } =
        req.body;
    try {
        //console.log(req.body);
        console.log(lastname, firstname, matricule);
        console.log(
            moment(new Date()).format('YYYY-MM-DD @ HH:mm') +
                ` : Création Agent ${matricule}`
        );

        //console.log(req.body);
        if (!matricule) {
            res.status(403).json('Champ matricule vide!');
            //req.flash('error', 'Certains champs ne peuvent pas être vides!');
            //res.redirect('/agents/create');
            return;
        }
        const data = await Agent.create({
            lastname,
            firstname,
            matricule,
            birthday,
            adresse,
            cp,
            tel,
        }).then(
            console.log(
                `----------->L\'agent ${matricule} a bien été créé<-----------`
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
        const result = await Agent.updateOne(
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
        const result = await Agent.deleteOne({ _id: id });
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
