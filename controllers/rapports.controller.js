// ./controllers/rapports.controller.js

const { dbClient, redisClient } = require('../utils');
const { catchAsync, success } = require('../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('rapports');
const moment = require('moment');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'rapports';
const sendRapport = require('../helpers/sendRapport');

const schema = Joi.object({
    // daily: Joi.string().allow(null).optional().empty(''),
    id: Joi.string().allow(null).optional().empty(''),
    daily: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    date: Joi.date().required(),
    agents: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .required(),
    horaire: Joi.string().allow(null).optional().empty(''),
    vehicule: Joi.string().allow(null).optional().empty(''),
    quartiers: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    quartierMissionsValidate: Joi.array().items(
        Joi.string().regex(/^[0-9a-fA-F]{24}$/)
    ),
    missions: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    notes: Joi.array().items(Joi.string().allow(null).optional().empty('')),

    annexes: Joi.array()
        .items(Joi.string().allow(null).optional().empty(''))
        .optional(),
});

const findAll = catchAsync(async (req, res) => {
    const message = '📄 Liste des rapports';
    const inCache = await redisClient.get(`${collectionName}:all`);
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const data = await collection.find({}).toArray();
        redisClient.set(
            `${collectionName}:all`,
            JSON.stringify(data),
            'EX',
            600
        );
        res.status(200).json(data);
    }
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = `📄 Détails du rapport`;
        const { id } = req.params;
        let data = null;
        data = await collection.findOne({ _id: new ObjectId(id) });
        if (!data) {
            res.status(404).json({
                message: `⛔ No rapport found with id ${id}`,
            });
            return;
        }
        const inCache = await redisClient.get(`${collectionName}:${id}`);

        if (inCache) {
            return res.status(200).json(JSON.parse(inCache));
        } else {
            data = await collection.findOne({ _id: new ObjectId(id) });
            redisClient.set(
                `${collectionName}:${id}`,
                JSON.stringify(data),
                'EX',
                600
            );
        }

        if (!data) {
            res.status(404).json({
                message: `⛔ No rapport found with id ${id}`,
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
    const message = `✏️ Création d'un rapport`;

    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({
            message: error.details.map(err => err.message).join(', '),
        });
    }

    try {
        //mettre daily en object
        value.daily = new ObjectId(value.daily);
        //mettre agentsID en object
        const agentsID = value.agents.map(p => {
            return new ObjectId(p);
        });
        value.agents = agentsID;
        //mettre quartiersID en object
        const quartiersID = value.quartiers.map(p => {
            return new ObjectId(p);
        });
        value.quartiers = quartiersID;

        //mettre missionsID en object
        const missionsID = value.missions.map(p => {
            return new ObjectId(p);
        });
        value.missions = missionsID;

        //mettre quartierMissionsValidateID en object
        const quartierMissionsValidateID = value.quartierMissionsValidate.map(
            p => {
                return new ObjectId(p);
            }
        );
        value.quartierMissionsValidate = quartierMissionsValidateID;

        const agents = await database
            .collection('agents')
            .find({
                _id: { $in: agentsID },
            })
            .toArray();
        const quartiers = await database
            .collection('quartiers')
            .find({
                _id: { $in: quartiersID },
            })
            .toArray();
        const missions = await database
            .collection('missions')
            .find({
                _id: { $in: missionsID },
            })
            .toArray();
        const quartierMissionsValidate = await database
            .collection('missions')
            .find({
                _id: { $in: quartierMissionsValidateID },
            })
            .toArray();
        if (agents.length !== agentsID.length) {
            return res
                .status(400)
                .json({ message: 'Invalid agent ID provided' });
        }
        if (quartiers.length !== quartiersID.length) {
            return res
                .status(400)
                .json({ message: 'Invalid quartier ID provided' });
        }
        if (missions.length !== missionsID.length) {
            return res
                .status(400)
                .json({ message: 'Invalid mission ID provided' });
        }
        if (
            quartierMissionsValidate.length !==
            quartierMissionsValidateID.length
        ) {
            return res
                .status(400)
                .json({ message: 'Invalid mission quartier ID provided' });
        }
        const { ...rest } = value;
        const createdAt = new Date();
        const updatedAt = new Date();
        const donnees = await collection
            .insertOne({
                ...rest,
                createdAt,
                updatedAt,
            })
            .then(
                console.log(
                    `----------->Le rapport a bien été créé<-----------`
                )
            );
        res.status(201).json(donnees);
        redisClient.del(`${collectionName}:all`);
        // Récupérer l'insertedId
        const insertedId = donnees.insertedId;

        // Récupération des données par aggregate et envoi de la validation par mail
        const { data } = await collection
            .aggregate([
                {
                    $match: {
                        _id: new ObjectId(insertedId),
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
                    $lookup: {
                        from: 'missions',
                        localField: 'missions',
                        foreignField: '_id',
                        as: 'missionsData',
                    },
                },
                {
                    $lookup: {
                        from: 'missions',
                        localField: 'quartierMissionsValidate',
                        foreignField: '_id',
                        as: 'quartierMissionsValidateData',
                    },
                },
                {
                    $lookup: {
                        from: 'quartiers',
                        localField: 'quartiers',
                        foreignField: '_id',
                        as: 'quartiersData',
                    },
                },
                {
                    $project: {
                        daily: 1,
                        date: 1,
                        horaire: 1,
                        vehicule: 1,
                        habitation: 1,
                        notes: 1,
                        annexes: 1,
                        'agentsData.matricule': 1,
                        'agentsData.lastname': 1,
                        'agentsData.firstname': 1,
                        'quartiersData.title': 1,
                        'missionsData.title': 1,
                        'quartierMissionsValidateData.title': 1,
                    },
                },
                {
                    $group: {
                        _id: '$_id',
                        data: {
                            $push: {
                                daily: '$daily',
                                date: '$date',
                                horaire: '$horaire',
                                vehicule: '$vehicule',
                                notes: '$notes',
                                annexes: '$annexes',
                                matricules: '$agentsData.matricule',
                                lastnames: '$agentsData.lastname',
                                firstnames: '$agentsData.firstname',
                                quartiers: '$quartiersData.title',
                                missionsQuartierValidate:
                                    '$quartierMissionsValidateData.title',
                                missions: '$missionsData.title',
                            },
                        },
                    },
                },
            ])
            .next();
        // console.log(data);
        sendRapport(insertedId, data[0]);
        // console.log(data[0].matricules);
    } catch (err) {
        console.log(err);
    }
});
const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'No id provided' });
    }
    const message = `📝 Mise à jour du rapport ${id}`;
    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        console.log(error);
        const errors = error.details.map(d => d.message);
        return res.status(400).json({ message: 'Validation error', errors });
    }
    let updateValue = { ...value };
    updateValue.daily = new ObjectId(updateValue.daily);
    if (!value.daily) {
        delete updateValue.daily;
    } else {
        updateValue.daily = value.daily.map(value => new ObjectId(value));
    }

    if (!value.agents) {
        delete updateValue.agents;
    } else {
        updateValue.agents = value.agents.map(value => new ObjectId(value));
    }
    if (!value.quartiers) {
        delete updateValue.quartiers;
    } else {
        updateValue.quartiers = value.quartiers.map(
            value => new ObjectId(value)
        );
    }
    if (!value.missions) {
        delete updateValue.missions;
    } else {
        updateValue.missions = value.missions.map(value => new ObjectId(value));
    }

    if (!value.quartierMissionsValidate) {
        delete updateValue.quartierMissionsValidate;
    } else {
        updateValue.quartierMissionsValidate =
            value.quartierMissionsValidate.map(value => new ObjectId(value));
    }

    try {
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
        //Vérification si le rapport a déjà été supprimé de manière logique
        const rapport = await collection.findOne({ _id: new ObjectId(id) });
        if (!isNaN(rapport.deletedAt)) {
            // Constat already deleted, return appropriate response
            const message = `Le rapport a déjà été supprimé de manière logique.`;
            return res.status(200).json(rapport);
        }
        //suppression logique
        const message = `🗑️ Suppression d'un rapport de manière logique`;
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
        const message = `🗑️ Suppression d'un rapport de manière physique`;
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
    const rapport = await collection.findOne({ _id: new ObjectId(id) });

    if (!rapport) {
        res.status(404).json({
            message: '🚫 No rapport found with these parameters',
        });
        return;
    }

    const agents = await collection
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
                    as: 'populatedAgents',
                },
            },
            {
                $project: {
                    agents: '$populatedAgents',
                },
            },
        ])
        .toArray();

    res.status(200).json(agents[0]);
};

