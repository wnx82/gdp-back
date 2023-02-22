module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['agents', 'date', 'infraction', 'pv'],
            properties: {
                _id: {},
                agents: {
                    bsonType: 'array',
                    minItems: 1,
                    description: ' must be a array and is required',
                    items: {
                        bsonType: 'objectId',
                    },
                },
                date: {
                    bsonType: 'date',
                    description: ' must be a date and is required',
                },
                adresse: {
                    bsonType: 'object',
                    // required: ['rue', 'cp', 'localite'],
                    description: ' must be a object and is  not required',
                    properties: {
                        rue: { bsonType: 'string' },
                        cp: { bsonType: 'string' },
                        localite: { bsonType: 'string' },
                    },
                },
                infraction: {
                    bsonType: 'array',
                    description: ' must be a arrray and is required',
                },
                pv: {
                    bsonType: 'bool',
                    description: ' must be a boolean and is required',
                },
                note: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
            },
        },
    },
};
