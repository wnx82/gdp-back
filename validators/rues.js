module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['nom'],
            properties: {
                _id: {},
                nom: {
                    bsonType: 'string',
                    description: ' must be a string and is required',
                },
                denomination: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                nomComplet: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                quartier: {
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
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                xMin: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                xMax: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                yMin: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                yMax: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                idTronconCentral: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
            },
        },
    },
};