const addAgent = async (req, res) => {
    const { id } = req.params;
    const { body } = req;

    if (!id) {
        res.status(400).json({ message: '🚫 No id provided' });
        return;
    }

    const rapport = await collection.findOne({ _id: new ObjectId(id) });

    if (!rapport) {
        res.status(404).json({
            message: '🚫 No rapport found with these parameters',
        });
        return;
    }

    const agentId = new ObjectId(body.agentId);

    const agentExistsInDaily = await collection.findOne({
        _id: new ObjectId(id),
        agents: { $in: [agentId] },
    });

    if (agentExistsInDaily) {
        res.status(400).json({
            message: '⚠️ The rapport already includes this agent',
        });
        return;
    }

    const agentExists = await database
        .collection('agents')
        .findOne({ _id: agentId });

    if (!agentExists) {
        res.status(404).json({
            message: '⚠️ Agent not found',
        });
        return;
    }

    const data = await collection.findOneAndUpdate(
        {
            _id: new ObjectId(id),
        },
        {
            $push: { agents: agentId },
        },
        {
            returnDocument: 'after',
        }
    );

    if (data && data.value) {
        res.status(201).json({ message: '👍 Agent added' });
        redisClient.del(`rapport:${id}`);
    } else {
        res.status(500).json({ message: '🚫 Failed to add agent' });
    }
};

