const { dbClient } = require('../../utils');
const { catchAsync, success } = require('../../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('constatPersonne');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'personnes';

const schema = Joi.object({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    birthday: Joi.date().required(),
    nationalNumber: Joi.string().required(),
    tel: Joi.string().required(),
    rue: Joi.string().required(),
    cp: Joi.string().required(),
    localite: Joi.string().required(),
});

const findAll = catchAsync(async (req, res) => {
    const data = await collection.find().toArray();
    res.status(200).json(data);
});

const findOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const data = await collection.findOne({ _id: new ObjectId(id) });
    if (!data) {
        res.status(404).json({ message: `No personne found with id ${id}` });
        return;
    }
    res.status(200).json(data);
});

const create = catchAsync(async (req, res) => {
    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({ message: 'Validation error', errors: error.details.map(d => d.message) });
    }

    const createdAt = new Date();
    const updatedAt = new Date();

    const data = await collection.insertOne({ ...value, createdAt, updatedAt });
    res.status(201).json(data);
});

const updateOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { body } = req;

    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({ message: 'Validation error', errors: error.details.map(d => d.message) });
    }

    const updatedAt = new Date();
    const { modifiedCount } = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...value, updatedAt } },
        { returnDocument: 'after' }
    );

    if (modifiedCount === 0) {
        return res.status(404).json({ message: 'Personne not found' });
    }

    res.status(200).json(value);
});

const deleteOne = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
        res.status(200).json(success('Personne deleted successfully'));
    } else {
        res.status(404).json({ message: 'Personne not found' });
    }
});
const deleteMany = catchAsync(async (req, res) => {
    const result = await collection.deleteMany({ deletedAt: { $exists: true } });
    const deletedCount = result.deletedCount;
    if (!deletedCount) {
        return res.status(404).json({ message: 'Aucune donnée trouvée à supprimer.' });
    }
    redisClient.del(`${collectionName}:all`);
    return res.status(200).json({ message: `${deletedCount} donnée(s) supprimée(s).` });
});

const restoreMany = catchAsync(async (req, res) => {
    const result = await collection.updateMany(
        { deletedAt: { $exists: true } },
        { $unset: { deletedAt: '' } }
    );
    const restoredCount = result.nModified;
    if (restoredCount === 0) {
        return res.status(404).json({ message: 'Aucune donnée trouvée à restaurer.' });
    }
    redisClient.del(`${collectionName}:all`);
    return res.status(200).json({ message: `${restoredCount} données restaurées.` });
});

module.exports = {
    findAll,
    findOne,
    create,
    updateOne,
    deleteOne,
    deleteMany,
    restoreMany
};
