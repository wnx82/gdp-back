// ./controllers/forget-password.controller.js
const { dbClient } = require('../utils');
const sendMail = require('../utils/sendMail.util');
const { catchAsync } = require('../helpers');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const userModel = database.collection('agents');
const Joi = require('joi');
const ObjectId = require('mongodb').ObjectId;

const schema = Joi.object({
    email: Joi.string().email().required(),
});

const forgetPassword = catchAsync(async (req, res) => {
    const { body } = req;
    const { value, error } = schema.validate(body);
    if (error) {
        return res.status(400).json({
            message: error.details.map(err => err.message).join(', '),
        });
    }

    const { email } = value;

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email not found' });
        }

        // Générer un token de réinitialisation de mot de passe
        const resetToken = generateToken();
        // Optionnel : enregistrer le token dans la base de données

        const subject = 'Récupération de mot de passe';
        const message = `Utilisez ce token pour réinitialiser votre mot de passe : ${resetToken}`;
        const html = `<p>Utilisez ce token pour réinitialiser votre mot de passe : <strong>${resetToken}</strong></p>`;

        await sendMail(email, subject, message, html);

        res.status(200).json({ message: 'Reset token sent to email' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

const generateToken = () => {
    const array = new Uint32Array(10);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
};

module.exports = {
    forgetPassword,
};