const removeAgent = async (req, res) => {
    const { id, agentId } = req.params;
    try {
        const agentExists = await collection.findOne({
            _id: new ObjectId(id),
            agents: new ObjectId(agentId),
        });
        if (!agentExists) {
            res.status(404).json({ message: '⛔ No agent found with this id' });
            return;
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $pull: {
                    agents: new ObjectId(agentId),
                },
            }
        );

        if (result.matchedCount === 1) {
            res.status(200).json({ message: '🗑️ Agent removed' });
            redisClient.del(`rapport:${id}`);
        } else {
            res.status(500).json({ message: '😖 Failed to remove agent' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '⚠️ Internal Server Error' });
    }
};

const findMissions = async (req, res) => {
    const { id } = req.params;
    const rapport = await collection.findOne({ _id: new ObjectId(id) });

    if (!rapport) {
        res.status(404).json({
            message: '⚠️ No rapport found with these parameters',
        });
        return;
    }

    res.status(200).json(rapport.missions);
};

const addMission = async (req, res) => {
    const { id } = req.params;
    const { body } = req;

    if (!id) {
        res.status(400).json({ message: '🚫 No id provided' });
        return;
    }

    const rapport = await collection.findOne({ _id: new ObjectId(id) });

    if (!rapport) {
        res.status(404).json({
            message: '🚫 No rapport found with these parameters',
        });
        return;
    }

    const missionId = new ObjectId(body.missionId);

    const missionExistsInDaily = await collection.findOne({
        _id: new ObjectId(id),
        missions: { $in: [missionId] },
    });

    if (missionExistsInDaily) {
        res.status(400).json({
            message: '⚠️ The rapport already includes this mission',
        });
        return;
    }

    const missionExists = await database
        .collection('missions')
        .findOne({ _id: missionId });

    if (!missionExists) {
        res.status(404).json({
            message: '⚠️ Mission not found',
        });
        return;
    }

    const data = await collection.findOneAndUpdate(
        {
            _id: new ObjectId(id),
        },
        {
            $push: { missions: missionId },
        },
        {
            returnDocument: 'after',
        }
    );

    if (data && data.value) {
        res.status(201).json({ message: '👍 Mission added' });
        redisClient.del(`rapport:${id}`);
    } else {
        res.status(500).json({ message: '🚫 Failed to add mission' });
    }
};

const removeMission = async (req, res) => {
    const { id, missionId } = req.params;
    try {
        const missionExists = await collection.findOne({
            _id: new ObjectId(id),
            missions: new ObjectId(missionId),
        });
        if (!missionExists) {
            res.status(404).json({
                message: '⛔ No mission found with this id',
            });
            return;
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $pull: {
                    missions: new ObjectId(missionId),
                },
            }
        );

        if (result.matchedCount === 1) {
            res.status(200).json({ message: '🗑️ Mission removed' });
            redisClient.del(`rapport:${id}`);
        } else {
            res.status(500).json({ message: '😖 Failed to remove mission' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '⚠️ Internal Server Error' });
    }
};
const findQuartiers = async (req, res) => {
    const { id } = req.params;
    const rapport = await collection.findOne({ _id: new ObjectId(id) });

    if (!rapport) {
        res.status(404).json({
            message: '⚠️ No rapport found with these parameters',
        });
        return;
    }

    res.status(200).json(rapport.quartiers);
};

