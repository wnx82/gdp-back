//NOSONAR
// seed.js (à la racine du projet)
require('dotenv').config();

// require('dotenv').config({ path: '.env' });
const { dbClient, redisClient } = require('./utils/');
const { faker } = require('@faker-js/faker');

const bcrypt = require('bcrypt');
const validators = require('./validators');
const ObjectId = require('mongodb').ObjectId;
const cliProgress = require('cli-progress');
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

// Initialisation des variables globales
const createdArticles = [];
let createdRues, createdAgents, createdHabitations, createdMissions, createdMissionsQuartiers, createdDailyDto;

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
        'articles',
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
    // console.log(names);

    //on efface les données et on les recrée
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

    //Dto Data Transfert Objects
    bar1.update(i++);
    
    const horairesDto = [
        {
            horaire: '07:30-15:00',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            horaire: '08:30-16:00',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            horaire: '10:30-18:00',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            horaire: '16:00-22:00',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            horaire: '09:00-16:30',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];
    try {
        await Promise.all(
            horairesDto.map(u => db.collection('horaires').insertOne(u))
        );
    } catch (error) {
        console.error('Error inserting horaires:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);

    const vehiculesDto = [
        {
            marque: 'Aucun',
            modele: '',
            immatriculation: '',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            marque: 'Skoda',
            modele: 'Octavia',
            immatriculation: '1XRJ929',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            marque: 'Dacia',
            modele: 'Duster',
            immatriculation: '1GFV206',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            marque: 'Peugeot',
            modele: '307',
            immatriculation: '1AMS560',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];
    try {
        await Promise.all(
            vehiculesDto.map(u => db.collection('vehicules').insertOne(u))
        );
    } catch (error) {
        console.error('Error inserting vehicules:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);

    const categoriesDto = [
        {
            title: 'Altercation/Agression',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Informations',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Requêtes',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Secours',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];
    try {
        await Promise.all(
            categoriesDto.map(u => db.collection('categories').insertOne(u))
        );
    } catch (error) {
        console.error('Error inserting categories:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);

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
            nom: 'Abbé Coulon',
            denomination: "rue de l'",
            nomComplet: "rue de l'Abbé Coulon",
            quartier: 'Centre',
            cp: 7700,
            localite: 'Mouscron',
            codeRue: '*0063',
            traductionNl: 'Priester Coulonstraat',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Abbé L.M. Goormachtigh',
            denomination: 'boulevard',
            nomComplet: 'boulevard Abbé L.M. Goormachtigh',
            quartier: 'Dottignies',
            cp: 7711,
            localite: 'Dottignies',
            codeRue: '*2108',
            traductionNl: 'Priester L.M. Goormachtighlaan',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Acacias',
            denomination: 'avenue des',
            nomComplet: 'avenue des Acacias',
            quartier: 'Dottignies',
            cp: 7711,
            localite: 'Dottignies',
            codeRue: '*2081',
            traductionNl: 'Acaciaslaan',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Aelbeke',
            denomination: "chaussée d'",
            nomComplet: "chaussée d'Aelbeke",
            quartier: 'Coquinie',
            cp: 7700,
            localite: 'Mouscron',
            codeRue: '*0001',
            traductionNl: 'Aelbekesteenweg',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Agriculture',
            denomination: "rue de l'",
            nomComplet: "rue de l'Agriculture",
            quartier: 'Nouveau-Monde',
            cp: 7700,
            localite: 'Mouscron',
            codeRue: '*0002',
            traductionNl: 'Landbouwstraat',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Albert Ier',
            denomination: 'avenue',
            nomComplet: 'avenue Albert Ier',
            quartier: 'Luingne',
            cp: 7712,
            localite: 'Herseaux',
            codeRue: '*3001',
            traductionNl: 'Albert Ier-laan',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Albert Ier',
            denomination: 'rue',
            nomComplet: 'rue Albert Ier',
            quartier: 'Luingne',
            cp: 7700,
            localite: 'Luingne',
            codeRue: '*1001',
            traductionNl: 'Albert ier-straat',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Alliés',
            denomination: 'boulevard des',
            nomComplet: 'boulevard des Alliés',
            quartier: 'Dottignies',
            cp: 7711,
            localite: 'Dottignies',
            codeRue: '*2002',
            traductionNl: 'Geallieerdenlaan',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Alliés',
            denomination: 'boulevard des',
            nomComplet: 'boulevard des Alliés',
            quartier: 'Luingne',
            cp: 7700,
            localite: 'Luingne',
            codeRue: '*1045',
            traductionNl: 'Geallieerdenlaan',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Alliés',
            denomination: 'rue des',
            nomComplet: 'rue des Alliés',
            quartier: 'Herseaux',
            cp: 7712,
            localite: 'Herseaux',
            codeRue: '*3002',
            traductionNl: 'Bondgenotenstraat',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Allosery',
            denomination: 'rue Albert',
            nomComplet: 'rue Albert Allosery',
            quartier: 'Herseaux',
            cp: 7712,
            localite: 'Herseaux',
            codeRue: '*3126',
            traductionNl: 'Albert Alloserystraat',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Allumoirs',
            denomination: 'carrière des',
            nomComplet: 'carrière des Allumoirs',
            quartier: 'Herseaux',
            cp: 7712,
            localite: 'Herseaux',
            codeRue: '*3088',
            traductionNl: 'Toverlantaarnenweg',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Alouettes',
            denomination: 'clos des',
            nomComplet: 'clos des Alouettes',
            quartier: 'Dottignies',
            cp: 7711,
            localite: 'Dottignies',
            codeRue: '*2086',
            traductionNl: 'Leeuwerikenerf',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Ancien Château',
            denomination: "rue de l'",
            nomComplet: "rue de l'Ancien Château",
            quartier: 'Herseaux',
            cp: 7712,
            localite: 'Herseaux',
            codeRue: '*3015',
            traductionNl: 'Oud Kasteelstraat',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Anémones',
            denomination: 'clos des',
            nomComplet: 'clos des Anémones',
            quartier: 'Herseaux',
            cp: 7712,
            localite: 'Herseaux',
            codeRue: '*3108',
            traductionNl: 'Anemonenerf',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Angleterre',
            denomination: "rue d'",
            nomComplet: "rue d'Angleterre",
            quartier: 'Mont-à-Leux',
            cp: 7700,
            localite: 'Mouscron',
            codeRue: '*0004',
            traductionNl: 'Engelandstraat',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Anseele',
            denomination: 'rue Edouard',
            nomComplet: 'rue Edouard Anseele',
            quartier: 'Mont-à-Leux',
            cp: 7700,
            localite: 'Mouscron',
            codeRue: '*0005',
            traductionNl: 'Edouard Anseelestraat',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Anvers',
            denomination: "rue d'",
            nomComplet: "rue d'Anvers",
            quartier: 'Mont-à-Leux',
            cp: 7700,
            localite: 'Mouscron',
            codeRue: '*0006',
            traductionNl: 'Antwerpenstraat',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Arbalétriers',
            denomination: 'avenue des',
            nomComplet: 'avenue des Arbalétriers',
            quartier: 'Coquinie',
            cp: 7700,
            localite: 'Mouscron',
            codeRue: '*0276',
            traductionNl: 'Kruisboogschutterslaan',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Archers',
            denomination: 'avenue des',
            nomComplet: 'avenue des Archers',
            quartier: 'Coquinie',
            cp: 7700,
            localite: 'Mouscron',
            codeRue: '*0279',
            traductionNl: 'Boogschutterslaan',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Ardennes',
            denomination: 'clos des',
            nomComplet: 'clos des Ardennes',
            quartier: 'Tuquet',
            cp: 7700,
            localite: 'Mouscron',
            codeRue: '*0292',
            traductionNl: 'Ardennenerf',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Arsenal',
            denomination: "rue de l'",
            nomComplet: "rue de l'Arsenal",
            quartier: 'Dottignies',
            cp: 7711,
            localite: 'Dottignies',
            codeRue: '*2014',
            traductionNl: 'Arsenaalstraat',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Artistes',
            denomination: 'rue des',
            nomComplet: 'rue des Artistes',
            quartier: 'Tuquet',
            cp: 7700,
            localite: 'Mouscron',
            codeRue: '*0007',
            traductionNl: 'Kunstenaarsstraat',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Aspirants',
            denomination: 'sentier des',
            nomComplet: 'sentier des Aspirants',
            quartier: 'Herseaux',
            cp: 7712,
            localite: 'Herseaux',
            codeRue: '*3003',
            traductionNl: 'Anzoekerspad',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Atre',
            denomination: "rue de l'",
            nomComplet: "rue de l'Atre",
            quartier: 'Mont-à-Leux',
            cp: 7700,
            localite: 'Mouscron',
            codeRue: '*0208',
            traductionNl: 'Haardstraat',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },
        {
            nom: 'Aubades',
            denomination: 'rue des',
            nomComplet: 'rue des Aubades',
            quartier: 'Herseaux',
            cp: 7712,
            localite: 'Herseaux',
            codeRue: '*3124',
            traductionNl: 'Aubadesstraat',
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: '',
            idTronconCentral: '',
        },


    ];

    try {
        createdRues = await Promise.all(
            ruesDto.map(u => db.collection('rues').insertOne(u))
        );
    } catch (error) {
        console.error('Error inserting rues:', JSON.stringify(error, null, 2));
        process.exit(1);
    }

    bar1.update(i++);

    const admin = {
        email: 'admin@admin.com',
        password: await bcrypt.hash('123456789', 10),
        // userAccess: faker.number.int({ min: 1, max: 10 }),
        userAccess: 0,
        matricule: 101,
        firstname: 'admin',
        lastname: 'admin',
        picture: '',
        // picture: 'http://localhost:3003/images/admin.png',
        formations: faker.datatype.array(2),
        createdAt: new Date(),
        updatedAt: new Date(),
        // lastConnection: new Date(),
        enable: true,
    };
    try {
        await db.collection('agents').insertOne(admin);
    } catch (error) {
        console.error('Error inserting admin:', JSON.stringify(error, null, 2));
        process.exit(1);
    }

    const agentsDto = await Promise.all(
        [...Array(15)].map(async () => {
            return {
                email: faker.internet.email(),
                password: bcrypt.hashSync(faker.internet.password(), 10),
                userAccess: faker.number.int({ min: 1, max: 10 }),
                matricule: faker.number.int({ min: 101, max: 199 }),
                firstname: faker.person.firstName(),
                lastname: faker.person.lastName(),
                birthday: faker.date.past(),
                tel: faker.string.octal({ length: 6, prefix: '+32 47' }), // '+32 473 61 70',
                iceContact:
                    faker.person.firstName() +
                    ' ' +
                    faker.person.lastName() +
                    ' ' +
                    faker.string.octal({ length: 6, prefix: '+32 47' }),
                picture: '',
                // picture: 'http://localhost:3003/images/user.png',
                formations: generateFormations(2),

                createdAt: new Date(),
                updatedAt: new Date(),
                // lastConnection: new Date(),
                enable: true,
            };
        })
    );

    try {
        createdAgents = await Promise.all(
            agentsDto.map(u => db.collection('agents').insertOne(u))
        );
    } catch (error) {
        console.error('Error inserting agents:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);


    // Articles DTO
    const articlesDto = [
        {
            title: 'New Features in Our Product',
            category: 'Announcements',
            date: new Date(),
            content: 'We are excited to announce the new features in our product...',
            attachments: [
                {
                    filename: 'feature_overview.pdf',
                    url: 'https://example.com/feature_overview.pdf'
                },
                {
                    filename: 'screenshot.png',
                    url: 'https://example.com/screenshot.png'
                }
            ],
            author: 'John Doe',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Upcoming Maintenance Schedule',
            category: 'Maintenance',
            date: new Date(),
            content: 'Please be informed about the upcoming maintenance schedule...',
            attachments: null,
            author: 'Admin',
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    // Ajoutez plus d'articles ici si nécessaire
    ];

    for (const articleDto of articlesDto) {
        try {
            const createdArticle = await db.collection('articles').insertOne(articleDto);
            console.log('Article inserted successfully.');
            createdArticles.push(createdArticle);
        } catch (error) {
            console.error('Error inserting article:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            process.exit(1);
        }
        bar1.update(i++);
    }

    const habitationsDto = [...Array(15)].map(() => ({
        adresse: {
            rue: new ObjectId(
                createdRues[Math.floor(Math.random() * 5)].insertedId
            ),
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
    }));


    try {
        createdHabitations = await Promise.all(
            habitationsDto.map(u => db.collection('habitations').insertOne(u))
        );
    } catch (error) {
        console.error('Error inserting habitations:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);
    
    const validationsDto = [...Array(15)].map(() => ({
        agents: [
            createdAgents[Math.floor(Math.random() * 15)].insertedId,
            createdAgents[Math.floor(Math.random() * 15)].insertedId,
        ],
        habitation:
            createdHabitations[Math.floor(Math.random() * 15)].insertedId,

        note: faker.lorem.words(),
        date: faker.date.recent(),
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    try {
        await Promise.all(
            validationsDto.map(u => db.collection('validations').insertOne(u))
        );
    } catch (error) {
        console.error('Error inserting validations:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);

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
        personne: {
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
            birthday: faker.date.past(),
            nationalNumber: faker.finance.iban({ formatted: true, countryCode: 'BE' }),
            tel: faker.string.octal({ length: 6, prefix: '+32 47' }), // '+48 91 463 61 70',
            adresse: {
                rue: faker.location.streetAddress(),
                cp: faker.location.zipCode(),
                localite: faker.location.city(),
            },
        },
        adresse: {
            rue: new ObjectId(
                createdRues[Math.floor(Math.random() * 5)].insertedId
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
    }));
    
    try {
        await Promise.all(
            constatsDto.map(u => db.collection('constats').insertOne(u))
        );
    } catch (error) {
        console.error('Error inserting constats:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);
    

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

    try {
        await Promise.all(
            infractionsDto.map(u => db.collection('infractions').insertOne(u))
        );
    } catch (error) {
        console.error('Error inserting infractions:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);

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
            title: 'Parc communal + Shalom',
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
            title: 'Marché hebdomadaire Mardi',
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
            title: 'Marché hebdomadaire Jeudi',
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
            title: 'Fermeture du Parc communal',
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
            title: 'Parc Bois Labis + Bois du Curé',
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
            title: 'Parc du Chalet',
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
            title: 'Plaines Panorama',
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
            title: "Plaines Haverie + Champ d'Aviation",
            description:
                "Haverie + Champ d'Aviation: Assurer un regard afin de détecter tout agissement suspect",
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
            title: 'Plaines J. Rousseau + Eglise',
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
            title: 'Plaines Max Lessines',
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
            title: 'Plaines Nell',
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


    try {
        createdMissions = await Promise.all(
            missionsDto.map(u => db.collection('missions').insertOne(u))
        );
    } catch (error) {
        console.error('Error inserting missions:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);


    const quartiersDto = [
        {
            title: 'Nouveau-Monde',
            missions: [
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Centre',
            missions: [
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Risquons-Tout',
            missions: [
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Mont-à-Leux',
            missions: [
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Tuquet-Parc',
            missions: [
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Coquinie-CHM',
            missions: [
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Herseaux',
            missions: [
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Dottignies',
            missions: [
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Luingne',
            missions: [
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Gare',
            missions: [
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
                createdMissions[Math.floor(Math.random() * 20)].insertedId,
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];


    
    try {
        // Assigner à l'intérieur du bloc try-catch
        createdMissionsQuartiers = await Promise.all(
            quartiersDto.map(u => db.collection('quartiers').insertOne(u))
        );
    } catch (error) {
        console.error('Error inserting quartiers:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);

    const dailiesDto = [...Array(15)].map(() => ({
        date: faker.date.recent(),
        agents: [
            createdAgents[Math.floor(Math.random() * 15)].insertedId,
            createdAgents[Math.floor(Math.random() * 15)].insertedId,
        ],
        horaire: horairesDto[Math.floor(Math.random() * 4)].horaire,
        vehicule: vehiculesDto[Math.floor(Math.random() * 3)].marque,
        quartiers: [
            createdMissionsQuartiers[Math.floor(Math.random() * 10)].insertedId,
        ],
        missions: [
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
        ],
        notes: faker.lorem.words(),
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    try {
        createdDailyDto = await Promise.all(
            dailiesDto.map(u => db.collection('dailies').insertOne(u))
        );
    } catch (error) {
        console.error('Error inserting dailies:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);

    
    const rapportsDto = [...Array(15)].map(() => ({
        daily: createdDailyDto[Math.floor(Math.random() * 15)].insertedId,
        date: faker.date.recent(),
        horaire: horairesDto[Math.floor(Math.random() * 4)].horaire,

        agents: [
            createdAgents[Math.floor(Math.random() * 15)].insertedId,
            createdAgents[Math.floor(Math.random() * 15)].insertedId,
        ],
        vehicule: vehiculesDto[Math.floor(Math.random() * 4)].marque,
        quartiers: [
            createdMissionsQuartiers[Math.floor(Math.random() * 10)].insertedId,
        ],
        quartierMissionsValidate: [
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
        ],
        missions: [
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
            createdMissions[Math.floor(Math.random() * 20)].insertedId,
        ],
        notes: faker.lorem.words(),
        annexes: faker.lorem.words(),

        // annexes: [
        //     faker.lorem.words(),
        //     faker.lorem.words(),
        //     faker.lorem.words(),
        //     faker.lorem.words(),
        // ],
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    try {
        const createdRapportsDto = await Promise.all(
            rapportsDto.map(u => db.collection('rapports').insertOne(u))
        );
    } catch (error) {
        console.error('Error inserting rapports:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
    bar1.update(i++);

    bar1.stop();
    console.clear();
    collections.forEach(collection => {
        console.log('Collection ' + collection + ' créée');
    });
    console.log('\x1b[41m', '\x1b[1m', 'Seed Implémenté', '\x1b[0m');

    process.exit(0);
})();

// Fonction pour générer un tableau de formations aléatoires
function generateFormations(count) {
    const formations = [];
    for (let i = 0; i < count; i++) {
        formations.push(faker.lorem.words());
    }
    return formations;
}
