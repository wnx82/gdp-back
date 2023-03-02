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
                description: {
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
            },
        },
    },
};
