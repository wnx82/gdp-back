const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema(
    {
        id: {
            type: Number,
        },
        lastname: {
            type: String,
        },
        firstname: {
            type: String,
        },
        birthday: {
            type: String,
        },
        matricule: {
            type: String,
        },
        adresse: {
            type: String,
        },
        cp: {
            type: String,
        },
        tel: {
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

console.log('Schéma Agents chargé');
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
