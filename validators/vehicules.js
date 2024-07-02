module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['marque', 'immatriculation'],
            properties: {
                _id: {
                    bsonType: 'objectId',
                    description: 'must be an objectId and is required',
                },
                marque: {
                    bsonType: 'string',
                    description: 'must be a string and is required',
                },
                modele: {
                    bsonType: 'string',
                    description: 'must be a string and is not required',
                },
                couleur: {
                    bsonType: 'string',
                    description: 'must be a string and is not required',
                },
                type: {
                    bsonType: 'string',
                    description: 'must be a string and is not required',
                },
                immatriculation: {
                    bsonType: 'string',
                    description: 'must be a string and is required',
                },
            },
        },
    },
};
