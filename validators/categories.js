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
            },
        },
    },
};
