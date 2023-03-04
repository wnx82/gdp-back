module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['horaire'],
            properties: {
                _id: {},
                horaire: {
                    bsonType: 'string',
                    description: ' must be a string and is required',
                },
            },
        },
    },
};
