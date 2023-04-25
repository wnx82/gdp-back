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
                        marque: { bsonType: ['string', 'null'] },
                        modele: { bsonType: ['string', 'null'] },
                        couleur: { bsonType: ['string', 'null'] },
                        type: { bsonType: ['string', 'null'] },
                        immatriculation: { bsonType: ['string', 'null'] },
                    },
                },
                personne: {
                    bsonType: 'object',
                    // required: ['rue', 'cp', 'localite'],
                    description: ' must be a object and is not required',
                    properties: {
                        firstname: { bsonType: ['string', 'null'] },
                        lastname: { bsonType: ['string', 'null'] },
                        birthday: { bsonType: ['date', 'null'] },
                        nationalNumber: { bsonType: ['number', 'null'] },
                        tel: { bsonType: ['string', 'null'] },
                        adresse: {
                            bsonType: 'object',
                            properties: {
                                rue: { bsonType: ['string', 'null'] },
                                cp: { bsonType: ['string', 'null'] },
                                localite: { bsonType: ['string', 'null'] },
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
                    properties: {
                        rue: {
                            bsonType: 'objectId',
                            description: 'must be an objectId and is required',
                        },
                        numero: { bsonType: ['string', 'null'] },
                    },
                },
                geolocation: {
                    bsonType: 'object',
                    description: ' must be a object and is not required',
                    properties: {
                        latitude: {
                            bsonType: ['string', 'null'],
                        },
                        longitude: {
                            bsonType: ['string', 'null'],
                        },
                        horodatage: {
                            bsonType: 'date',
                        },
                    },
                },
                infractions: {
                    bsonType: ['array', 'null'],
                    description: ' must be a arrray and is required',
                },
                pv: {
                    bsonType: ['bool', 'null'],
                    description: ' must be a boolean and is required',
                },
                notes: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                annexes: {
                    bsonType: ['array', 'null'],
                    description: ' must be a arrray and is not required',
                },
            },
        },
    },
};
