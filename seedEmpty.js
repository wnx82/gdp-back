// NOSONAR
// seed.js (à la racine du projet)
require('dotenv').config();

const { dbClient, redisClient } = require('./utils');
const { faker } = require('@faker-js/faker');

const bcrypt = require('bcrypt');
const validators = require('./validators');
const ObjectId = require('mongodb').ObjectId;
const cliProgress = require('cli-progress');
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

// Initialisation des variables globales
let createdRues = [];
let createdAgents = [];
let createdHabitations = [];
let createdMissions = [];
let createdMissionsQuartiers = [];
let createdDailyDto = [];
let createdVehicules = [];
let createdCategories = [];
let createdHoraires = []; // Ajout de createdHoraires

// Flush Redis
redisClient.flushall((err, reply) => {
    if (err) {
        console.error(err);
    } else {
        console.log(reply);
    }
});

(async () => {
    const db = dbClient.db(process.env.MONGO_DB_DATABASE);
    const collections = [
        'agents',
        'categories',
        'constats',
        'dailies',
        'habitations',
        'horaires',
        'infractions',
        'missions',
        'quartiers',
        'rapports',
        'rues',
        'validations',
        'vehicules',
    ];
    bar1.start(collections.length, 0);
    let i = 0;
    const existingCollectionsCursor = db.listCollections();
    const existingcollections = await existingCollectionsCursor.toArray();
    const names = existingcollections.map(c => c.name);


    // Définir la fonction generateFormations
    function generateFormations(count) {
        const formations = [];
        for (let i = 0; i < count; i++) {
            formations.push(faker.lorem.words(2));
        }
        return formations;
    }
    // Effacer les données et recréer les collections
    console.log('\u001b[1;32m--------> Redis Flushing <--------\u001b[0m ');

    for (const c of collections) {
        try {
            if (names.includes(c)) {
                console.log(`Dropping collection: ${c}`);
                await db.dropCollection(c);
            }
            if (!(await db.listCollections({ name: c }).hasNext())) {
                console.log(`Creating collection: ${c}`);
                await db.createCollection(c, validators[c] ?? null);
            } else {
                console.log(`Collection ${c} already exists.`);
            }
        } catch (e) {
            console.error(`Failed to create collection ${c}: ${e}`);
            process.exit(1);
        }
    }

    // Dto Data Transfer Objects
    bar1.update(i++);

    // HorairesDto
    const horairesDto = {
        horaire: '07:30-15:00',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    try {
        const createdHoraire = await db.collection('horaires').insertOne(horairesDto);
        console.log('Horaire inserted successfully:', createdHoraire.insertedId);
        createdHoraires.push({ ...horairesDto, insertedId: createdHoraire.insertedId }); // Ajout de l'insertedId à l'objet
    } catch (error) {
        console.error('Error inserting horaire:', error.message, error.stack);
        process.exit(1);
    }

    bar1.update(i++);



    // RuesDto
    const ruesDto = [
        {
            nom: 'Aucune',
            denomination: "",
            nomComplet: "",
            quartier: '',
            cp: 7700,
            localite: '',
            codeRue: '*',
            traductionNl: '',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    try {
        createdRues = await Promise.all(
            ruesDto.map(u => db.collection('rues').insertOne(u))
        );
        console.log('Rues inserted successfully:', createdRues);
    } catch (error) {
        console.error('Error inserting rues:', JSON.stringify(error, null, 2));
        process.exit(1);
    }

    bar1.update(i++);

    // VehiculesDto
    const vehiculeDto = {
        marque: 'Aucun',
        modele: '',
        immatriculation: '',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    
    try {
        const createdVehicule = await db.collection('vehicules').insertOne(vehiculeDto);
        console.log('Vehicule inserted successfully.');
        createdVehicules.push(createdVehicule);
    } catch (error) {
        console.error('Error inserting vehicule:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);

    // CategoriesDto
    const categorieDto = {
        title: 'Aucune',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    
    try {
        const createdCategorie = await db.collection('categories').insertOne(categorieDto);
        console.log('Categorie inserted successfully.');
        createdCategories.push(createdCategorie);
    } catch (error) {
        console.error('Error inserting categorie:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);

    // AgentDto
    const agentDto = {
        email: faker.internet.email(),
        password: bcrypt.hashSync(faker.internet.password(), 10),
        userAccess: faker.number.int({ min: 1, max: 10 }),
        matricule: faker.number.int({ min: 101, max: 199 }),
        firstname: faker.person.firstName(),
        lastname: faker.person.lastName(),
        birthday: faker.date.past(),
        tel: faker.string.octal({ length: 6, prefix: '+32 47' }),
        iceContact: faker.person.firstName() + ' ' + faker.person.lastName() + ' ' + faker.string.octal({ length: 6, prefix: '+32 47' }),
        picture: '',
        formations: generateFormations(2),
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    
    try {
        const createdAgent = await db.collection('agents').insertOne(agentDto);
        createdAgents.push(createdAgent); // Ajoute l'agent créé à la liste des agents
        console.log('createdAgents:', createdAgents);
    } catch (error) {
        console.error('Error inserting agent:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);

    // Admin
    const admin = {
        email: 'admin@admin.com',
        password: await bcrypt.hash('123456789', 10),
        userAccess: 0,
        matricule: 101,
        firstname: 'admin',
        lastname: 'admin',
        picture: '',
        formations: ['Formation 1', 'Formation 2'],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    try {
        await db.collection('agents').insertOne(admin);
        console.log('Admin inserted successfully.');
    } catch (error) {
        console.error('Error inserting admin:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);

    // HabitationDto
    const habitationDto = {
        adresse: {
            rue: new ObjectId(createdRues[0].insertedId),
            numero: faker.string.numeric(2),
        },
        demandeur: {
            nom: faker.person.lastName() + ' ' + faker.person.firstName(),
            tel: faker.string.octal({ length: 6, prefix: '+32 47' }),
        },
        dates: {
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
    };
    
    try {
        const createdHabitation = await db.collection('habitations').insertOne(habitationDto);
        console.log('Habitation created:', createdHabitation.insertedId);
        createdHabitations.push(createdHabitation); // Ajouter à la liste des habitations créées
    } catch (error) {
        console.error('Error inserting habitation:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);
    
     // ValidationDto
     if (createdAgents.length > 0 && createdHabitations.length > 0) {
        const validationDto = {
            agents: [createdAgents[createdAgents.length - 1].insertedId],
            habitation: createdHabitations[createdHabitations.length - 1].insertedId,
            note: faker.lorem.words(),
            date: faker.date.recent(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    
        try {
            const createdValidation = await db.collection('validations').insertOne(validationDto);
            console.log('Validation created:', createdValidation.insertedId);
        } catch (error) {
            console.error('Error inserting validation:', JSON.stringify(error, null, 2));
            process.exit(1);
        }
    }
    bar1.update(i++);
    
    // ConstatsDto
    if (createdAgents.length > 0 && createdRues.length > 0) {
        const constatDto = {
            agents: [
                createdAgents[createdAgents.length - 1].insertedId,
            ],
            date: faker.date.recent(),
            vehicule: {
                marque: faker.vehicle.manufacturer(),
                modele: faker.vehicle.model(),
                couleur: faker.vehicle.color(),
                type: faker.vehicle.type(),
                immatriculation: faker.vehicle.vrm(),
            },
            personne: {
                firstname: faker.person.firstName(),
                lastname: faker.person.lastName(),
                birthday: faker.date.past(),
                nationalNumber: faker.finance.iban({ formatted: true, countryCode: 'BE' }),
                tel: faker.string.octal({ length: 6, prefix: '+32 47' }),
                adresse: {
                    rue: faker.location.streetAddress(),
                    cp: faker.location.zipCode(),
                    localite: faker.location.city(),
                },
            },
            adresse: {
                rue: new ObjectId(
                    createdRues[createdRues.length - 1].insertedId
                ),
                numero: faker.string.numeric(2),
            },
            geolocation: {
                latitude: faker.location.latitude().toString(),
                longitude: faker.location.longitude().toString(),
                horodatage: faker.date.recent(),
            },
            infractions: [faker.lorem.words(), faker.lorem.words()],
            pv: faker.datatype.boolean(),
            notes: faker.lorem.words(),
            annexes: [faker.lorem.words(), faker.lorem.words()],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    
        try {
            const createdConstat = await db.collection('constats').insertOne(constatDto);
            console.log('Constat created:', createdConstat.insertedId);
        } catch (error) {
            console.error('Error inserting constat:', JSON.stringify(error, null, 2));
            process.exit(1);
        }
        bar1.update(i++);
    }

    // InfractionsDto
    const infractionDto = {
        category: 'Aucune',
        priority: 3,
        list: [
            ['Art. 0', 'Aucun'],
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    
    try {
        const createdInfraction = await db.collection('infractions').insertOne(infractionDto);
        console.log('Infraction created:', createdInfraction.insertedId);
    } catch (error) {
        console.error('Error inserting infraction:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);
    
    // MissionsDto
    const missionDto = {
        title: 'Aucun',
        description: '',
        category: 'Ecole',
        horaire: '7h40-8h15',
        priority: 1,
        contact: '',
        visibility: true,
        annexes: [''],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    try {
        const createdMission = await db.collection('missions').insertOne(missionDto);
        console.log('Mission created:', createdMission.insertedId);
        createdMissions.push(createdMission);
    } catch (error) {
        console.error('Error inserting Mission:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);

    // QuartiersDto
    if (createdMissions.length > 0) {
        const quartierDto = {
            title: 'Aucun',
            missions: [
                createdMissions[createdMissions.length - 1].insertedId,
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    
        try {
            const createdQuartier = await db.collection('quartiers').insertOne(quartierDto);
            console.log('Quartier created:', createdQuartier.insertedId);
            createdMissionsQuartiers.push(createdQuartier);
        } catch (error) {
            console.error('Error inserting quartier:', JSON.stringify(error, null, 2));
            process.exit(1);
        }
        bar1.update(i++);
    }

    // DailiesDto
    console.log('createdAgents pour daily:', createdAgents);
    console.log('createdHoraires pour daily:', createdHoraires);
    console.log('createdMissionsQuartiers pour daily:', createdMissionsQuartiers);
    console.log('createdMissions pour daily:', createdMissions);
    console.log('vehiculeDto pour daily:', createdVehicules);

    if (createdAgents.length > 0 && createdHoraires.length > 0 && createdMissionsQuartiers.length > 0 && createdMissions.length > 0 && createdVehicules.length > 0) {
        const dailyDto = {
            date: faker.date.recent(),
            agents: [
                createdAgents[createdAgents.length - 1].insertedId,
            ],
            horaire: createdHoraires[createdHoraires.length - 1].horaire,
            vehicule: createdVehicules[createdVehicules.length - 1].marque,
            quartiers: [
                createdMissionsQuartiers[createdMissionsQuartiers.length - 1].insertedId,
            ],
            missions: [
                createdMissions[createdMissions.length - 1].insertedId,
            ],
            notes: faker.lorem.words(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        try {
            const createdDaily = await db.collection('dailies').insertOne(dailyDto);
            console.log('Daily created:', createdDaily.insertedId);
            createdDailyDto.push(createdDaily); // Ajouter à la liste des dailies créées
        } catch (error) {
            console.error('Error inserting daily:', JSON.stringify(error, null, 2));
            process.exit(1);
        }
        bar1.update(i++);
    } else {
        console.error('Required data is missing. Cannot create dailyDto.');
        process.exit(1);
    }

    // RapportsDto
    console.log('createdDailyDto pour Rapport:', createdDailyDto);
    console.log('createdAgents pour Rapport:', createdAgents);
    console.log('createdMissionsQuartiers pour Rapport:', createdMissionsQuartiers);
    console.log('createdMissions pour Rapport:', createdMissions);
    console.log('createdVehicules pour Rapport:', createdVehicules);

    if (createdDailyDto.length > 0) {
        console.log('createdDailyDto is not empty');
    } else {
        console.error('createdDailyDto is empty');
    }

    if (createdAgents.length > 0) {
        console.log('createdAgents is not empty');
    } else {
        console.error('createdAgents is empty');
    }

    if (createdMissionsQuartiers.length > 0) {
        console.log('createdMissionsQuartiers is not empty');
    } else {
        console.error('createdMissionsQuartiers is empty');
    }

    if (createdMissions.length > 0) {
        console.log('createdMissions is not empty');
    } else {
        console.error('createdMissions is empty');
    }

    if (createdVehicules.length > 0) {
        console.log('createdVehicules is not empty');
    } else {
        console.error('createdVehicules is empty');
    }

    if (createdDailyDto.length > 0 && createdAgents.length > 0 && createdMissionsQuartiers.length > 0 && createdMissions.length > 0 && createdVehicules.length > 0) {
        const rapportDto = {
            daily: createdDailyDto[createdDailyDto.length - 1].insertedId,
            date: faker.date.recent(),
            horaire: createdHoraires[createdHoraires.length - 1].horaire, // Assurez-vous que c'est une chaîne de caractères
            agents: [
                createdAgents[createdAgents.length - 1].insertedId,
            ],
            vehicule: vehiculeDto.marque, // Assurez-vous que c'est une chaîne de caractères
            quartiers: [
                createdMissionsQuartiers[createdMissionsQuartiers.length - 1].insertedId,
            ],
            quartierMissionsValidate: [
                createdMissions[createdMissions.length - 1].insertedId,
            ],
            missions: [
                createdMissions[createdMissions.length - 1].insertedId,
            ],
            notes: faker.lorem.words(),
            annexes: faker.lorem.words(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        try {
            const createdRapport = await db.collection('rapports').insertOne(rapportDto);
            console.log('Rapport created:', createdRapport.insertedId);
        } catch (error) {
            console.error('Error inserting rapport:', JSON.stringify(error, null, 2));
            process.exit(1);
        }
        bar1.update(i++);
    } else {
        console.error('Required data is missing. Cannot create rapportDto.');
        process.exit(1);
    }



    bar1.stop();
    console.clear();
    collections.forEach(collection => {
        console.log('Collection ' + collection + ' créée');
    });
    console.log('\x1b[41m', '\x1b[1m', 'Seed Implémenté', '\x1b[0m');

    process.exit(0);
})();
