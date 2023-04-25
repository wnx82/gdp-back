module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            properties: {
                _id: {},
                adresse: {
                    bsonType: ['object', 'null'],
                    properties: {
                        rue: {
                            bsonType: ['objectId', 'null'],
                            description: 'must be an objectId',
                        },
                        numero: { bsonType: ['string', 'null'] },
                    },
                },
                demandeur: {
                    bsonType: ['object', 'null'],
                    description: ' must be a object',
                    properties: {
                        nom: { bsonType: ['string', 'null'] },
                        tel: { bsonType: ['string', 'null'] },
                    },
                },
                dates: {
                    bsonType: ['object', 'null'],
                    description: ' must be a object',
                    properties: {
                        debut: { bsonType: ['date', 'null'] },
                        fin: { bsonType: ['date', 'null'] },
                    },
                },
                mesures: {
                    bsonType: ['array', 'null'],
                    description: ' must be a array',
                },
                vehicule: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string',
                },
                googlemap: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string',
                },
            },
        },
    },
};
