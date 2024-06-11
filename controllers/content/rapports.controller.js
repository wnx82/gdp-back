// ./controllers/rapports.controller.js

const { dbClient, redisClient } = require('../../utils');
const { catchAsync, success } = require('../../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('rapports');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'rapports';
const sendMailRapport = require('../../helpers/sendMailRapport');

const schema = Joi.object({
    id: Joi.string().allow(null).optional().empty(''),
    daily: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    date: Joi.date().required(),
    agents: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .required(),
    horaire: Joi.string().allow(null).optional().empty(''),
    vehicule: Joi.string().allow(null).optional().empty(''),
    quartiers: Joi.array()
        .allow(null)
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    quartierMissionsValidate: Joi.array()
        .allow(null)
        .optional()
        .empty('')
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    missions: Joi.array()
        .allow(null)
        .optional()
        .empty('')
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    notes: Joi.alternatives().try(
        Joi.string().allow(null).optional().empty(''),
        Joi.array().optional().allow(null).empty('')
    ),
    annexes: Joi.alternatives().try(
        Joi.string().allow(null).optional().empty(''),
        Joi.array().optional().allow(null).items(Joi.string())
    ),
});

const findAll = catchAsync(async (req, res) => {
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
        const { id } = req.params;
        let data = await collection.findOne({ _id: new ObjectId(id) });
        if (!data) {
            return res.status(404).json({ message: `⛔ No rapport found with id ${id}` });
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
        res.status(200).json(data);
    } catch (e) {
        console.error(e);
    }
});

const create = catchAsync(async (req, res) => {
    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({
            message: error.details.map(err => err.message).join(', '),
        });
    }

    try {
        value.daily = new ObjectId(value.daily);
        value.agents = value.agents.map(p => new ObjectId(p));
        value.quartiers = value.quartiers.map(p => new ObjectId(p));
        value.missions = value.missions.map(p => new ObjectId(p));
        value.quartierMissionsValidate = value.quartierMissionsValidate.map(p => new ObjectId(p));

        const [agents, quartiers, missions, quartierMissionsValidate] = await Promise.all([
            database.collection('agents').find({ _id: { $in: value.agents } }).toArray(),
            database.collection('quartiers').find({ _id: { $in: value.quartiers } }).toArray(),
            database.collection('missions').find({ _id: { $in: value.missions } }).toArray(),
            database.collection('missions').find({ _id: { $in: value.quartierMissionsValidate } }).toArray(),
        ]);

        if (agents.length !== value.agents.length ||
            quartiers.length !== value.quartiers.length ||
            missions.length !== value.missions.length ||
            quartierMissionsValidate.length !== value.quartierMissionsValidate.length) {
            return res.status(400).json({ message: 'Invalid ID provided' });
        }

        const createdAt = new Date();
        const updatedAt = new Date();
        const donnees = await collection.insertOne({ ...value, createdAt, updatedAt });
        res.status(201).json(donnees);
        redisClient.del(`${collectionName}:all`);

        const insertedId = donnees.insertedId;
        const data = await collection.aggregate([
            { $match: { _id: new ObjectId(insertedId) } },
            { $lookup: { from: 'agents', localField: 'agents', foreignField: '_id', as: 'agentsData' } },
            { $lookup: { from: 'missions', localField: 'missions', foreignField: '_id', as: 'missionsData' } },
            { $lookup: { from: 'missions', localField: 'quartierMissionsValidate', foreignField: '_id', as: 'quartierMissionsValidateData' } },
            { $lookup: { from: 'quartiers', localField: 'quartiers', foreignField: '_id', as: 'quartiersData' } },
            {
                $project: {
                    daily: 1, date: 1, horaire: 1, vehicule: 1, habitation: 1, notes: 1, annexes: 1,
                    'agentsData.matricule': 1, 'agentsData.lastname': 1, 'agentsData.firstname': 1,
                    'quartiersData.title': 1, 'missionsData.title': 1, 'quartierMissionsValidateData.title': 1,
                }
            },
            {
                $group: {
                    _id: '$_id',
                    data: {
                        $push: {
                            daily: '$daily', date: '$date', horaire: '$horaire', vehicule: '$vehicule',
                            notes: '$notes', annexes: '$annexes', matricules: '$agentsData.matricule',
                            lastnames: '$agentsData.lastname', firstnames: '$agentsData.firstname',
                            quartiers: '$quartiersData.title', missionsQuartierValidate: '$quartierMissionsValidateData.title',
                            missions: '$missionsData.title',
                        },
                    },
                }
            },
        ]).next();

        sendMailRapport(insertedId, data.data[0]);
    } catch (err) {
        console.log(err);
    }
});

