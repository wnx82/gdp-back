// ./validators/agents.js
const { string } = require('joi');

module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['email', 'matricule', 'userAccess', ],
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
                    bsonType: 'int',
                    description: 'must be a integer and is required',
                },
                firstname: {
                    bsonType: ['string', 'null'],
                    description: 'firstname must be a string',
                },
                lastname: {
                    bsonType: ['string', 'null'],
                    description: 'lastname must be a string',
                },
                birthday: {
                    bsonType: ['date', 'null'],
                    description: 'must be a date',
                },
                tel: {
                    bsonType: ['string', 'null'],
                    description: 'must be a string',
                },
                iceContact: {
                    bsonType: ['string', 'null'],
                    description: 'iceContact must be a string',
                },

                picture: {
                    bsonType: ['string', 'null'],
                    description: 'must be a string and is not required',
                },
                formations: {
                    bsonType: ['array', 'null'],
                    description: 'must be an array and is not required',
                },
            },
        },
    },
};
