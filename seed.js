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
    const collections = ['agents', 'constats', 'habitations', 'validations'];
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
    process.exit(0);
})();
