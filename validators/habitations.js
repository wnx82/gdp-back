module.exports = {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['adresse', 'date'],
            properties: {
                _id: {},
                adresse: {
                    bsonType: 'object',
                    required: ['rue', 'cp', 'localite'],
                    description: ' must be a object and is required',
                    properties: {
                        rue: { bsonType: 'string' },
                        cp: { bsonType: 'string' },
                        localite: { bsonType: 'string' },
                    },
                },
                demandeur: {
                    bsonType: 'object',
                    required: ['nom'],
                    description: ' must be a object and is not required',
                    properties: {
                        nom: { bsonType: 'string' },
                        tel: { bsonType: 'string' },
                    },
                },
                date: {
                    bsonType: 'object',
                    required: ['debut', 'fin'],
                    description: ' must be a object and is required',
                    properties: {
                        debut: { bsonType: 'date' },
                        fin: { bsonType: 'date' },
                    },
                },
                mesures: {
                    bsonType: 'array',
                    description: ' must be a array and is not required',
                },
                vehicule: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
                googlemap: {
                    bsonType: 'string',
                    description: ' must be a string and is not required',
                },
            },
        },
    },
};
