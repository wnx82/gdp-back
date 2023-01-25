const mongoose = require('mongoose');

const habitationSchema = new mongoose.Schema(
    {
        adresse: {
            rue: { type: String },
            cp: { type: Number },
            localite: { type: String },
        },

        demandeur: {
            nom: { type: String },
            tel: { type: String },
        },
        dates: {
            debut: { type: Date },
            fin: { type: Date },
        },
        mesures: { type: String },
        vehicule: { type: String },
        googlemap: { type: String },
    },
    {
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deleteAt: 'deletedAt',
    }
);
habitationSchema.set('toJSON', {
    virtuals: true,
});
console.log('Modèle habitations chargé');
module.exports = mongoose.model('Habitations', habitationSchema);
