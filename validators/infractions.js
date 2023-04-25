module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['category'],
            properties: {
                _id: {},
                category: {
                    bsonType: ['string', 'null'],
                    description: ' must be a string and is required',
                },
                priority: {
                    bsonType: ['number', 'null'],
                    description: ' must be a number and is not required',
                },
                list: {
                    bsonType: ['array', 'null'],
                    description: ' must be a array and is not required',
                },
            },
        },
    },
};
