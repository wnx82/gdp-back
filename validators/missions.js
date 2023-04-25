module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['title'],
            properties: {
                _id: {},
                title: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is required',
                },
                description: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                category: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                horaire: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                priority: {
                    bsonType: ['number', 'null'],
                    description: ' must be a number and is not required',
                },
                contact: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is not required',
                },
                visibility: {
                    bsonType: ['bool', 'null'],
                    description: ' must be a booleen and is not required',
                },
                annexes: {
                    bsonType: ['array', 'null'],
                    description: ' must be a array and is not required',
                },
            },
        },
    },
};