const addQuartier = async (req, res) => {
    const { id } = req.params;
    const { body } = req;

    if (!id) {
        res.status(400).json({ message: '🚫 No id provided' });
        return;
    }

    const rapport = await collection.findOne({ _id: new ObjectId(id) });

    if (!rapport) {
        res.status(404).json({
            message: '🚫 No rapport found with these parameters',
        });
        return;
    }

    const quartierId = new ObjectId(body.quartierId);

    const quartierExistsInDaily = await collection.findOne({
        _id: new ObjectId(id),
        quartiers: { $in: [quartierId] },
    });

    if (quartierExistsInDaily) {
        res.status(400).json({
            message: '⚠️ The rapport already includes this quartier',
        });
        return;
    }

    const quartierExists = await database
        .collection('quartiers')
        .findOne({ _id: quartierId });

    if (!quartierExists) {
        res.status(404).json({
            message: '⚠️ Quartier not found',
        });
        return;
    }

    const data = await collection.findOneAndUpdate(
        {
            _id: new ObjectId(id),
        },
        {
            $push: { quartiers: quartierId },
        },
        {
            returnDocument: 'after',
        }
    );

    if (data && data.value) {
        res.status(201).json({ message: '👍 Quartier added' });
        redisClient.del(`rapport:${id}`);
    } else {
        res.status(500).json({ message: '🚫 Failed to add quartier' });
    }
};

const removeQuartier = async (req, res) => {
    const { id, quartierId } = req.params;
    try {
        const quartierExists = await collection.findOne({
            _id: new ObjectId(id),
            agents: new ObjectId(quartierId),
        });
        if (!quartierExists) {
            res.status(404).json({
                message: '⛔ No quartier found with this id',
            });
            return;
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $pull: {
                    agents: new ObjectId(quartierId),
                },
            }
        );

        if (result.matchedCount === 1) {
            res.status(200).json({ message: '🗑️ Quartier removed' });
            redisClient.del(`rapport:${id}`);
        } else {
            res.status(500).json({ message: '😖 Failed to remove quartier' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '⚠️ Internal Server Error' });
    }
};

const findMissionsQuartier = async (req, res) => {
    const { id } = req.params;
    const rapport = await collection.findOne({ _id: new ObjectId(id) });

    if (!rapport) {
        res.status(404).json({
            message: '⚠️ No rapport found with these parameters',
        });
        return;
    }

    res.status(200).json(rapport.missions);
};

const addMissionQuartier = async (req, res) => {
    const { id } = req.params;
    const { body } = req;

    if (!id) {
        res.status(400).json({ message: '🚫 No id provided' });
        return;
    }

    const rapport = await collection.findOne({ _id: new ObjectId(id) });

    if (!rapport) {
        res.status(404).json({
            message: '🚫 No rapport found with these parameters',
        });
        return;
    }

    const missionId = new ObjectId(body.missionId);

    const missionExistsInDaily = await collection.findOne({
        _id: new ObjectId(id),
        missions: { $in: [missionId] },
    });

    if (missionExistsInDaily) {
        res.status(400).json({
            message: '⚠️ The rapport already includes this mission',
        });
        return;
    }

    const missionExists = await database
        .collection('missions')
        .findOne({ _id: missionId });

    if (!missionExists) {
        res.status(404).json({
            message: '⚠️ Mission not found',
        });
        return;
    }

    const data = await collection.findOneAndUpdate(
        {
            _id: new ObjectId(id),
        },
        {
            $push: { missions: missionId },
        },
        {
            returnDocument: 'after',
        }
    );

    if (data && data.value) {
        res.status(201).json({ message: '👍 Mission added' });
        redisClient.del(`rapport:${id}`);
    } else {
        res.status(500).json({ message: '🚫 Failed to add mission' });
    }
};

const removeMissionQuartier = async (req, res) => {
    const { id, missionId } = req.params;
    try {
        const missionExists = await collection.findOne({
            _id: new ObjectId(id),
            missions: new ObjectId(missionId),
        });
        if (!missionExists) {
            res.status(404).json({
                message: '⛔ No mission found with this id',
            });
            return;
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $pull: {
                    missions: new ObjectId(missionId),
                },
            }
        );

        if (result.matchedCount === 1) {
            res.status(200).json({ message: '🗑️ Mission Quartier removed' });
            redisClient.del(`rapport:${id}`);
        } else {
            res.status(500).json({ message: '😖 Failed to remove mission' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '⚠️ Internal Server Error' });
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
    findMissions,
    addMission,
    removeMission,
    findQuartiers,
    addQuartier,
    removeQuartier,
    findMissionsQuartier,
    addMissionQuartier,
    removeMissionQuartier,
};
