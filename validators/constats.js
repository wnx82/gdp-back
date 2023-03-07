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
                vehicule: {
                    bsonType: 'object',
                    // required: ['rue', 'cp', 'localite'],
                    description: ' must be a object and is not required',
                    properties: {
                        marque: { bsonType: 'string' },
                        modele: { bsonType: 'string' },
                        couleur: { bsonType: 'string' },
                        type: { bsonType: 'string' },
                        immatriculation: { bsonType: 'string' },
                    },
                },
                personne: {
                    bsonType: 'object',
                    // required: ['rue', 'cp', 'localite'],
                    description: ' must be a object and is not required',
                    properties: {
                        firstname: { bsonType: 'string' },
                        lastname: { bsonType: 'string' },
                        birthday: { bsonType: 'date' },
                        nationalNumber: { bsonType: 'number' },
                        tel: { bsonType: 'string' },
                        adresse: {
                            bsonType: 'object',
                            properties: {
                                rue: { bsonType: 'string' },
                                cp: { bsonType: 'string' },
                                localite: { bsonType: 'string' },
                            },
                        },
                    },
                },
                date: {
                    bsonType: 'date',
                    description: ' must be a date and is required',
                },
                adresse: {
                    bsonType: 'object',
                    required: ['rue'],
                    properties: {
                        rue: {
                            bsonType: 'objectId',
                            description: 'must be an objectId and is required',
                        },
                        numero: { bsonType: 'string' },
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
