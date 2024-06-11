// ./controllers/constats.controller.js

const { dbClient, redisClient } = require('../../utils');
const { catchAsync, success } = require('../../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('constats');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'constats';

const schema = Joi.object({
    id: Joi.string().allow(null).optional().empty(''),
    agents: Joi.array()
        .items(
            Joi.string().regex(/^[0-9a-fA-F]{24}$/),
            Joi.object({
                value: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
            }),
            Joi.number().integer().min(0)
        )
        .min(1)
        .required(),
    date: Joi.date().required(),
    vehicule: Joi.object()
        .allow(null)
        .keys({
            marque: Joi.string().allow(null).optional().empty(''),
            modele: Joi.string().allow(null).optional().empty(''),
            couleur: Joi.string().allow(null).optional().empty(''),
            type: Joi.string().allow(null).optional().empty(''),
            immatriculation: Joi.string().allow(null).optional().empty(''),
        }),
    personne: Joi.object()
        .allow(null)
        .keys({
            firstname: Joi.string().allow(null).optional().empty(''),
            lastname: Joi.string().allow(null).optional().empty(''),
            birthday: Joi.date().allow(null).optional().empty(''),
            nationalNumber: Joi.string().allow(null).optional().empty(''),
            tel: Joi.string().allow(null).optional().empty(''),
            adresse: Joi.object()
                .allow(null)
                .keys({
                    rue: Joi.string().allow(null).optional().empty(''),
                    cp: Joi.string().allow(null).optional().empty(''),
                    localite: Joi.string().allow(null).optional().empty(''),
                }),
        }),
    adresse: {
        rue: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .allow(null)
            .optional()
            .empty(''),
        numero: Joi.string().allow(null).optional().empty(''),
    },
    geolocation: Joi.object()
        .allow(null)
        .keys({
            latitude: Joi.string().allow(null).optional().empty(''),
            longitude: Joi.string().allow(null).optional().empty(''),
            horodatage: Joi.date().allow(null).optional().empty(''),
        }),
    infractions: Joi.alternatives()
        .try(
            Joi.array().items(Joi.string().allow(null).optional().empty('')),
            Joi.string().allow(null).optional().empty('')
        )
        .optional()
        .allow(null),

    pv: Joi.boolean().allow(null),
    notes: Joi.string().allow(null).optional().empty(''),
    annexes: Joi.alternatives()
        .try(
            Joi.array().items(Joi.string().allow(null).optional().empty('')),
            Joi.string().allow(null).optional().empty('')
        )
        .optional()
        .allow(null),
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
                $first: {
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
            deletedAt: {
                $first: '$deletedAt',
            },
        },
    },
];

const findAll = catchAsync(async (req, res) => {
    const { immatriculation, rue, localite } = req.query;

    const immatriculationPromise = immatriculation
        ? (async () => {
              const inCache = await redisClient.get(`constats:immat:${immatriculation}`);
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
              const data = await collection.aggregate(immatriculationPipeline).toArray();
              await redisClient
                  .multi()
                  .set(`constats:immat:${immatriculation}`, JSON.stringify(data), 'EX', 600)
                  .exec();
              res.status(200).json(data);
          })()
        : null;

    const ruePromise = rue
        ? (async () => {
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
              const data = await collection.aggregate(localitePipeline).toArray();
              await redisClient
                  .multi()
                  .set(`constats:loc:${localite}`, JSON.stringify(data), 'EX', 600)
                  .exec();
              res.status(200).json(data);
          })()
        : null;

    await Promise.all([immatriculationPromise, ruePromise, localitePromise]);

    if (!immatriculation && !rue && !localite) {
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
        const { id } = req.params;
        let data = await collection.findOne({ _id: new ObjectId(id) });
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
            data = await collection.findOne({ _id: new ObjectId(id) });
            redisClient.set(`${collectionName}:${id}`, JSON.stringify(data), 'EX', 600);
            res.status(200).json(data);
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const create = catchAsync(async (req, res) => {
    const { body } = req;
    if (!body.adresse) {
        return res.status(400).json({ message: 'adresse field is required' });
    }

    const { value, error } = schema.validate(body);
    if (error) {
        const errors = error.details.map(d => d.message);
        console.log('Validation error:', errors);
        return res.status(400).json({ message: 'Validation error', errors });
    }

    try {
        const agentsID = value.agents.map(p => new ObjectId(p));
        value.agents = agentsID;
        value.adresse.rue = new ObjectId(value.adresse.rue);
        const { ...rest } = value;
        const createdAt = new Date();
        const updatedAt = new Date();
        const data = await collection.insertOne({
            ...rest,
            createdAt,
            updatedAt,
        });
        console.log(`----------->Le constat a bien été créé<-----------`);
        res.status(201).json(data);
        redisClient.del(`${collectionName}:all`);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    console.log('id:', id);

    if (!id) {
        console.log('No id provided');
        return res.status(400).json({ message: 'No id provided' });
    }
    try {
        const constat = await collection.findOne({ _id: new ObjectId(id) });

        if (!constat) {
            console.log('Constat not found');
            return res.status(404).json({ message: 'Constat not found' });
        }
    } catch (err) {
        console.log('Server error:', err);
        return res.status(500).json({ message: 'Server error' });
    }

    const { body } = req;
    const { value, error } = schema.validate(body);

    if (error) {
        const errors = error.details.map(d => d.message);
        console.log('Validation error:', errors);
        return res.status(400).json({ message: 'Validation error', errors });
    }
    const updateValue = { ...value };

    if (!value.agents) {
        delete updateValue.agents;
    } else {
        updateValue.agents = value.agents.map(value => new ObjectId(value));
    }

    try {
        value.adresse.rue = new ObjectId(value.adresse.rue);
        const updatedAt = new Date();
        console.log('updateValue:', updateValue);
        console.log('updatedAt:', updatedAt);

        const { modifiedCount } = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateValue, updatedAt } },
            { returnDocument: 'after' }
        );
        console.log('modifiedCount:', modifiedCount);

        if (modifiedCount === 0) {
            console.log('Constat not found');
            return res.status(404).json({ message: 'Constat not found' });
        }
        res.status(200).json(value);
        redisClient.del(`${collectionName}:all`);
        redisClient.del(`${collectionName}:${id}`);
    } catch (err) {
        console.log('Server error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;
    if (force === undefined || parseInt(force, 10) === 0) {
        const constat = await collection.findOne({ _id: new ObjectId(id) });
        if (constat?.deletedAt) {
            return res.status(200).json(constat);
        }
        const data = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { deletedAt: new Date() } }
        );
        res.status(200).json(data);
        redisClient.del(`${collectionName}:all`);
        redisClient.del(`${collectionName}:${id}`);
    } else if (parseInt(force, 10) === 1) {
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            console.log('Successfully deleted');
            res.status(200).json(success(`🗑️ Suppression d'un constat de manière physique`));
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
    const result = await collection.deleteMany({
        deletedAt: { $exists: true },
    });
    const deletedCount = result.deletedCount;
    if (!deletedCount) {
        return res.status(404).json({ message: 'Aucune donnée trouvée à supprimer.' });
    }
    redisClient.del(`${collectionName}:all`);
    res.status(200).json({
        message: `${deletedCount} donnée(s) supprimée(s).`,
    });
});

const restoreMany = catchAsync(async (req, res) => {
    const result = await collection.updateMany(
        { deletedAt: { $exists: true } },
        { $unset: { deletedAt: '' } }
    );
    const restoredCount = result.modifiedCount;
    if (restoredCount === 0) {
        return res.status(404).json({ message: 'Aucune donnée trouvée à restaurer.' });
    }
    redisClient.del(`${collectionName}:all`);
    res.status(200).json({ message: `${restoredCount} données restaurées.` });
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
    const agent = await agentCollection.findOne({ _id: agentId });
    if (!agent) {
        res.status(404).json({ message: 'Agent not found' });
        return;
    }

    const data = await collection.findOneAndUpdate(
        {
            _id: new ObjectId(id),
            agents: { $ne: agentId },
        },
        {
            $push: { agents: agentId },
        },
        {
            returnDocument: 'after',
        }
    );

    if (data?.value) {
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
                _id: new ObjectId(id),
                agents: { $in: [new ObjectId(agentId)] },
            },
            {
                $pull: {
                    agents: new ObjectId(agentId),
                },
            },
            {
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
    restoreMany,
    findAgents,
    addAgent,
    removeAgent,
};
