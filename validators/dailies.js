module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['date'],
            properties: {
                _id: {},

                date: {
                    bsonType: 'date',
                    description: ' must be a date and is required',
                },
                horaire: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                agents: {
                    bsonType: 'array',
                    minItems: 0,
                    description: ' must be a array and is required',
                    items: {
                        bsonType: 'objectId',
                    },
                },
                vehicule: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                note: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                quartiers: {
                    bsonType: 'array',
                    minItems: 0,
                    description: ' must be a array and is required',
                    items: {
                        bsonType: 'objectId',
                    },
                },
                missions: {
                    bsonType: 'array',
                    minItems: 0,
                    description: ' must be a array and is required',
                    items: {
                        bsonType: 'objectId',
                    },
                },
                annexes: {
                    bsonType: 'array',
                    description: ' must be a arrray and is not required',
                },
                sent: {
                    bsonType: 'date',
                    description: ' must be a date and is required',
                },
            },
        },
    },
};
