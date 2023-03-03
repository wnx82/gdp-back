// ./controllers/dailies.controller.js

// const dbClient = require('../utils/').dbClient;
const { dbClient, redisClient } = require('../utils');
const { catchAsync, success } = require('../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('dailies');
const moment = require('moment');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;

const schema = Joi.object({
    date: Joi.date().required(),
    agents: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    // .min(1)
    // .required(),
    horaire: Joi.string().allow(null).optional().empty(''),
    vehicule: Joi.string().allow(null).optional().empty(''),
    quartiers: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),

    missions: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),

    notes: Joi.string().allow(null).optional().empty(''),
    annexes: Joi.array()
        .items(Joi.string().allow(null).optional().empty(''))
        .optional(),
});

const findAll = catchAsync(async (req, res) => {
    const message = '📄 Liste des dailies';
    const inCache = await redisClient.get('dailies:all');
    if (inCache) {
        return res.status(200).json(success(message, JSON.parse(inCache)));
    } else {
        const data = await collection.find({}).toArray();
        redisClient.set('dailies:all', JSON.stringify(data), 'EX', 600);
        res.status(200).json(success(message, data));
    }
});

const findOne = catchAsync(async (req, res) => {
    try {
        const message = `📄 Détails du daily`;
        const { id } = req.params;
        let data = null;
        const inCache = await redisClient.get(`daily:${id}`);

        if (inCache) {
            return res.status(200).json(success(message, JSON.parse(inCache)));
        } else {
            data = await collection.findOne({ _id: new ObjectId(id) });
            redisClient.set(`daily:${id}`, JSON.stringify(data), 'EX', 600);
        }

        if (!data) {
            res.status(404).json({
                message: `No daily found with id ${id}`,
            });
            return;
        } else {
            res.status(200).json(success(message, data));
        }
    } catch (e) {
        console.error(e);
    }
});

const create = catchAsync(async (req, res) => {
    const message = `✏️ Création d'un daily`;

    const { body } = req;
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
        const quartiersID = value.quartiers.map(p => {
            return new ObjectId(p);
        });
        value.quartiers = quartiersID;
        const missionsID = value.missions.map(p => {
            return new ObjectId(p);
        });
        value.missions = missionsID;

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
                console.log(`----------->Le daily a bien été créé<-----------`)
            );
        res.status(201).json(success(message, data));
        //on efface le redis
        console.log('on efface le redis');
        redisClient.del('dailies:all');
    } catch (err) {
        console.log(err);
    }
});
const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'No id provided' });
    }
    const message = `📝 Mise à jour du daily ${id}`;
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
        res.status(200).json(success(message, value));
        redisClient.del('dailies:all');
        redisClient.del(`daily:${id}`);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});
const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;
    if (force === undefined || parseInt(force, 10) === 0) {
        //Vérification si le daily a déjà été supprimé de manière logique
        const daily = await collection.findOne({ _id: new ObjectId(id) });
        if (!isNaN(daily.deletedAt)) {
            // Constat already deleted, return appropriate response
            const message = `Le daily a déjà été supprimé de manière logique.`;
            return res.status(200).json(success(message, daily));
        }
        //suppression logique
        const message = `🗑️ Suppression d'un daily de manière logique`;
        const data = await collection.updateOne(
            {
                _id: new ObjectId(id),
            },
            {
                $set: { deletedAt: new Date() },
            }
        );
        res.status(200).json(success(message, data));
        redisClient.del('dailies:all');
        redisClient.del(`daily:${id}`);
    } else if (parseInt(force, 10) === 1) {
        //suppression physique
        const message = `🗑️ Suppression d'un daily de manière physique`;
        console.log('suppression physique/valeur force:' + force);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            console.log('Successfully deleted');
            res.status(200).json(success(message));
            redisClient.del('dailies:all');
            redisClient.del(`daily:${id}`);
        } else {
            res.status(404).json({ message: 'Failed to delete' });
        }
    } else {
        res.status(400).json({ message: 'Malformed parameter "force"' });
    }
});

