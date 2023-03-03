//NOSONAR
// seed.js (à la racine du projet)
require('dotenv').config({ path: '.env' });
const { dbClient, redisClient } = require('./utils');
const { faker } = require('@faker-js/faker');
const validators = require('./validators');

// Flush Redis

redisClient.flushall((err, reply) => {
    if (err) {
        console.error(err);
    } else {
        console.log(reply);
    }
});
(async () => {
    const db = dbClient.db(process.env.MONGODB_DATABASE);
    const collections = ['missions'];
    const existingCollectionsCursor = db.listCollections();
    const existingcollections = await existingCollectionsCursor.toArray();
    const names = existingcollections.map(c => c.name);
    console.log(names);

    const missionsDto = [
        {
            //Centre

            title: 'Présence abords école 7h40-8h15',
            description:
                "Faire respecter le stationnement afin d'assurer la sécurité des enfants",
            category: 'Ecole',
            horaire: '7h40-8h15',
            priority: 1,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Présence abords école 11h45-12h15',
            description:
                "Faire respecter le stationnement afin d'assurer la sécurité des enfants",
            category: 'Ecole',
            horaire: '11h45-12h15',
            priority: 1,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Présence abords école 14h50-15h15',
            description:
                "Faire respecter le stationnement afin d'assurer la sécurité des enfants",
            category: 'Ecole',
            horaire: '14h50-15h15',
            priority: 1,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Arrêt et stationnement',
            description: 'Faire respecter le code de la route',
            category: 'Code de la route',
            horaire: '14h50-15h15',
            priority: 1,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Zones bleues/Zones de livraison',
            description:
                'Faire respecter le roulement sur les ZB + contact commerçant',
            category: 'Code de la route',
            horaire: '',
            priority: 3,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'PMR',
            description: 'Faire respecter les zones PMR + vérification cartes',
            category: 'Code de la route',
            horaire: '',
            priority: 2,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Surveillance habitation',
            description:
                "Assurer un regard afin de détecter s'il y a eu effraction",
            category: 'Prévention vol',
            horaire: '',
            priority: 4,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Dans les clos résidentiels',
            description:
                'Assurer un regard afin de détecter tout agissement suspect',
            category: 'Patrouilles préventives',
            horaire: '',
            priority: 5,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Cimetières',
            description:
                'Assurer un regard afin de détecter tout agissement suspect',
            category: 'Patrouilles préventives',
            horaire: '',
            priority: 5,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },

        {
            title: 'Parc',
            description:
                'Parc communal + Shalom : Assurer un regard afin de détecter tout agissement suspect',
            category: 'Patrouilles préventives',
            horaire: '',
            priority: 2,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Marché hebdomadaire',
            description:
                'Mardi : Assurer un regard afin de détecter tout agissement suspect',
            category: 'Patrouilles préventives',
            horaire: '',
            priority: 2,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Marché hebdomadaire',
            description:
                'Jeudi : Assurer un regard afin de détecter tout agissement suspect',
            category: 'Patrouilles préventives',
            horaire: '',
            priority: 2,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Rénovation urbaine',
            description:
                'Assurer un regard afin de détecter tout agissement suspect',
            category: 'Patrouilles préventives',
            horaire: '',
            priority: 1,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Parc',
            description: 'Fermeture du parc communal',
            category: 'Patrouilles préventives',
            horaire: '',
            priority: 1,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Parc',
            description:
                'Bois Labis + Bois du Curé : Assurer un regard afin de détecter tout agissement suspect',
            category: 'Patrouilles préventives',
            horaire: '',
            priority: 1,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Parc',
            description:
                'Parc du Chalet : Assurer un regard afin de détecter tout agissement suspect',
            category: 'Patrouilles préventives',
            horaire: '',
            priority: 1,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Plaines',
            description:
                'Panorama : Assurer un regard afin de détecter tout agissement suspect',
            category: 'Patrouilles préventives',
            horaire: '',
            priority: 5,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Plaines',
            description:
                "Haverie + Champ d`'Aviation: Assurer un regard afin de détecter tout agissement suspect",
            category: 'Patrouilles préventives',
            horaire: '16h-19h',
            priority: 5,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Plaines',
            description:
                'J. Rousseau + Eglise : Assurer un regard afin de détecter tout agissement suspect',
            category: 'Patrouilles préventives',
            horaire: '16h-19h',
            priority: 5,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Plaines',
            description:
                'Max Lessines : Assurer un regard afin de détecter tout agissement suspect',
            category: 'Patrouilles préventives',
            horaire: '',
            priority: 5,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Plaines',
            description:
                'Nell : Assurer un regard afin de détecter tout agissement suspect',
            category: 'Patrouilles préventives',
            horaire: '',
            priority: 5,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];
    console.log(missionsDto);
    const createdMissions = await Promise.all(
        missionsDto.map(u => db.collection('missions').insertOne(u))
    );

    const quartiersDto = [
        {
            title: 'Nouveau-Monde',
            missions: [
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Centre',
            missions: [
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];
    console.log(quartiersDto);
    const createdMissionsQuartiers = await Promise.all(
        quartiersDto.map(u => db.collection('quartiers').insertOne(u))
    );

    process.exit(0);
})();
