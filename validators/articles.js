module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['title', 'category', 'date', 'content'],
            properties: {
                _id: {},
                title: {
                    bsonType: 'string',
                    description: 'Title must be a string and is required',
                },
                category: {
                    bsonType: 'string',
                    description: 'Category must be a string and is required',
                },
                date: {
                    bsonType: 'date',
                    description: 'Date must be a date and is required',
                },
                content: {
                    bsonType: 'string',
                    description: 'Content must be a string and is required',
                },
                attachments: {
                    bsonType: ['array', 'null'],
                    items: {
                        bsonType: 'object',
                        properties: {
                            filename: { bsonType: 'string' },
                            url: { bsonType: 'string' },
                        },
                    },
                    description: 'Attachments must be an array of objects and is not required',
                },
                author: {
                    bsonType: 'string',
                    description: 'Author must be a string and is not required',
                },
            },
        },
    },
};
