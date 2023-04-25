module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['date', 'daily'],
            properties: {
                _id: {},
                daily: {
                    bsonType: 'objectId',
                    description: ' must be a objectId and is required',
                },

                date: {
                    bsonType: ['date', 'null'],
                    description: ' must be a date and is required',
                },
                horaire: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                agents: {
                    bsonType: ['array', 'null'],
                    minItems: 0,
                    description: ' must be a array and is not required',
                    items: {
                        bsonType: 'objectId',
                    },
                },
                vehicule: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                notes: {
                    bsonType: ['array', 'null'],
                    description: ' must be a array and is not required',
                },
                annexes: {
                    bsonType: ['array', 'null'],
                    description: ' must be a arrray and is not required',
                },
                quartiers: {
                    bsonType: ['array', 'null'],
                    minItems: 0,
                    description: ' must be a array and is required',
                    items: {
                        bsonType: 'objectId',
                    },
                },
                missions: {
                    bsonType: ['array', 'null'],
                    minItems: 0,
                    description: ' must be a array and is required',
                    items: {
                        bsonType: 'objectId',
                    },
                },
                quartierMissionsValidate: {
                    bsonType: ['array', 'null'],
                    minItems: 0,
                    description: ' must be a array and is required',
                    items: {
                        bsonType: 'objectId',
                    },
                },
            },
        },
    },
};
