require('dotenv').config();
const { dbClient, redisClient } = require('./utils/');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');
const validators = require('./validators');
const ObjectId = require('mongodb').ObjectId;
const cliProgress = require('cli-progress');
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

(async () => {
    try {
        // Flush Redis
        await new Promise((resolve, reject) => {
            redisClient.flushall((err, reply) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(reply);
                    resolve();
                }
            });
        });

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
            bar1.update(i++);
        }

        const horairesDto = [
            { horaire: '07:30-15:00', createdAt: new Date(), updatedAt: new Date() },
            { horaire: '08:30-16:00', createdAt: new Date(), updatedAt: new Date() },
            { horaire: '10:30-18:00', createdAt: new Date(), updatedAt: new Date() },
            { horaire: '16:00-22:00', createdAt: new Date(), updatedAt: new Date() },
            { horaire: '09:00-16:30', createdAt: new Date(), updatedAt: new Date() },
        ];
        await Promise.all(horairesDto.map(u => db.collection('horaires').insertOne(u)));
        bar1.update(i++);

        const vehiculesDto = [
            { marque: 'Aucun', modele: '', immatriculation: '', createdAt: new Date(), updatedAt: new Date() },
            { marque: 'Skoda', modele: 'Octavia', immatriculation: '1XRJ929', createdAt: new Date(), updatedAt: new Date() },
            { marque: 'Dacia', modele: 'Duster', immatriculation: '1GFV206', createdAt: new Date(), updatedAt: new Date() },
            { marque: 'Peugeot', modele: '307', immatriculation: '1AMS560', createdAt: new Date(), updatedAt: new Date() },
        ];
        await Promise.all(vehiculesDto.map(u => db.collection('vehicules').insertOne(u)));
        bar1.update(i++);

        const categoriesDto = [
            { title: 'Altercation/Agression', createdAt: new Date(), updatedAt: new Date() },
            { title: 'Informations', createdAt: new Date(), updatedAt: new Date() },
            { title: 'Requêtes', createdAt: new Date(), updatedAt: new Date() },
            { title: 'Secours', createdAt: new Date(), updatedAt: new Date() },
        ];
        await Promise.all(categoriesDto.map(u => db.collection('categories').insertOne(u)));
        bar1.update(i++);

        // Ajoutez ici la génération de `ruesDto`
        const ruesDto = Array.from({ length: 700 }, () => ({
            name: faker.address.streetName(),
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
        const createdRues = await Promise.all(ruesDto.map(u => db.collection('rues').insertOne(u)));
        bar1.update(i++);

        const admin = {
            email: 'admin@admin.com',
            password: await bcrypt.hash('123456789', 10),
            userAccess: 0,
            matricule: 101,
            firstname: 'admin',
            lastname: 'admin',
            adresse: {
                rue: new ObjectId(createdRues[Math.floor(Math.random() * 690)].insertedId),
                numero: faker.random.numeric(2),
            },
            picture: '',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const agentsDto = await Promise.all(
            [...Array(15)].map(async () => ({
                email: faker.internet.email(),
                password: bcrypt.hashSync(faker.internet.password(), 10),
                userAccess: faker.datatype.number({ min: 1, max: 10 }),
                matricule: faker.datatype.number({ min: 101, max: 199 }),
                firstname: faker.name.firstName(),
                lastname: faker.name.lastName(),
                birthday: faker.date.past(),
                tel: faker.phone.number('+32 47#######'),
                iceContact: `${faker.name.firstName()} ${faker.name.lastName()} ${faker.phone.number('+32 47#######')}`,
                adresse: {
                    rue: new ObjectId(createdRues[Math.floor(Math.random() * 690)].insertedId),
                    numero: faker.random.numeric(2),
                },
                picture: '',
                formations: faker.datatype.array(2),
                createdAt: new Date(),
                updatedAt: new Date(),
            }))
        );

        await db.collection('agents').insertOne(admin);
        const createdAgents = await Promise.all(agentsDto.map(u => db.collection('agents').insertOne(u)));
        bar1.update(i++);

        const habitationsDto = [...Array(15)].map(() => ({
            adresse: {
                rue: new ObjectId(createdRues[Math.floor(Math.random() * 690)].insertedId),
                numero: faker.random.numeric(2),
            },
            demandeur: {
                nom: `${faker.name.lastName()} ${faker.name.firstName()}`,
                tel: faker.phone.number('+32 47# ### ###
