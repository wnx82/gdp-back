module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['agents', 'date', 'pv'],
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
                    description: ' must be a object and is not required',
                    properties: {
                        rue: { bsonType: 'string' },
                        cp: { bsonType: 'string' },
                        localite: { bsonType: 'string' },
                    },
                },
                geolocation: {
                    bsonType: 'object',
                    description: ' must be a object and is not required',
                    properties: {
                        latitude: {
                            bsonType: 'string',
                        },
                        longitude: {
                            bsonType: 'string',
                        },
                        horodatage: {
                            bsonType: 'date',
                        },
                    },
                },
                infractions: {
                    bsonType: 'array',
                    description: ' must be a arrray and is required',
                },
                pv: {
                    bsonType: 'bool',
                    description: ' must be a boolean and is required',
                },
                notes: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                annexes: {
                    bsonType: 'array',
                    description: ' must be a arrray and is not required',
                },
            },
        },
    },
};
