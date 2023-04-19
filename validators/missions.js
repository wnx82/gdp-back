module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['title'],
            properties: {
                _id: {},
                title: {
                    bsonType: 'string',
                    description: ' must be a string and is required',
                },
                description: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                category: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                horaire: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                priority: {
                    bsonType: 'number',
                    description: ' must be a number and is not required',
                },
                contact: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                visibility: {
                    bsonType: 'bool',
                    description: ' must be a booleen and is not required',
                },
                annexes: {
                    bsonType: 'array',
                    description: ' must be a array and is not required',
                },
            },
        },
    },
};
