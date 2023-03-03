module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['adresse'],
            properties: {
                _id: {},
                adresse: {
                    bsonType: 'string',
                    description: ' must be a string and is required',
                },
                denomination: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                cp: {
                    bsonType: 'number',
                    description: ' must be a number and is not required',
                },
                localite: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                codeRue: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                traductionNl: {
                    bsonType: 'traductionNl',
                    description: ' must be a string and is not required',
                },
            },
        },
    },
};
