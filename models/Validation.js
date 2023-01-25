const mongoose = require('mongoose');

const validationSchema = new mongoose.Schema(
    {
        habitation: {
            type: String,
        },
        agent: {
            type: String,
        },
        message: {
            type: String,
        },
        date: {
            type: Date,
        },
    },
    {
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deleteAt: 'deletedAt',
    }
);
validationSchema.set('toJSON', {
    virtuals: true,
});
console.log('Modèle validations chargé');
module.exports = mongoose.model('Validations', validationSchema);
