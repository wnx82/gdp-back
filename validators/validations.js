module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['agents', 'habitation', 'date'],
            properties: {
                _id: {},
                agents: {
                    // agent et habitation sont maintenant des tableaux d'objectId
                    bsonType: ['array', 'null'],
                    items: {
                        bsonType: ['objectId', 'null'],
                    },
                    description:
                        'Agent must be an array of objectIds and is required',
                },
                habitation: {
                    bsonType: ['array', 'null'],
                    items: {
                        bsonType: ['objectId', 'null'],
                    },
                    description:
                        'Habitation must be an array of objectIds and is required',
                },
                note: {
                    bsonType: ['string', 'null'],
                    description: 'Note must be a string and is not required',
                },
                date: {
                    bsonType: ['date', 'null'],
                    description: 'Date must be a date and is required',
                },
            },
        },
    },
};
