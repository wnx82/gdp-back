const dbClient = require('../utils').dbClient;
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('habitations');
const catchAsync = require('../helpers/catchAsync');
const { success } = require('../helpers/helper');
const moment = require('moment');
const Joi = require('joi');
var ObjectId = require('mongodb').ObjectID;

const findAll = catchAsync(async (req, res) => {
    console.log('Liste contrôleur habitations');
    const data = await collection.find({}).toArray();
    // const data = await Habitation.find({}).toArray();
    res.status(200).json(data);
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = 'Liste des habitations';
        const { id } = req.params;
        // console.log(id);
        if (!id) {
            res.status(400).json({ message: 'No id provided' });
        }
        const data = await collection.findOne({ _id: new ObjectId(id) });

        // console.log(data);
        if (!data) {
            res.status(404).json({
                message: `No habitation found with id ${id}`,
            });
        }
        res.status(200).json(success(`Détails l'habitation : `, data));
        // res.status(200).json(data);
    } catch (e) {
        console.error(e);
    }
});
const create = catchAsync(async (req, res) => {
    const {
        id,
        adresse,
        cp,
        localite,
        demandeur,
        tel,
        datedebut,
        datefin,
        mesures,
        vehicule,
        googlemap,
    } = req.body;
    try {
        //console.log(req.body);
        console.log(adresse, localite);
        console.log(new Date() + ' : requete lancée');

        //console.log(req.body);
        if (!adresse) {
            res.status(403).json('Champ localite vide!');
            //req.flash('error', 'Certains champs ne peuvent pas être vides!');
            //res.redirect('/habitations/create');
            return;
        }
        const data = await Habitation.create({
            id: id,
            adresse: {
                rue,
                cp,
                localite,
            },
            demandeur: {
                nom,
                tel,
            },
            date: {
                datedebut,
                datefin,
            },
            mesures,
            vehicule,
            googlemap,
        }).then(
            console.log(
                `----------->L\'habitation ${adresse} a bien été créé<-----------`
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
        const result = await Habitation.updateOne(
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
        const result = await Habitation.deleteOne({ _id: id });
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
