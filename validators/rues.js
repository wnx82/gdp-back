module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['nom'],
            properties: {
                _id: {},
                nom: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is required',
                },
                denomination: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                nomComplet: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                quartier: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                cp: {
                    bsonType: ['number', 'null'],
                    description: ' must be a number and is not required',
                },
                localite: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                codeRue: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                traductionNl: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                xMin: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                xMax: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                yMin: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                yMax: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                idTronconCentral: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
            },
        },
    },
};
