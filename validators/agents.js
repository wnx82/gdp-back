// ./validators/agents.js
const { string } = require('joi');

module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['email', 'matricule', 'userAccess', 'password'],
            properties: {
                _id: {},
                email: {
                    bsonType: 'string',
                    description: ' must be a string and is required',
                },
                password: {
                    bsonType: 'string',
                    description: 'must be a string and is required',
                },
                userAccess: {
                    bsonType: 'int',
                    description: 'must be a integer and is required',
                },
                matricule: {
                    bsonType: 'string',
                    description: 'must be a string and is required',
                },
                firstname: {
                    bsonType: 'string',
                    description: 'firstname must be a string',
                },
                lastname: {
                    bsonType: 'string',
                    description: 'lastname must be a string',
                },
                birthday: {
                    bsonType: 'date',
                    description: 'must be a date',
                },
                tel: {
                    bsonType: 'string',
                    description: 'must be a string',
                },

                adresse: {
                    bsonType: 'object',
                    required: ['rue', 'cp', 'localite'],
                    properties: {
                        rue: { bsonType: 'string' },
                        cp: { bsonType: 'string' },
                        localite: { bsonType: 'string' },
                    },
                },

                picture: {
                    bsonType: 'string',
                    description: 'must be a string and is required',
                },
                formations: {
                    bsonType: 'array',
                    description: 'must be an array and is required',
                },
            },
        },
    },
};
