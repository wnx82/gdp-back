// ./helpers/validateId.js
const { ObjectId } = require('mongodb');

const validateId = (req, res, next) => {
    const id = req.params.id;

    if (!id || !ObjectId.isValid(id)) {
        return res
            .status(400)
            .json({ message: 'Invalid or missing id provided' });
    }

    next();
};

module.exports = validateId;
