// ./controllers/constats.controller.js

// const dbClient = require('../utils/').dbClient;
const { dbClient, redisClient } = require('../utils');
const { catchAsync, success } = require('../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('constats');
const moment = require('moment');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'constats';

const schema = Joi.object({
    id: Joi.string().allow(null).optional().empty(''),
    agents: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .required(),
    date: Joi.date().required(),
    vehicule: Joi.object().allow(null).keys({
        marque: Joi.string(),
        modele: Joi.string(),
        couleur: Joi.string(),
        type: Joi.string(),
        immatriculation: Joi.string(),
    }),
    personne: Joi.object()
        .allow(null)
        .keys({
            firstname: Joi.string(),
            lastname: Joi.string(),
            birthday: Joi.date(),
            birthday: Joi.date(),
            nationalNumber: Joi.number(),
            tel: Joi.string(),
            adresse: Joi.object().allow(null).keys({
                rue: Joi.string(),
                cp: Joi.string(),
                localite: Joi.string(),
            }),
        }),
    adresse: {
        rue: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
        numero: Joi.string().allow(null).optional().empty(''),
    },
    geolocation: Joi.object().allow(null).keys({
        latitude: Joi.string(),
        longitude: Joi.string(),
        horodatage: Joi.date(),
    }),
    infractions: Joi.array()
        .items(Joi.string().allow(null).optional().empty(''))
        .optional(),
    pv: Joi.boolean().required(),
    notes: Joi.string().allow(null).optional().empty(''),
    annexes: Joi.array()
        .items(Joi.string().allow(null).optional().empty(''))
        .optional(),
});

const pipeline = [
    {
        $lookup: {
            from: 'rues',
            localField: 'adresse.rue',
            foreignField: '_id',
            as: 'adresseData',
        },
    },
    {
        $lookup: {
            from: 'agents',
            localField: 'agents',
            foreignField: '_id',
            as: 'agentsData',
        },
    },
    {
        $group: {
            _id: '$_id',
            agents: {
                $first: '$agentsData.matricule',
            },
            date: {
                $first: '$date',
            },
            vehicule: {
                $first: '$vehicule',
            },
            personne: {
                $first: '$personne',
            },
            adresse: {
                $push: {
                    numero: '$adresse.numero',
                    nom: {
                        $first: '$adresseData.nom',
                    },
                    denomination: {
                        $first: '$adresseData.denomination',
                    },
                    nomComplet: {
                        $first: '$adresseData.nomComplet',
                    },
                    quartier: {
                        $first: '$adresseData.quartier',
                    },
                    cp: {
                        $first: '$adresseData.cp',
                    },
                    localite: {
                        $first: '$adresseData.localite',
                    },
                },
            },
            geolocation: {
                $first: '$geolocation',
            },
            infractions: {
                $first: '$infractions',
            },
            pv: {
                $first: '$pv',
            },
            notes: {
                $first: '$notes',
            },
            annexes: {
                $first: '$annexes',
            },
            createdAt: {
                $first: '$createdAt',
            },
            updatedAt: {
                $first: '$updatedAt',
            },
        },
    },
];

const findAll = catchAsync(async (req, res) => {
    const { immatriculation, rue, localite } = req.query;

    const immatriculationPromise = immatriculation
        ? (async () => {
              const message = `📄 Liste des constats avec l'immatriculation ${immatriculation}`;
              const inCache = await redisClient.get(
                  `constats:immat:${immatriculation}`
              );
              if (inCache) {
                  res.status(200).json(JSON.parse(inCache));
                  return;
              }
              const immatriculationPipeline = [...pipeline];
              immatriculationPipeline.unshift({
                  $match: {
                      'vehicule.immatriculation': {
                          $regex: immatriculation,
                          $options: 'i',
                      },
                  },
              });
              const data = await collection
                  .aggregate(immatriculationPipeline)
                  .toArray();
              await redisClient
                  .multi()
                  .set(
                      `constats:immat:${immatriculation}`,
                      JSON.stringify(data),
                      'EX',
                      600
                  )
                  .exec();
              res.status(200).json(data);
          })()
        : null;

    const ruePromise = rue
        ? (async () => {
              const message = `📄 Liste des constats avec la rue ${rue}`;
              const inCache = await redisClient.get(`constats:rue:${rue}`);
              if (inCache) {
                  res.status(200).json(JSON.parse(inCache));
                  return;
              }
              const ruePipeline = [
                  ...pipeline,
                  {
                      $match: {
                          'adresse.nom': {
                              $regex: rue,
                              $options: 'i',
                          },
                      },
                  },
              ];
              const data = await collection.aggregate(ruePipeline).toArray();

              await redisClient
                  .multi()
                  .set(`constats:rue:${rue}`, JSON.stringify(data), 'EX', 600)
                  .exec();
              res.status(200).json(data);
          })()
        : null;

    const localitePromise = localite
        ? (async () => {
              const message = `📄 Liste des constats avec la localité ${localite}`;
              const inCache = await redisClient.get(`constats:loc:${localite}`);
              if (inCache) {
                  res.status(200).json(JSON.parse(inCache));
                  return;
              }
              const localitePipeline = [
                  ...pipeline,
                  {
                      $match: {
                          'adresse.localite': {
                              $regex: localite,
                              $options: 'i',
                          },
                      },
                  },
              ];
              const data = await collection
                  .aggregate(localitePipeline)
                  .toArray();
              await redisClient
                  .multi()
                  .set(
                      `constats:loc:${localite}`,
                      JSON.stringify(data),
                      'EX',
                      600
                  )
                  .exec();
              res.status(200).json(data);
          })()
        : null;

    const [immatriculationResult, rueResult, localiteResult] =
        await Promise.all([
            immatriculationPromise,
            ruePromise,
            localitePromise,
        ]);

    if (!immatriculation && !rue && !localite) {
        const message = '📄 Liste complète des constats';
        const inCache = await redisClient.get(`${collectionName}:all`);
        if (inCache) {
            res.status(200).json(JSON.parse(inCache));
            return;
        }
        const data = await collection.aggregate(pipeline).toArray();
        await redisClient
            .multi()
            .set(`${collectionName}:all`, JSON.stringify(data), 'EX', 600)
            .exec();
        res.status(200).json(data);
    }
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = `📄 Détails du constat`;
        const { id } = req.params;
        let data = null;
        data = await collection.findOne({ _id: new ObjectId(id) });
        if (!data) {
            res.status(404).json({
                message: `⛔ No constat found with id ${id}`,
            });
            return;
        }
        const inCache = await redisClient.get(`${collectionName}:${id}`);

        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            const pipeline = [
                {
                    $match: {
                        _id: new ObjectId(id),
                    },
                },
                {
                    $lookup: {
                        from: 'rues',
                        localField: 'adresse.rue',
                        foreignField: '_id',
                        as: 'adresseData',
                    },
                },
                {
                    $lookup: {
                        from: 'agents',
                        localField: 'agents',
                        foreignField: '_id',
                        as: 'agentsData',
                    },
                },
                {
                    $group: {
                        _id: '$_id',
                        agents: {
                            $first: '$agentsData.matricule',
                        },
                        date: {
                            $first: '$date',
                        },
                        vehicule: {
                            $first: '$vehicule',
                        },
                        personne: {
                            $first: '$personne',
                        },
                        adresse: {
                            $push: {
                                numero: '$adresse.numero',
                                nom: {
                                    $first: '$adresseData.nom',
                                },
                                denomination: {
                                    $first: '$adresseData.denomination',
                                },
                                quartier: {
                                    $first: '$adresseData.quartier',
                                },
                                cp: {
                                    $first: '$adresseData.cp',
                                },
                                localite: {
                                    $first: '$adresseData.localite',
                                },
                            },
                        },
                        geolocation: {
                            $first: '$geolocation',
                        },
                        infractions: {
                            $first: '$infractions',
                        },
                        pv: {
                            $first: '$pv',
                        },
                        notes: {
                            $first: '$notes',
                        },
                        annexes: {
                            $first: '$annexes',
                        },
                        createdAt: {
                            $first: '$createdAt',
                        },
                        updatedAt: {
                            $first: '$updatedAt',
                        },
                    },
                },
            ];
            data = await collection.aggregate(pipeline).toArray();
            redisClient.set(
                `${collectionName}:${id}`,
                JSON.stringify(data),
                'EX',
                600
            );
        }

        if (!data) {
            res.status(404).json({
                message: `No constat found with id ${id}`,
            });
            return;
        } else {
            res.status(200).json(data);
        }
    } catch (e) {
        console.error(e);
    }
});

