module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['agent', 'habitation', 'date'],
            properties: {
                _id: {
                    bsonType: 'objectId',
                },
                agent: {
                    // agent et habitation sont maintenant des tableaux d'objectId
                    bsonType: 'array',
                    items: {
                        bsonType: ['objectId'],
                    },
                    description:
                        'Agent must be an array of objectIds and is required',
                },
                habitation: {
                    bsonType: 'array',
                    items: {
                        bsonType: ['objectId'],
                    },
                    description:
                        'Habitation must be an array of objectIds and is required',
                },
                note: {
                    bsonType: 'string',
                    description: 'Note must be a string and is not required',
                },
                date: {
                    bsonType: 'date',
                    description: 'Date must be a date and is required',
                },
            },
        },
    },
};
