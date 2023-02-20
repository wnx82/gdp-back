module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['agent', 'habitation', 'date'],
            properties: {
                _id: {},
                agent: {
                    bsonType: ['objectId'],
                    description: ' must be a string and is required',
                },
                habitation: {
                    bsonType: ['objectId'],
                    description: ' must be a string and is required',
                },
                message: {
                    bsonType: ['string'],
                    description: ' must be a string and is not required',
                },
                date: {
                    bsonType: ['date'],
                    description: ' must be a date and is required',
                },
            },
        },
    },
};
