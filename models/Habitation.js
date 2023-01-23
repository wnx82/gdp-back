const mongoose = require('mongoose');

const habitationSchema = new mongoose.Schema(
    {
        adresse: {
            type: String,
        },
        cp: {
            type: Number,
        },
        localite: {
            type: Number,
        },
        demandeur: {
            type: String,
        },
        datedebut: {
            type: Date,
        },
        datefin: {
            type: Date,
        },
        mesures: {
            type: String,
        },
        vehicule: {
            type: String,
        },
        googlemap: {
            type: String,
        },
    },
    {
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deleteAt: 'deletedAt',
    }
);

console.log('Modèle habitations chargé');
module.exports = mongoose.model('Habitations', habitationSchema);
