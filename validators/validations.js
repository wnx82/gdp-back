module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['agent', 'habitation', 'date'],
            properties: {
                _id: {},
                agent: {
                    bsonType: ['object'],
                    description: ' must be a object and is required',
                },
                habitation: {
                    bsonType: ['object'],
                    description: ' must be a object and is required',
                },
                message: {
                    bsonType: ['string'],
                    description: ' must be a string and is not required',
                },
                date: {
                    bsonType: ['date'],
                    description: ' must be a string and is required',
                },
            },
        },
    },
};
