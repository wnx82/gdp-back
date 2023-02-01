module.exports = {
    validator: {
        $jsonSchema: {
            required: ['adresse', 'date.debut', 'date.fin', 'subject'],
            properties: {
                start: {
                    bsonType: 'date',
                },
                end: {
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
