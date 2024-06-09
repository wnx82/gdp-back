const { dbClient } = require('.');
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const userModel = database.collection('agents');
const { ObjectId } = require('mongodb');
const sendMail = require('./sendMail');

const verifyAndSendMail = async (email) => {
    try {
        const user = await userModel.findOne({ email });
        if (user) {
            // L'e-mail existe, envoyer l'e-mail de notification
            const subject = 'Notification de Récupération de Mot de Passe';
            const message = 'Votre demande de récupération de mot de passe a été reçue.';
            const html = '<p>Votre demande de récupération de mot de passe a été reçue.</p>';
            await sendMail(email, subject, message, html);
            console.log('E-mail envoyé à :', email);
            return { status: 'success', message: 'E-mail envoyé.' };
        } else {
            console.log('E-mail non trouvé dans la base de données.');
            return { status: 'error', message: 'E-mail non trouvé.' };
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'e-mail ou de l\'envoi de l\'e-mail :', error);
        return { status: 'error', message: 'Une erreur s\'est produite.' };
    }
};

module.exports = verifyAndSendMail;
