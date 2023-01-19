const Sequelize = require('sequelize');
const db = require('../config/database');
const moment = require('moment');

const Validation = db.define(
    'validation',
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        adresse: {
            type: Sequelize.STRING,
            allowNull: true,
            get() {
                return this.getDataValue('adresse').toUpperCase();
            },
        },
        agent: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        message: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        date: {
            type: Sequelize.DATE,
            allowNull: true,
            get() {
                return moment(this.getDataValue('date')).format(
                    'YYYY/MM/DD HH:mm'
                );
            },
        },
    },
    {
        timestamps: true,
        createdAt: 'created',
        updatedAt: false,
    }
);

Validation.sync().then(() => {
    console.log('Table validation créée');
});

module.exports = Validation;
