const mongoose = require('mongoose');
const Joi = require('joi');
const agentSchema = new mongoose.Schema(
    {
        lastname: Joi.string(),
        firstname: Joi.string(),
        birthday: Joi.date(),
        email: Joi.string().email(),
        matricule: Joi.string().required(),
        adresse: {
            rue: Joi.string(),
            cp: Joi.string(),
            localite: Joi.string(),
        },

        tel: Joi.string(),
        password: Joi.string(),
    },
    {
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deleteAt: 'deletedAt',
    }
);

agentSchema.set('toJSON', {
    virtuals: true,
});
console.log('Modèle Agents chargé');
module.exports = mongoose.model('Agents', agentSchema);

// const Sequelize = require('sequelize');
// const db = require('../config/database');

// const Agent = db.define(
//     'agent',
//     {
//         id: {
//             type: Sequelize.INTEGER,
//             primaryKey: true,
//             autoIncrement: true,
//         },
//         lastname: {
//             type: Sequelize.STRING,
//             allowNull: true,
//             get() {
//                 return this.getDataValue('lastname').toUpperCase();
//             },
//         },
//         firstname: {
//             type: Sequelize.STRING,
//             allowNull: true,
//         },
//         birthday: {
//             type: Sequelize.STRING,
//             allowNull: true,
//         },
//         matricule: {
//             type: Sequelize.STRING,
//             allowNull: true,
//         },
//         adresse: {
//             type: Sequelize.STRING,
//             allowNull: true,
//         },
//         cp: {
//             type: Sequelize.STRING,
//             allowNull: true,
//         },
//         tel: {
//             type: Sequelize.STRING,
//             allowNull: true,
//         },
//     },
//     {
//         timestamps: true,
//         createdAt: 'created',
//         updatedAt: false,
//     }
// );

// Agent.sync().then(() => {
//     //console.log('Table agents créée');
// });

// module.exports = Agent;