const create = catchAsync(async (req, res) => {
    const message = `✏️ Création d'un constat`;

    const { body } = req;
    if (!body.adresse) {
        return res.status(400).json({ message: 'adresse field is required' });
    }

    const { value, error } = schema.validate(body);

    if (error) {
        return res.status(400).json({
            message: error.details.map(err => err.message).join(', '),
        });
    }

    try {
        const agentsID = value.agents.map(p => {
            return new ObjectId(p);
        });
        value.agents = agentsID;
        value.adresse.rue = new ObjectId(value.adresse.rue);
        const { ...rest } = value;
        const createdAt = new Date();
        const updatedAt = new Date();
        const data = await collection
            .insertOne({
                ...rest,
                createdAt,
                updatedAt,
            })
            .then(
                console.log(
                    `----------->Le constat a bien été créé<-----------`
                )
            );
        res.status(201).json(data);
        redisClient.del(`${collectionName}:all`);
    } catch (err) {
        console.log(err);
    }
});
const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'No id provided' });
    }
    try {
        const constat = await collection.findOne({ _id: ObjectId(id) });
        if (!constat) {
            return res.status(404).json({ message: 'Constat not found' });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Server error' });
    }

    const message = `📝 Mise à jour du constat ${id}`;
    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        console.log(error);
        const errors = error.details.map(d => d.message);
        return res.status(400).json({ message: 'Validation error', errors });
    }
    let updateValue = { ...value };

    if (!value.agents) {
        delete updateValue.agents;
    } else {
        updateValue.agents = value.agents.map(value => new ObjectId(value));
    }

    try {
        value.adresse.rue = new ObjectId(value.adresse.rue);
        const updatedAt = new Date();
        const { modifiedCount } = await collection.findOneAndUpdate(
            { _id: ObjectId(id) },
            { $set: { ...updateValue, updatedAt } },
            { returnDocument: 'after' }
        );
        if (modifiedCount === 0) {
            return res.status(404).json({ message: 'Constat not found' });
        }
        res.status(200).json(value);
        redisClient.del(`${collectionName}:all`);
        redisClient.del(`${collectionName}:${id}`);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});
