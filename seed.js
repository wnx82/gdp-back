//NOSONAR
// seed.js (à la racine du projet)
require('dotenv').config({ path: '.env.config' });
const { faker } = require('@faker-js/faker');
const dbClient = require('./utils/db-client.util');
const bcrypt = require('bcrypt');
const validators = require('./validators');
const { string, array } = require('joi');

const seed = (async () => {
    const db = dbClient.db(process.env.MONGO_DB_DATABASE);

    const collections = ['agents', 'habitations', 'validations'];
    const existingCollectionsCursor = db.listCollections();
    const existingcollections = await existingCollectionsCursor.toArray();
    const names = existingcollections.map(c => c.name);
    console.log(names);

    //on efface les données et on les recrée
    collections.forEach(async c => {
        try {
            if (names.includes(c)) {
                await db.dropCollection(c);
            } else await db.createCollection(c, validators[c] ?? null);
        } catch (e) {
            console.error(c);
        }
    });

    //DTO = DATA TRANSFER OBJECT

    const agentsDto = await Promise.all(
        [...Array(10)].map(async () => {
            return {
                firstname: faker.name.firstName(),
                lastname: faker.name.lastName(),
                birthday: faker.date.past(),
                tel: faker.phone.number('+32 47#######'), // '+48 91 463 61 70',
                email: faker.internet.email(),
                matricule: 'A1' + faker.random.numeric(2),
                adresse: {
                    rue: faker.address.streetAddress(),
                    cp: faker.address.zipCode(),
                    localite: faker.address.city(),
                },
                password: bcrypt.hashSync(faker.internet.password(), 10),
                picture:
                    'https://cdn-icons-png.flaticon.com/512/1946/1946392.png',
                formation: faker.datatype.array(2),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        })
    );

    console.log(agentsDto);

    const createdAgents = await Promise.all(
        agentsDto.map(u => db.collection('agents').insertOne(u))
    );
    const habitationsDto = [...Array(5)].map(() => ({
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
    const validationsDto = [...Array(5)].map(() => ({
        agent: createdAgents[Math.floor(Math.random() * 4)].insertedId,
        habitation:
            createdHabitations[Math.floor(Math.random() * 4)].insertedId,
        message: faker.lorem.words(),
        date: faker.date.past(),
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    console.log(validationsDto);
    await Promise.all(
        validationsDto.map(u => db.collection('validations').insertOne(u))
    );
})();
