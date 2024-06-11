const { dbClient, redisClient } = require('../../utils');
const { catchAsync, success } = require('../../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('articles');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'articles';

const schema = Joi.object({
    id: Joi.string().allow(null).optional().empty(''),
    title: Joi.string().required().description('Title is required'),
    category: Joi.string().optional().allow(null).description('Category is optional'),
    date: Joi.date().required().description('Date is required'),
    content: Joi.string().required().description('Content is required'),
    severity: Joi.string().required().description('Severity is required'),
    attachments: Joi.array().items(
        Joi.object({
            filename: Joi.string().optional(),
            url: Joi.string().uri().optional()
        })
    ).optional().allow(null),
    author: Joi.string().optional().allow(null),
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
    try {
        const { id } = req.params;
        let data = await collection.findOne({ _id: new ObjectId(id) });
        if (!data) {
            return res.status(404).json({
                message: `⛔ No article found with id ${id}`,
            });
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
    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({
            message: error.details.map(err => err.message).join(', '),
        });
    }

    try {
        const { ...rest } = value;
        const createdAt = new Date();
        const updatedAt = new Date();
        const data = await collection.insertOne({
            ...rest,
            createdAt,
            updatedAt,
        });
        console.log(`----------->Article created successfully<-----------`);
        res.status(201).json(data);
        redisClient.del(`${collectionName}:all`);
    } catch (err) {
        console.log(err);
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
        const errors = error.details.map(d => d.message);
        return res.status(400).json({ message: 'Validation error', errors });
    }
    const updateValue = { ...value };

    try {
        const updatedAt = new Date();
        const { modifiedCount } = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateValue, updatedAt } },
            { returnDocument: 'after' }
        );
        if (modifiedCount === 0) {
            return res.status(404).json({ message: 'Article not found' });
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
        const article = await collection.findOne({ _id: new ObjectId(id) });
        if (article && article.deletedAt) {
            return res.status(200).json(article);
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
            res.status(200).json(success('🗑️ Physical deletion of an article'));
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
        return res.status(404).json({ message: 'No data found to delete.' });
    }
    redisClient.del(`${collectionName}:all`);
    res.status(200).json({
        message: `${deletedCount} record(s) deleted.`,
    });
});

const restoreMany = catchAsync(async (req, res) => {
    const result = await collection.updateMany(
        { deletedAt: { $exists: true } },
        { $unset: { deletedAt: '' } }
    );
    const restoredCount = result.modifiedCount;
    if (restoredCount === 0) {
        return res.status(404).json({ message: 'No data found to restore.' });
    }
    redisClient.del(`${collectionName}:all`);
    res.status(200).json({ message: `${restoredCount} records restored.` });
});

module.exports = {
    findAll,
    findOne,
    create,
    updateOne,
    deleteOne,
    deleteMany,
    restoreMany,
};