const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'No id provided' });
    }

    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({ message: 'Validation error', errors: error.details.map(d => d.message) });
    }

    try {
        const rapport = await collection.findOne({ _id: new ObjectId(id) });
        if (!rapport) {
            return res.status(404).json({ message: 'Rapport not found' });
        }

        const updateValue = { ...value, updatedAt: new Date() };

        if (updateValue.daily) updateValue.daily = new ObjectId(updateValue.daily);
        if (updateValue.agents) updateValue.agents = updateValue.agents.map(agent => new ObjectId(agent));
        if (updateValue.quartiers) updateValue.quartiers = updateValue.quartiers.map(quartier => new ObjectId(quartier));
        if (updateValue.missions) updateValue.missions = updateValue.missions.map(mission => new ObjectId(mission));
        if (updateValue.quartierMissionsValidate) updateValue.quartierMissionsValidate = updateValue.quartierMissionsValidate.map(mission => new ObjectId(mission));

        const { modifiedCount } = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateValue },
            { returnDocument: 'after' }
        );

        if (modifiedCount === 0) {
            return res.status(404).json({ message: 'Rapport not found' });
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
        const rapport = await collection.findOne({ _id: new ObjectId(id) });
        if (rapport?.deletedAt) {
            return res.status(200).json(rapport);
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
            res.status(200).json(success(`🗑️ Suppression d'un rapport de manière physique`));
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
    const result = await collection.deleteMany({ deletedAt: { $exists: true } });
    const deletedCount = result.deletedCount;
    if (!deletedCount) {
        return res.status(404).json({ message: 'Aucune donnée trouvée à supprimer.' });
    }
    redisClient.del(`${collectionName}:all`);
    res.status(200).json({ message: `${deletedCount} donnée(s) supprimée(s).` });
});

const restoreMany = catchAsync(async (req, res) => {
    const result = await collection.updateMany({ deletedAt: { $exists: true } }, { $unset: { deletedAt: '' } });
    const restoredCount = result.nModified;
    if (restoredCount === 0) {
        return res.status(404).json({ message: 'Aucune donnée trouvée à restaurer.' });
    }
    redisClient.del(`${collectionName}:all`);
    res.status(200).json({ message: `${restoredCount} données restaurées.` });
});

const findAgents = catchAsync(async (req, res) => {
    const { id } = req.params;
    const agents = await collection.aggregate([
        { $match: { _id: new ObjectId(id) } },
        { $project: { agents: 1 } },
        { $lookup: { from: 'agents', localField: 'agents', foreignField: '_id', as: 'populatedAgents' } },
        { $project: { agents: '$populatedAgents' } },
    ]).toArray();

    if (!agents.length) {
        return res.status(404).json({ message: '🚫 No rapport found with these parameters' });
    }

    res.status(200).json(agents[0]);
});

const addAgent = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { body } = req;

    if (!id) {
        return res.status(400).json({ message: '🚫 No id provided' });
    }

    const agentId = new ObjectId(body.agentId);

    const [rapport, agentExists, agentExistsInDaily] = await Promise.all([
        collection.findOne({ _id: new ObjectId(id) }),
        database.collection('agents').findOne({ _id: agentId }),
        collection.findOne({ _id: new ObjectId(id), agents: { $in: [agentId] } })
    ]);

    if (!rapport) {
        return res.status(404).json({ message: '🚫 No rapport found with these parameters' });
    }

    if (!agentExists) {
        return res.status(404).json({ message: '⚠️ Agent not found' });
    }

    if (agentExistsInDaily) {
        return res.status(400).json({ message: '⚠️ The rapport already includes this agent' });
    }

    const data = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $push: { agents: agentId } },
        { returnDocument: 'after' }
    );

    if (data?.value) {
        res.status(201).json({ message: '👍 Agent added' });
        redisClient.del(`rapport:${id}`);
    } else {
        res.status(500).json({ message: '🚫 Failed to add agent' });
    }
});

const removeAgent = catchAsync(async (req, res) => {
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
            { $pull: { agents: new ObjectId(agentId) } }
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
});

const findMissions = catchAsync(async (req, res) => {
    const { id } = req.params;
    const rapport = await collection.findOne({ _id: new ObjectId(id) });

    if (!rapport) {
        res.status(404).json({ message: '⚠️ No rapport found with these parameters' });
        return;
    }

    res.status(200).json(rapport.missions);
});

