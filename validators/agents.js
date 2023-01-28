const { string } = require('joi');

module.exports = {
    validator: {
        $jsonSchema: {
            required: ['email'],

            properties: {
                name: {
                    bsonType: 'object',
                    required: ['first', 'middle', 'last'],
                    properties: {
                        first: { bsonType: string },
                        middle: { bsonType: string },
                        last: { bsonType: string },
                    },
                },
            },
            // required: ['matricule,'],
        },
    },
};
