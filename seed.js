//NOSONAR
// seed.js (à la racine du projet)
require('dotenv').config({ path: '.env' });
const { dbClient, redisClient } = require('./utils/');
const { faker } = require('@faker-js/faker');
// const dbClient = require('./utils/db-client.util');
const bcrypt = require('bcrypt');
const validators = require('./validators');
// const { string, array } = require('joi');
// const ObjectId = require('mongodb').ObjectId;

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
    const collections = [
        'agents',
        'constats',
        'dailies',
        'habitations',
        'infractions',
        'missions',
        'quartiers',
        'validations',
    ];
    const existingCollectionsCursor = db.listCollections();
    const existingcollections = await existingCollectionsCursor.toArray();
    const names = existingcollections.map(c => c.name);
    console.log(names);

    //on efface les données et on les recrée
    console.log(
        '\u001b[1;31m----------------- Redis Flushing ------------------------------------\u001b[0m '
    );
    collections.forEach(async c => {
        try {
            if (names.includes(c)) {
                console.log(`Dropping collection: ${c}`);
                await db.dropCollection(c);
            } else console.log(`Creating collection: ${c}`);
            await db.createCollection(c, validators[c] ?? null);
        } catch (e) {
            console.error(`Failed to connect to MongoDB: ${e}`);
            process.exit(1);
        } finally {
            // await client.close();
        }
    });

    // DTO = DATA TRANSFER OBJECT

    const admin = {
        email: 'admin@admin.com',
        password: await bcrypt.hash('123456789', 10),
        userAccess: 0,
        matricule: 'A113',
        firstname: 'Administrator',
        lastname: 'Administrator',
        adresse: {
            rue: faker.address.streetAddress(),
            cp: faker.address.zipCode(),
            localite: faker.address.city(),
        },
        picture: 'https://cdn-icons-png.flaticon.com/512/1946/1946392.png',
        // formations: faker.datatype.array(2),
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    //Dto Data Transfert Objects
    const agentsDto = await Promise.all(
        [...Array(15)].map(async () => {
            return {
                email: faker.internet.email(),
                password: bcrypt.hashSync(faker.internet.password(), 10),
                userAccess: faker.datatype.number({ min: 1, max: 10 }),
                matricule: 'A1' + faker.random.numeric(2),
                firstname: faker.name.firstName(),
                lastname: faker.name.lastName(),
                birthday: faker.date.past(),
                tel: faker.phone.number('+32 47#######'), // '+48 91 463 61 70',
                adresse: {
                    rue: faker.address.streetAddress(),
                    cp: faker.address.zipCode(),
                    localite: faker.address.city(),
                },
                picture:
                    'https://cdn-icons-png.flaticon.com/512/1946/1946392.png',
                formations: faker.datatype.array(2),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        })
    );
    db.collection('agents').insertOne(admin);
    console.log(agentsDto);
    console.log(
        '\u001b[1;31m----------------- Collection agents créée ------------------------------------\u001b[0m '
    );
    const createdAgents = await Promise.all(
        agentsDto.map(u => db.collection('agents').insertOne(u))
    );
    const habitationsDto = [...Array(15)].map(() => ({
        adresse: {
            rue: faker.address.streetAddress(),
            cp: faker.address.zipCode(),
            localite: faker.address.city(),
        },
        demandeur: {
            nom: faker.name.lastName() + ' ' + faker.name.firstName(),
            tel: faker.phone.number('+32 47# ### ###'),
        },
        date: {
            debut: faker.date.past(),
            fin: faker.date.future(),
        },
        mesures: [
            "Système d'alarme : Oui",
            'Eclairage extérieur : Oui',
            "Minuterie d'éclairage : Oui",
            'Société gardiennage : Non',
            'Chien : Non',
            "Présence d'un tiers : Non",
            'Autres : volets roulants programmables, éclairage programmé entrée et chambres',
        ],
        vehicule: faker.vehicle.model(),
        googlemap: faker.internet.url(),
        createdAt: new Date(),
        updatedAt: new Date(),
    }));
    console.log(habitationsDto);
    const createdHabitations = await Promise.all(
        habitationsDto.map(u => db.collection('habitations').insertOne(u))
    );

    console.log(
        '\u001b[1;31m----------------- Collection habitations créée ------------------------------------\u001b[0m '
    );
    const validationsDto = [...Array(15)].map(() => ({
        agent: [createdAgents[Math.floor(Math.random() * 15)].insertedId],
        habitation: [
            createdHabitations[Math.floor(Math.random() * 15)].insertedId,
        ],
        note: faker.lorem.words(),
        date: faker.date.recent(),
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    console.log(validationsDto);
    await Promise.all(
        validationsDto.map(u => db.collection('validations').insertOne(u))
    );

    console.log(
        '----------------- Collection validations créée ------------------------------------\u001b[0m '
    );

    const constatsDto = [...Array(25)].map(() => ({
        agents: [
            createdAgents[Math.floor(Math.random() * 15)].insertedId,
            createdAgents[Math.floor(Math.random() * 15)].insertedId,
        ],
        date: faker.date.recent(),
        vehicule: {
            marque: faker.vehicle.manufacturer(),
            modele: faker.vehicle.model(),
            couleur: faker.vehicle.color(),
            type: faker.vehicle.type(),
            immatriculation: faker.vehicle.vrm(),
        },
        adresse: {
            rue: faker.address.streetAddress(),
            cp: faker.address.zipCode(),
            localite: faker.address.city(),
        },
        geolocation: {
            latitude: faker.address.latitude(),
            longitude: faker.address.longitude(),
            horodatage: faker.date.recent(),
        },
        infraction: [faker.lorem.words(), faker.lorem.words()],
        pv: faker.datatype.boolean(),
        note: faker.lorem.words(),
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    console.log(constatsDto);
    await Promise.all(
        constatsDto.map(u => db.collection('constats').insertOne(u))
    );
    console.log(
        '\u001b[1;31m----------------- Collection constats créée ------------------------------------\u001b[0m '
    );

    const infractionsDto = [
        {
            category: 'RGP',
            priority: 3,
            list: [
                ['Art. 9', 'Affichage publicitaire'],
                ['Art. 41', 'Mécanique sur la voie publique'],
                ['Art. 44', 'N° de maison/sonnette/boîtes lettres'],
                ['Art. 57', 'Bombes/sprays'],
                ['Art. 95', 'Alcool sur voie publique'],
                ['Art. 96', 'Sonner/Frapper aux portes'],
                ['Art. 106', 'Mendicité'],
                ['Art. 123', 'Déversement dans les avaloirs'],
                ['Art. 124', "Trottoir et filet d'eau non entretenu"],
                ['Art. 125', 'Uriner'],
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            category: 'Arrêt et stationnement',
            priority: 1,
            list: [
                ['Art. 29', 'Hors zones'],
                ['Art. 31', 'Sur dispositifs surélevés'],
                ['Art. 32', 'Dans zones piétonnes'],
                ['Art. 34-1-1', 'Sur trottoir'],
                ['Art. 34-1-4', 'Sur Passage à niveau'],
                ['Art. 35-1-6', 'A proximité du passage à niveau'],
                ['Art. 34-1-9', 'A -5m du carrefour'],
                ['Art. 34-2-1', 'Sur marquage blanc'],
                ['Art. 34-1-2', "Sur/à moins de 3m d'une piste cyclable"],
                ['Art. 34-1-3', "Sur/à moins de 5m d'une piste cyclable"],
                ['Art. 34-1-5', "Sur/à moins de 3m d'un passage piétons"],
                ['Art. 34-1-6', "Sur/à moins de 5m d'un passage piétons"],
                ['Art. 35-1-2', "A -15m d'un arrêt de bus"],
                ['Art. 35.1.3', 'Devant un accès privé'],
                ['Art. 39', 'Zone de livraison'],
                ['Art. 36', 'Zone bleue : Mauvaise heure'],
                ['Art. 39', 'Zone bleue : Pas de disque'],
                ['Art. 35-14', 'Emplacement PMR : Sans carte'],
                ['Art. 38', "Emplacement PMR: Oubli d'apposer la carte"],
                ['Art. 39', 'Zone sourise à autorisation'],
                ['Art. 40', 'Non-respect du signal C3'],
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            category: 'Déchets',
            priority: 3,
            list: [
                ['Art. 126', 'Jets de déchets'],
                ['Art. 158 b', "PAV (Point d'apport volontaire)"],
                ['Art. 165', 'Dépôt sauvage'],
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            category: 'Site spécifique',
            priority: 4,
            list: [
                ['Art. 5', 'Parking/Non-respect du ROI'],
                ['Art. 83', 'Parc/Non-respect du ROI'],
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            category: 'Animaux',
            priority: 5,
            list: [
                ['Art. 46-7', 'Déjections'],
                ['Art. 46-9', 'Tenue en laisse'],
                ['Art. 46-10', 'Muselière'],
                ['Art. 46-14', 'Zone de liberté'],
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            category: 'Occupation de voie publique',
            priority: 6,
            list: [['Art. 18', "Défaut d'autorisation"]],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    console.log(infractionsDto);
    await Promise.all(
        infractionsDto.map(u => db.collection('infractions').insertOne(u))
    );
    console.log(
        '\u001b[1;31m----------------- Collection infractions créée ------------------------------------\u001b[0m '
    );

    const horairesDto = [
        {
            horaires: ['07h30-15h', '08h30-16h', '10h30-18h'],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];
    const vehiculesDto = [
        {
            marque: 'Skoda',
            model: '',
            immatriculation: '1XRJ929',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            marque: 'Dacia',
            model: '',
            immatriculation: '1GFV206',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            marque: 'Peugeot',
            model: '',
            immatriculation: '1AMS560',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    const missionsDto = [
        {
            title: 'Ecole St Ex',
            description: '',
            category: '',
            horaire: '',
            priority: 1,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Zone Bleue',
            description: '',
            category: '',
            horaire: '',
            priority: 1,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Zone de livraison',
            description: '',
            category: '',
            horaire: '',
            priority: 1,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Stationnement',
            description: '',
            category: '',
            horaire: '',
            priority: 1,
            contact: '',
            visibility: true,
            annexes: [''],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Arrêt et stationnemnt',
            description: '',
            category: '',
            horaire: '',
            priority: 1,
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

    const dailyDto = [
        {
            date: faker.date.recent(),
            agents: [
                createdAgents[Math.floor(Math.random() * 15)].insertedId,
                createdAgents[Math.floor(Math.random() * 15)].insertedId,
            ],
            horaire: horairesDto[0].horaires[1],
            vehicule: vehiculesDto[0].marque,
            quartiers: [
                createdMissionsQuartiers[Math.floor(Math.random() * 2)]
                    .insertedId,
            ],
            missions: [
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
            ],
            note: '',

            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            date: faker.date.recent(),
            agents: [
                createdAgents[Math.floor(Math.random() * 15)].insertedId,
                createdAgents[Math.floor(Math.random() * 15)].insertedId,
            ],
            horaire: horairesDto[0].horaires[2],
            vehicule: vehiculesDto[1].marque,
            quartiers: [
                createdMissionsQuartiers[Math.floor(Math.random() * 2)]
                    .insertedId,
            ],
            missions: [
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
                createdMissions[Math.floor(Math.random() * 5)].insertedId,
            ],
            note: '',

            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];
    console.log(dailyDto);
    const createdDailyDto = await Promise.all(
        dailyDto.map(u => db.collection('dailies').insertOne(u))
    );
    process.exit(0);
})();