const addMission = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { body } = req;

    if (!id) {
        res.status(400).json({ message: '🚫 No id provided' });
        return;
    }

    const missionId = new ObjectId(body.missionId);

    const [rapport, missionExists, missionExistsInDaily] = await Promise.all([
        collection.findOne({ _id: new ObjectId(id) }),
        database.collection('missions').findOne({ _id: missionId }),
        collection.findOne({ _id: new ObjectId(id), missions: { $in: [missionId] } })
    ]);

    if (!rapport) {
        return res.status(404).json({ message: '🚫 No rapport found with these parameters' });
    }

    if (!missionExists) {
        return res.status(404).json({ message: '⚠️ Mission not found' });
    }

    if (missionExistsInDaily) {
        return res.status(400).json({ message: '⚠️ The rapport already includes this mission' });
    }

    const data = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $push: { missions: missionId } },
        { returnDocument: 'after' }
    );

    if (data?.value) {
        res.status(201).json({ message: '👍 Mission added' });
        redisClient.del(`rapport:${id}`);
    } else {
        res.status(500).json({ message: '🚫 Failed to add mission' });
    }
});

const removeMission = catchAsync(async (req, res) => {
    const { id, missionId } = req.params;
    try {
        const missionExists = await collection.findOne({
            _id: new ObjectId(id),
            missions: new ObjectId(missionId),
        });
        if (!missionExists) {
            res.status(404).json({ message: '⛔ No mission found with this id' });
            return;
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $pull: { missions: new ObjectId(missionId) } }
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
});

const findQuartiers = catchAsync(async (req, res) => {
    const { id } = req.params;
    const rapport = await collection.findOne({ _id: new ObjectId(id) });

    if (!rapport) {
        res.status(404).json({ message: '⚠️ No rapport found with these parameters' });
        return;
    }

    res.status(200).json(rapport.quartiers);
});

const addQuartier = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { body } = req;

    if (!id) {
        res.status(400).json({ message: '🚫 No id provided' });
        return;
    }

    const quartierId = new ObjectId(body.quartierId);

    const [rapport, quartierExists, quartierExistsInDaily] = await Promise.all([
        collection.findOne({ _id: new ObjectId(id) }),
        database.collection('quartiers').findOne({ _id: quartierId }),
        collection.findOne({ _id: new ObjectId(id), quartiers: { $in: [quartierId] } })
    ]);

    if (!rapport) {
        return res.status(404).json({ message: '🚫 No rapport found with these parameters' });
    }

    if (!quartierExists) {
        return res.status(404).json({ message: '⚠️ Quartier not found' });
    }

    if (quartierExistsInDaily) {
        return res.status(400).json({ message: '⚠️ The rapport already includes this quartier' });
    }

    const data = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $push: { quartiers: quartierId } },
        { returnDocument: 'after' }
    );

    if (data?.value) {
        res.status(201).json({ message: '👍 Quartier added' });
        redisClient.del(`rapport:${id}`);
    } else {
        res.status(500).json({ message: '🚫 Failed to add quartier' });
    }
});

const removeQuartier = catchAsync(async (req, res) => {
    const { id, quartierId } = req.params;
    try {
        const quartierExists = await collection.findOne({
            _id: new ObjectId(id),
            quartiers: new ObjectId(quartierId),
        });
        if (!quartierExists) {
            res.status(404).json({ message: '⛔ No quartier found with this id' });
            return;
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $pull: { quartiers: new ObjectId(quartierId) } }
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
});

const findMissionsQuartier = catchAsync(async (req, res) => {
    const { id } = req.params;
    const rapport = await collection.findOne({ _id: new ObjectId(id) });

    if (!rapport) {
        res.status(404).json({ message: '⚠️ No rapport found with these parameters' });
        return;
    }

    res.status(200).json(rapport.missions);
});

const addMissionQuartier = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { body } = req;

    if (!id) {
        res.status(400).json({ message: '🚫 No id provided' });
        return;
    }

    const missionId = new ObjectId(body.missionId);

    const [rapport, missionExists, missionExistsInDaily] = await Promise.all([
        collection.findOne({ _id: new ObjectId(id) }),
        database.collection('missions').findOne({ _id: missionId }),
        collection.findOne({ _id: new ObjectId(id), missions: { $in: [missionId] } })
    ]);

    if (!rapport) {
        return res.status(404).json({ message: '🚫 No rapport found with these parameters' });
    }

    if (!missionExists) {
        return res.status(404).json({ message: '⚠️ Mission not found' });
    }

    if (missionExistsInDaily) {
        return res.status(400).json({ message: '⚠️ The rapport already includes this mission' });
    }

    const data = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $push: { missions: missionId } },
        { returnDocument: 'after' }
    );

    if (data?.value) {
        res.status(201).json({ message: '👍 Mission added' });
        redisClient.del(`rapport:${id}`);
    } else {
        res.status(500).json({ message: '🚫 Failed to add mission' });
    }
});

const removeMissionQuartier = catchAsync(async (req, res) => {
    const { id, missionId } = req.params;
    try {
        const missionExists = await collection.findOne({
            _id: new ObjectId(id),
            missions: new ObjectId(missionId),
        });
        if (!missionExists) {
            res.status(404).json({ message: '⛔ No mission found with this id' });
            return;
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $pull: { missions: new ObjectId(missionId) } }
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
});

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