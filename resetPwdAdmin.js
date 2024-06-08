// resetAdmin.js
require('dotenv').config();
const { dbClient } = require('./utils');
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter the new password for admin: ', async (newPassword) => {
    try {
        // Connexion à la base de données
        const db = dbClient.db(process.env.MONGO_DB_DATABASE);

        // Chercher l'admin par email
        const adminEmail = 'admin@admin.com';
        const admin = await db.collection('agents').findOne({ email: adminEmail });

        if (!admin) {
            console.error('Admin user not found!');
            process.exit(1);
        }

        // Réinitialiser le mot de passe de l'admin
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour l'admin avec le nouveau mot de passe
        await db.collection('agents').updateOne(
            { email: adminEmail },
            { $set: { password: hashedPassword, updatedAt: new Date() } }
        );

        console.log('Admin password has been reset successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting admin password:', error);
        process.exit(1);
    } finally {
        rl.close();
    }
});

