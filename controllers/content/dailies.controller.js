// ./controllers/dailies.controller.js

const { dbClient, redisClient } = require('../../utils');
const { catchAsync, success } = require('../../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('dailies');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'dailies';

const schema = Joi.object({
    id: Joi.string().allow(null).optional().empty(''),
    date: Joi.date().required(),
    agents: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    horaire: Joi.string().allow(null).optional().empty(''),
    vehicule: Joi.string().allow(null).optional().empty(''),
    quartiers: Joi.array().allow(null).items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    missions: Joi.array().allow(null).items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    notes: Joi.string().allow(null).optional().empty(''),
    annexes: Joi.array().allow(null).items(Joi.string().optional().empty('')),
    sent: Joi.date().allow(null).optional().empty(''),
});

const findAll = catchAsync(async (req, res) => {
    const inCache = await redisClient.get(`${collectionName}:all`);
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    } else {
        const data = await collection.find({}).toArray();
        redisClient.set(`${collectionName}:all`, JSON.stringify(data), 'EX', 600);
        res.status(200).json(data);
    }
});

const findOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const inCache = await redisClient.get(`${collectionName}:${id}`);
    if (inCache) {
        return res.status(200).json(JSON.parse(inCache));
    }

    const data = await collection.findOne({ _id: new ObjectId(id) });
    if (!data) {
        return res.status(404).json({ message: `⛔ No daily found with id ${id}` });
    }

    redisClient.set(`${collectionName}:${id}`, JSON.stringify(data), 'EX', 600);
    res.status(200).json(data);
});

const create = catchAsync(async (req, res) => {
    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({ message: error.details.map(err => err.message).join(', ') });
    }

    try {
        const agentsID = value.agents.map(p => new ObjectId(p));
        value.agents = agentsID;

        const quartiersID = value.quartiers.map(p => new ObjectId(p));
        value.quartiers = quartiersID;

        const missionsID = value.missions.map(p => new ObjectId(p));
        value.missions = missionsID;

        const agents = await database.collection('agents').find({ _id: { $in: agentsID } }).toArray();
        const quartiers = await database.collection('quartiers').find({ _id: { $in: quartiersID } }).toArray();
        const missions = await database.collection('missions').find({ _id: { $in: missionsID } }).toArray();

        if (agents.length !== agentsID.length) {
            return res.status(400).json({ message: 'Invalid agent ID provided' });
        }
        if (quartiers.length !== quartiersID.length) {
            return res.status(400).json({ message: 'Invalid quartier ID provided' });
        }
        if (missions.length !== missionsID.length) {
            return res.status(400).json({ message: 'Invalid mission ID provided' });
        }

        const createdAt = new Date();
        const updatedAt = new Date();
        const data = await collection.insertOne({ ...value, createdAt, updatedAt });

        res.status(201).json(data);
        redisClient.del(`${collectionName}:all`);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
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

    const updateValue = { ...value };
    if (value.agents) {
        updateValue.agents = value.agents.map(value => new ObjectId(value));
    }
    if (value.quartiers) {
        updateValue.quartiers = value.quartiers.map(value => new ObjectId(value));
    }
    if (value.missions) {
        updateValue.missions = value.missions.map(value => new ObjectId(value));
    }

    try {
        const daily = await collection.findOne({ _id: new ObjectId(id) });
        if (!daily) {
            return res.status(404).json({ message: 'Daily not found' });
        }

        const updatedAt = new Date();
        const { modifiedCount } = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateValue, updatedAt } },
            { returnDocument: 'after' }
        );

        if (modifiedCount === 0) {
            return res.status(404).json({ message: 'Daily not found' });
        }

        res.status(200).json(value);
        redisClient.del(`${collectionName}:all`);
        redisClient.del(`${collectionName}:${id}`);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;
    if (force === undefined || parseInt(force, 10) === 0) {
        const daily = await collection.findOne({ _id: new ObjectId(id) });
        if (daily?.deletedAt) {
            return res.status(200).json(daily);
        }

        const data = await collection.updateOne({ _id: new ObjectId(id) }, { $set: { deletedAt: new Date() } });
        res.status(200).json(data);
        redisClient.del(`${collectionName}:all`);
        redisClient.del(`${collectionName}:${id}`);
    } else if (parseInt(force, 10) === 1) {
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            res.status(200).json(success(`🗑️ Suppression d'un daily de manière physique`));
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
    const daily = await collection.findOne({ _id: new ObjectId(id) });

    if (!daily) {
        res.status(404).json({ message: '🚫 No daily found with these parameters' });
        return;
    }

    const agents = await collection
        .aggregate([
            { $match: { _id: new ObjectId(id) } },
            { $project: { agents: 1 } },
            {
                $lookup: {
                    from: 'agents',
                    localField: 'agents',
                    foreignField: '_id',
                    as: 'populatedAgents',
                },
            },
            { $project: { agents: '$populatedAgents' } },
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

    const daily = await collection.findOne({ _id: new ObjectId(id) });

    if (!daily) {
        res.status(404).json({ message: '🚫 No daily found with these parameters' });
        return;
    }

    const agentId = new ObjectId(body.agentId);

    const agentExistsInDaily = await collection.findOne({
        _id: new ObjectId(id),
        agents: { $in: [agentId] },
    });

    if (agentExistsInDaily) {
        res.status(400).json({ message: '⚠️ The daily already includes this agent' });
        return;
    }

    const agentExists = await database.collection('agents').findOne({ _id: agentId });

    if (!agentExists) {
        res.status(404).json({ message: '⚠️ Agent not found' });
        return;
    }

    const data = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $push: { agents: agentId } },
        { returnDocument: 'after' }
    );

    if (data.matchedCount === 1) {
        res.status(201).json({ message: '👍 Agent added' });
        redisClient.del(`${collectionName}:${id}`);
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
            { $pull: { agents: new ObjectId(agentId) } }
        );

        if (result.matchedCount === 1) {
            res.status(200).json({ message: '🗑️ Agent removed' });
            redisClient.del(`${collectionName}:${id}`);
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
    const daily = await collection.findOne({ _id: new ObjectId(id) });

    if (!daily) {
        res.status(404).json({ message: '⚠️ No daily found with these parameters' });
        return;
    }

    res.status(200).json(daily.missions);
};

const addMission = async (req, res) => {
    const { id } = req.params;
    const { body } = req;

    if (!id) {
        res.status(400).json({ message: '🚫 No id provided' });
        return;
    }

    const daily = await collection.findOne({ _id: new ObjectId(id) });

    if (!daily) {
        res.status(404).json({ message: '🚫 No daily found with these parameters' });
        return;
    }

    const missionId = new ObjectId(body.missionId);

    const missionExistsInDaily = await collection.findOne({
        _id: new ObjectId(id),
        missions: { $in: [missionId] },
    });

    if (missionExistsInDaily) {
        res.status(400).json({ message: '⚠️ The daily already includes this mission' });
        return;
    }

    const missionExists = await database.collection('missions').findOne({ _id: missionId });

    if (!missionExists) {
        res.status(404).json({ message: '⚠️ Mission not found' });
        return;
    }

    const data = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $push: { missions: missionId } },
        { returnDocument: 'after' }
    );

    if (data.matchedCount === 1) {
        res.status(201).json({ message: '👍 Mission added' });
        redisClient.del(`${collectionName}:${id}`);
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
            res.status(404).json({ message: '⛔ No mission found with this id' });
            return;
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $pull: { missions: new ObjectId(missionId) } }
        );

        if (result.matchedCount === 1) {
            res.status(200).json({ message: '🗑️ Mission removed' });
            redisClient.del(`${collectionName}:${id}`);
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
    const daily = await collection.findOne({ _id: new ObjectId(id) });

    if (!daily) {
        res.status(404).json({ message: '⚠️ No daily found with these parameters' });
        return;
    }

    res.status(200).json(daily.quartiers);
};

