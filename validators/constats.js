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
                    bsonType: 'objectId',
                    description: 'must be a objectId representing an objectId and references constatVehicule._id',
                },
                personne: {
                    bsonType: 'objectId',
                    description: 'must be a objectId representing an objectId and references constatPersonne._id',
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
