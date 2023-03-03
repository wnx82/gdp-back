module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['marque'],
            properties: {
                _id: {},
                marque: {
                    bsonType: 'string',
                    description: ' must be a string and is required',
                },
                modele: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                immatriculation: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
            },
        },
    },
};