const findAgents = async (req, res) => {
    const { id } = req.params;
    const daily = await collection.findOne({ _id: new ObjectId(id) });

    if (!daily) {
        res.status(404).json({
            message: 'No daily found with these parameters',
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
        res.status(400).json({ message: 'No id provided' });
        return;
    }

    const daily = await collection.findOne({ _id: new ObjectId(id) });

    if (!daily) {
        res.status(404).json({
            message: 'No daily found with these parameters',
        });
        return;
    }

    const agentId = new ObjectId(body.agentId);

    if (daily.agents.includes(agentId)) {
        res.status(400).json({
            message: 'The daily already includes this agent',
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
        res.status(201).json({ message: 'Agent added' });
    } else {
        res.status(500).json({ message: 'Failed to add agent' });
    }
};

const removeAgent = async (req, res) => {
    const { id, agentId } = req.params;
    try {
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $pull: {
                    agents: new ObjectId(agentId),
                },
            }
        );

        if (result.matchedCount === 1) {
            res.status(200).json({ message: 'Agent removed' });
        } else {
            res.status(404).json({ message: 'No agent found with this id' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const findQuartiers = async (req, res) => {
    const { id } = req.params;
    const daily = await collection.findOne({ _id: new ObjectId(id) });

    if (!daily) {
        res.status(404).json({
            message: 'No daily found with these parameters',
        });
        return;
    }

    res.status(200).json(daily.quartiers);
};

const addQuartier = async (req, res) => {
    const { id } = req.params;
    const { body } = req;

    if (!id) {
        res.status(400).json({ message: 'No id provided' });
        return;
    }

    const daily = await collection.findOne({ _id: new ObjectId(id) });

    if (!daily) {
        res.status(404).json({
            message: 'No daily found with these parameters',
        });
        return;
    }

    const quartierId = new ObjectId(body.quartierId);

    if (daily.quartiers.includes(quartierId)) {
        res.status(400).json({
            message: 'The daily already includes this quartier',
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
        res.status(201).json({ message: 'Quartier added' });
    } else {
        res.status(500).json({ message: 'Failed to add quartier' });
    }
};

const removeQuartier = async (req, res) => {
    const { id, quartierId } = req.params;
    try {
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $pull: {
                    quartiers: new ObjectId(quartierId),
                },
            }
        );

        if (result.matchedCount === 1) {
            res.status(200).json({ message: 'Quartier removed' });
        } else {
            res.status(404).json({ message: 'No quartier found with this id' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const findMissions = async (req, res) => {
    const { id } = req.params;
    const daily = await collection.findOne({ _id: new ObjectId(id) });

    if (!daily) {
        res.status(404).json({
            message: 'No daily found with these parameters',
        });
        return;
    }

    res.status(200).json(daily.missions);
};

const addMission = async (req, res) => {
    const { id } = req.params;
    const { body } = req;

    if (!id) {
        res.status(400).json({ message: 'No id provided' });
        return;
    }

    const daily = await collection.findOne({ _id: new ObjectId(id) });

    if (!daily) {
        res.status(404).json({
            message: 'No daily found with these parameters',
        });
        return;
    }

    const missionId = new ObjectId(body.missionId);

    if (daily.missions.includes(missionId)) {
        res.status(400).json({
            message: 'The daily already includes this mission',
        });
        return;
    }

    const data = await collection.findOneAndUpdate(
        { _id: new ObjectId(id), missions: { $ne: missionId } },
        {
            $push: { missions: missionId },
        },
        {
            returnDocument: 'after',
        }
    );

    if (data && data.value) {
        res.status(201).json({ message: 'Mission added' });
    } else {
        res.status(500).json({ message: 'Failed to add mission' });
    }
};

const removeMission = async (req, res) => {
    const { id, missionId } = req.params;
    try {
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $pull: {
                    missions: new ObjectId(missionId),
                },
            }
        );

        if (result.matchedCount === 1) {
            res.status(200).json({ message: 'Mission removed' });
        } else {
            res.status(404).json({ message: 'No mission found with this id' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    findAll,
    findOne,
    create,
    updateOne,
    deleteOne,
    findAgents,
    addAgent,
    removeAgent,
    findQuartiers,
    addQuartier,
    removeQuartier,
    findMissions,
    addMission,
    removeMission,
};