const addQuartier = async (req, res) => {
    const { id } = req.params;
    const { body } = req;

    if (!id) {
        res.status(400).json({ message: '🚫 No id provided' });
        return;
    }

    const daily = await collection.findOne({ _id: new ObjectId(id) });

    if (!daily) {
        res.status(404).json({ message: '🚫 No daily found with these parameters' });
        return;
    }

    const quartierId = new ObjectId(body.quartierId);

    const quartierExistsInDaily = await collection.findOne({
        _id: new ObjectId(id),
        quartiers: { $in: [quartierId] },
    });

    if (quartierExistsInDaily) {
        res.status(400).json({ message: '⚠️ The daily already includes this quartier' });
        return;
    }

    const quartierExists = await database.collection('quartiers').findOne({ _id: quartierId });

    if (!quartierExists) {
        res.status(404).json({ message: '⚠️ Quartier not found' });
        return;
    }

    const data = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $push: { quartiers: quartierId } },
        { returnDocument: 'after' }
    );

    if (data.matchedCount === 1) {
        res.status(201).json({ message: '👍 Quartier added' });
        redisClient.del(`${collectionName}:${id}`);
    } else {
        res.status(500).json({ message: '🚫 Failed to add quartier' });
    }
};

const removeQuartier = async (req, res) => {
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
            redisClient.del(`${collectionName}:${id}`);
        } else {
            res.status(500).json({ message: '😖 Failed to remove quartier' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '⚠️ Internal Server Error' });
    }
};

const sendDaily = catchAsync(async (req, res) => {
    const { id } = req.params;
    const sendMailDaily = require('../../helpers/sendMailDaily');

    const result = await collection
        .aggregate([
            { $match: { _id: new ObjectId(id) } },
            { $lookup: { from: 'agents', localField: 'agents', foreignField: '_id', as: 'agentsData' } },
            { $lookup: { from: 'quartiers', localField: 'quartiers', foreignField: '_id', as: 'quartiersData' } },
            { $lookup: { from: 'missions', localField: 'missions', foreignField: '_id', as: 'missionsData' } },
            { $lookup: { from: 'missions', localField: 'quartiersData.missions', foreignField: '_id', as: 'quartiersMissionsData' } },
            { $project: { 'agentsData.password': 0 } },
        ])
        .next();

    if (!result) {
        return res.status(404).json({ message: 'No data found' });
    }

    sendMailDaily(id, result);

    const sent = new Date();
    const daily = await collection.updateOne({ _id: new ObjectId(id) }, { $set: { sent } });

    if (!daily) {
        return res.status(404).json({ message: 'Daily not found' });
    }

    redisClient.del(`${collectionName}:all`);
    redisClient.del(`${collectionName}:${id}`);

    res.status(200).json(
        await success(`📝 Envoi du daily ${id}`, `Mail envoyé aux agents le ${moment(sent).utcOffset('+0100').format('YYYY/MM/DD à HH:mm')}`)
    );
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
    sendDaily,
};
