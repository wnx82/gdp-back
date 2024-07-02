module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['firstname', 'lastname'],
            properties: {
                _id: {
                    bsonType: 'objectId',
                    description: 'must be an objectId and is required',
                },
                firstname: {
                    bsonType: 'string',
                    description: 'must be a string and is required',
                },
                lastname: {
                    bsonType: 'string',
                    description: 'must be a string and is required',
                },
                birthday: {
                    bsonType: 'date',
                    description: 'must be a date and is not required',
                },
                nationalNumber: {
                    bsonType: 'string',
                    description: 'must be a string and is not required',
                },
                tel: {
                    bsonType: 'string',
                    description: 'must be a string and is not required',
                },
                rue: {
                    bsonType: 'string',
                    description: 'must be a string and is not required',
                },
                cp: {
                    bsonType: 'string',
                    description: 'must be a string and is not required',
                },
                localite: {
                    bsonType: 'string',
                    description: 'must be a string and is not required',
                },
            },
        },
    },
};
