const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema(
    {
        id: {
            type: Number,
            primaryKey: true,
            autoIncrement: true,
        },
        lastname: {
            type: String,
            allowNull: true,
            get() {
                return this.getDataValue('lastname').toUpperCase();
            },
        },
        firstname: {
            type: String,
            allowNull: true,
        },
        birthday: {
            type: String,
            allowNull: true,
        },
        matricule: {
            type: String,
            required: true,
        },
        adresse: {
            type: String,
            allowNull: true,
        },
        cp: {
            type: String,
            allowNull: true,
        },
        tel: {
            type: String,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        createdAt: 'created',
        updatedAt: false,
    }
);

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
