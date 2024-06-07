const { dbClient } = require('../utils');
const sendMail = require('../utils/sendMail.util');
const { catchAsync } = require('../helpers');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Joi = require('joi');
const moment = require('moment');

const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const userModel = database.collection('agents');

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
    newPassword: Joi.string().min(6).required(),
});

const forgotPassword = catchAsync(async (req, res) => {
    const { body } = req;
    const { value, error } = forgotPasswordSchema.validate(body);
    if (error) {
        return res.status(400).json({ message: error.details.map(err => err.message).join(', ') });
    }

    const { email } = value;

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email not found' });
        }

        // Générer un token de réinitialisation de mot de passe
        const resetToken = generateToken();
        // Enregistrer le token dans la base de données
        await userModel.updateOne({ email }, { $set: { resetToken, tokenExpiration: Date.now() + 3600000 } }); // 1 heure d'expiration

        console.log(`Token généré pour ${email}: ${resetToken}`);

        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const subject = 'Récupération de mot de passe';
        const message = '';
        const html = `
        <html>
        <head>
            <style>
                body {
                    background-color: #f5f5f5;
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 16px;
                    color: #444444;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 5px;
                    box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.2);
                }
                .header {
                    background-color: #56007b;
                    color: #ffffff;
                    padding: 10px;
                    border-radius: 5px 5px 0 0;
                }
                .content {
                    padding: 20px;
                }
                .message {
                    font-size: 20px;
                    margin-bottom: 20px;
                }
                .footer {
                    margin-top: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                    color: #777;
                }
                .footer img {
                    height: 30px;
                    width: auto;
                    margin-right: 10px;
                }
                .logo {
                    height: 60px;
                    width: auto;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔒 Réinitialisation de votre mot de passe</h1>
                </div>
                <div class="content">
                    <p class="message">
                        Bonjour, <br><br>
                        Vous avez demandé à réinitialiser votre mot de passe. Utilisez le lien ci-dessous pour définir un nouveau mot de passe. Ce lien est valable pendant une heure.<br><br>
                        <a href="${resetLink}">${resetLink}</a>
                    </p>
                </div>
                <div class="footer">
                    <div>Gardien de la Paix - Ville de Mouscron</div>
                    <div class="logo">
                        <img src="https://ekreativ.be/images/visuel.png" alt="Logo Gardien de la Paix Belgique" />
                        <img src="https://ekreativ.be/images/ville.png" alt="Logo Mouscron" />
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        await sendMail(subject, message, html, email);

        res.status(200).json({ message: 'Reset link sent to email' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

const resetPassword = catchAsync(async (req, res) => {
    const { token } = req.params;
    const { body } = req;
    const { value, error } = resetPasswordSchema.validate(body);
    if (error) {
        return res.status(400).json({ message: error.details.map(err => err.message).join(', ') });
    }

    const { newPassword } = value;

    try {
        console.log(`Réinitialisation du mot de passe avec le token: ${token}`);

        const user = await userModel.findOne({ resetToken: token, tokenExpiration: { $gt: Date.now() } });
        if (!user) {
            console.log('Token invalide ou expiré');
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await userModel.updateOne({ resetToken: token }, { $set: { password: hashedPassword, resetToken: null, tokenExpiration: null } });

        res.status(200).json({ message: 'Password has been reset' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

const generateToken = () => {
    return crypto.randomBytes(8).toString('hex'); // Génère un token hexadécimal de 16 caractères
};

module.exports = {
    forgotPassword,
    resetPassword,
};
