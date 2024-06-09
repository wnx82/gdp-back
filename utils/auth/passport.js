const dbClient = require('..').dbClient; // Assurez-vous que le chemin est correct
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const userModel = database.collection('agents');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { compare: BcryptCompare } = require('bcrypt');
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const { ObjectId } = require('mongodb');
const connectedUsers = require('./connectedUsers'); // Assurez-vous que le chemin est correct

passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
        },
        function (email, password, cb) {
            console.log('Tentative de connexion pour l\'email:', email);
            return userModel
                .findOne({ email })
                .then(async user => {
                    if (!user) {
                        console.log('Utilisateur non trouvé:', email);
                        return cb(null, false, {
                            message: 'Email ou mot de passe incorrect.',
                            status: 404
                        });
                    }

                    if (user.enable === false) {
                        console.log('Compte utilisateur désactivé:', email);
                        return cb(null, false, {
                            message: 'Votre compte est désactivé. Veuillez contacter le support.',
                            status: 403
                        });
                    }

                    const checkPassword = await BcryptCompare(password, user.password);
                    if (checkPassword) {
                        console.log('Connexion réussie pour l\'utilisateur:', email);
                        
                        // Mettre à jour la date de dernière connexion
                        await userModel.updateOne(
                            { _id: user._id },
                            { $set: { lastConnection: new Date() } }
                        );

                        // Enregistrer l'utilisateur comme connecté dans Redis
                        connectedUsers.addUser(user);

                        // Rafraîchir l'utilisateur après la mise à jour
                        const updatedUser = await userModel.findOne({ _id: user._id });
                        delete updatedUser.password;

                        return cb(null, updatedUser, {
                            message: 'Connexion réussie.',
                        });
                    }

                    console.log('Mot de passe incorrect pour l\'utilisateur:', email);
                    return cb(null, false, {
                        message: 'Email ou mot de passe incorrect.',
                        status: 401
                    });
                })
                .catch(err => {
                    console.error('Erreur lors de la connexion pour l\'utilisateur:', email, err);
                    return cb(err);
                });
        }
    )
);

passport.use(
    new JWTStrategy(
        {
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.TOKEN_JWT_SECRET,
        },
        function (jwtPayload, cb) {
            console.log('Authentification JWT pour l\'ID utilisateur:', jwtPayload._id);
            return userModel
                .findOne({ _id: new ObjectId(jwtPayload._id) })
                .then(user => {
                    if (!user) {
                        console.log('Utilisateur non trouvé pour l\'ID:', jwtPayload._id);
                        return cb(null, false);
                    }

                    // Enregistrer l'utilisateur comme connecté dans Redis
                    connectedUsers.addUser(user);

                    console.log('Utilisateur trouvé pour l\'ID:', jwtPayload._id);
                    return cb(null, user);
                })
                .catch(err => {
                    console.error('Erreur lors de l\'authentification JWT pour l\'ID utilisateur:', jwtPayload._id, err);
                    return cb(err);
                });
        }
    )
);

// Supprimer l'utilisateur de Redis lors de la déconnexion
passport.logout = (userId) => {
    connectedUsers.removeUser(userId);
};

module.exports = passport;
