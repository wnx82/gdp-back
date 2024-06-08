// resetUser.js
require('dotenv').config();
const { dbClient } = require('./utils/');
const bcrypt = require('bcrypt');
const readline = require('readline');

const _readline = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

_readline.question('Entrez l\'email de l\'utilisateur pour le reset Password: ', async (userEmail) => {
    _readline.question('Entrez le nouveau mot de passe:  ', async (newPassword) => {
        try {
            // Connexion à la base de données
            const db = dbClient.db(process.env.MONGO_DB_DATABASE);

            // Chercher l'user par email
            const user = await db.collection('agents').findOne({ email: userEmail });

            if (!user) {
                console.error('Utilisateur not found!');
                process.exit(1);
            }

            // Réinitialiser le mot de passe de l'user
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Mettre à jour l'user avec le nouveau mot de passe
            await db.collection('agents').updateOne(
                { email: userEmail },
                { $set: { password: hashedPassword, updatedAt: new Date() } }
            );

            console.log('User password has been reset successfully.');
            process.exit(0);
        } catch (error) {
            console.error('Error resetting user password:', error);
            process.exit(1);
        } finally {
            _readline.close();
        }
    });
});
