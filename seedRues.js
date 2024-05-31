require('dotenv').config();
const { dbClient } = require('./utils/');
const ObjectId = require('mongodb').ObjectId;

(async () => {
    try {
        const db = dbClient.db(process.env.MONGO_DB_DATABASE);

        const ruesDto = [
            {
                nom: 'Abattoir',
                denomination: "rue de l'",
                nomComplet: "rue de l'Abattoir",
                quartier: 'Zoning',
                cp: 7700,
                localite: 'Mouscron',
                codeRue: '*0316',
                traductionNl: 'Slachthuisstraat',
                xMin: '',
                xMax: '',
                yMin: '',
                yMax: '',
                idTronconCentral: '',
            },
            {
                nom: 'Alouettes',
                denomination: "rue des",
                nomComplet: "rue des Alouettes",
                quartier: 'Centre',
                cp: 7700,
                localite: 'Mouscron',
                codeRue: '*0317',
                traductionNl: 'Leeuwerikstraat',
                xMin: '',
                xMax: '',
                yMin: '',
                yMax: '',
                idTronconCentral: '',
            },
            // Ajoutez ici d'autres rues si nécessaire...
        ];

        // Drop collection if it exists
        const existingCollectionsCursor = db.listCollections({ name: 'rues' });
        const existingCollections = await existingCollectionsCursor.toArray();
        if (existingCollections.length > 0) {
            console.log('Dropping collection: rues');
            await db.dropCollection('rues');
        }

        // Create collection and insert data
        console.log('Creating collection: rues');
        await db.createCollection('rues');
        await db.collection('rues').insertMany(ruesDto);

        console.log('Rues collection has been created and seeded successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding rues collection:', error);
        process.exit(1);
    }
})();
