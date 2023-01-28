module.exports = {
    validator: {
        $jsonSchema: {
            required: ['location', 'end', 'start', 'subject'],
            properties: {
                end: {
                    bsonType: 'date',
                },
                start: {
                    bsonType: 'date',
                },
                subject: {
                    bsonType: 'string',
                    description: 'must be a string and is required',
                },
                location: {
                    bsonType: 'string',
                    description: 'must be a string and is required',
                },
                participants: {
                    bsonType: 'array',
                    minItems: 2,
                    items: {
                        bsonType: 'objectId',
                    },
                },
            },
        },
    },
};