const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;
    if (force === undefined || parseInt(force, 10) === 0) {
        //Vérification si le constat a déjà été supprimé de manière logique
        const constat = await collection.findOne({ _id: new ObjectId(id) });
        if (!isNaN(constat.deletedAt)) {
            // Constat already deleted, return appropriate response
            const message = `Le constat a déjà été supprimé de manière logique.`;
            return res.status(200).json(constat);
        }
        //suppression logique
        const message = `🗑️ Suppression d'un constat de manière logique`;
        const data = await collection.updateOne(
            {
                _id: new ObjectId(id),
            },
            {
                $set: { deletedAt: new Date() },
            }
        );
        res.status(200).json(data);
        redisClient.del(`${collectionName}:all`);
        redisClient.del(`${collectionName}:${id}`);
    } else if (parseInt(force, 10) === 1) {
        //suppression physique
        const message = `🗑️ Suppression d'un constat de manière physique`;
        console.log('suppression physique/valeur force:' + force);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            console.log('Successfully deleted');
            res.status(200).json(success(message));
            redisClient.del(`${collectionName}:all`);
            redisClient.del(`${collectionName}:${id}`);
        } else {
            res.status(404).json({ message: 'Failed to delete' });
        }
    } else {
        res.status(400).json({ message: 'Malformed parameter "force"' });
    }
});

const deleteMany = catchAsync(async (req, res) => {
    const result = await collection(collectionName).deleteMany({
        deletedAt: { $exists: true },
    });
    const deletedCount = result.deletedCount;
    if (!deletedCount) {
        return res
            .status(404)
            .json({ message: 'Aucune donnée trouvée à supprimer.' });
    }
    redisClient.del(`${collectionName}:all`);
    res.status(200).json({
        message: `${deletedCount} donnée(s) supprimée(s).`,
    });
});

const findAgents = async (req, res) => {
    const { id } = req.params;
    const data = await collection
        .aggregate([
            {
                $match: {
                    _id: new ObjectId(id),
                },
            },
            {
                $project: {
                    agents: 1,
                },
            },
            {
                $lookup: {
                    from: 'agents',
                    localField: 'agents',
                    foreignField: '_id',
                    as: 'result',
                },
            },
            {
                $project: {
                    agents: '$result',
                },
            },
        ])
        .toArray();
    if (data.length === 0) {
        res.status(404).json({
            message: 'No constat found with these parameters',
        });
    } else {
        res.status(200).json(data);
    }
};
const addAgent = async (req, res) => {
    const { id } = req.params;
    const { body } = req;

    if (!id) {
        res.status(400).json({ message: 'No id provided' });
        return;
    }

    const agentId = new ObjectId(body.agentId);
    console.log(agentId);
    // Check if agent exists
    const agent = await agentCollection.findOne({ _id: agentId });
    if (!agent) {
        res.status(404).json({ message: 'Agent not found' });
        return;
    }

    const data = await collection.findOneAndUpdate(
        {
            _id: new ObjectId(id),
            agents: { $ne: agentId }, // check if agentId is not already in the agents array
        },
        {
            $push: { agents: agentId },
        },
        {
            returnDocument: 'after',
        }
    );

    if (data && data.value) {
        res.status(201).json({ message: 'Agent added' });
    } else {
        res.status(500).json({ message: 'Failed to add agent' });
    }
};

const removeAgent = async (req, res) => {
    const { id, agentId } = req.params;
    try {
        const data = await collection.findOneAndUpdate(
            {
                //filtre
                _id: new ObjectId(id),
                agents: { $in: [new ObjectId(agentId)] }, // Vérifie si l'agent existe dans la liste
            },
            {
                //mise à jour
                $pull: {
                    agents: new ObjectId(agentId),
                },
            },
            {
                //options mongos
                returnDocument: 'after',
            }
        );
        if (data) {
            res.status(201).json({ message: '🗑️ Agent removed' });
        } else {
            res.status(404).json({ message: '🚫 Agent not found' });
        }
    } catch (err) {
        res.status(500).json({ message: '🔥 Server Error' });
    }
};

module.exports = {
    findAll,
    findOne,
    create,
    updateOne,
    deleteOne,
    deleteMany,
    findAgents,
    addAgent,
    removeAgent,
};
