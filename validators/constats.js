module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['agents', 'date'],
            properties: {
                _id: {},
                agents: {
                    bsonType: ['array', 'null'],
                    minItems: 1,
                    description: ' must be an array and is required',
                    items: {
                        bsonType: 'objectId',
                    },
                },
                vehicule: {
                    bsonType: ['object', 'null'],
                    description: ' must be an object and is not required',
                    properties: {
                        marque: { bsonType: ['string', 'null'] },
                        modele: { bsonType: ['string', 'null'] },
                        couleur: { bsonType: ['string', 'null'] },
                        type: { bsonType: ['string', 'null'] },
                        immatriculation: { bsonType: ['string', 'null'] },
                    },
                },
                personne: {
                    bsonType: ['object', 'null'],
                    description: ' must be an object and is not required',
                    properties: {
                        firstname: { bsonType: ['string', 'null'] },
                        lastname: { bsonType: ['string', 'null'] },
                        birthday: { bsonType: ['date', 'null'] },
                        nationalNumber: { bsonType: ['string', 'null'] },
                        tel: { bsonType: ['string', 'null'] },
                        adresse: {
                            bsonType: ['object', 'null'],
                            properties: {
                                rue: { bsonType: ['string', 'null'] },
                                cp: { bsonType: ['string', 'null'] },
                                localite: { bsonType: ['string', 'null'] },
                            },
                        },
                    },
                },
                date: {
                    bsonType: ['date', 'null'],
                    description: ' must be a date and is required',
                },
                adresse: {
                    bsonType: ['object', 'null'],
                    properties: {
                        rue: {
                            bsonType: ['objectId', 'null'],
                            description: 'must be an objectId and is required',
                        },
                        numero: { bsonType: ['string', 'null'] },
                    },
                },
                geolocation: {
                    bsonType: ['object', 'null'],
                    description: ' must be a object and is not required',
                    properties: {
                        latitude: {
                            bsonType: ['string', 'null'],
                        },
                        longitude: {
                            bsonType: ['string', 'null'],
                        },
                        horodatage: {
                            bsonType: ['date', 'null'],
                        },
                    },
                },
                infractions: {
                    bsonType: ['array', 'null'],
                    description: ' must be an arrray and is required',
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
                    description: ' must be an arrray and is not required',
                },
            },
        },
    },
};
