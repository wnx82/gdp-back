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
                missions: {
                    bsonType: 'array',
                    items: {
                        // bsonType: ['objectId'],
                    },
                    description:
                        'missions must be an array of objectIds and is not required',
                },
            },
        },
    },
};
