const dbClient = require('../utils').dbClient; // Assurez-vous que le chemin est correct
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const userModel = database.collection('agents');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { compare: BcryptCompare } = require('bcrypt');
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const { ObjectId } = require('mongodb');

passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
        },
        function (email, password, cb) {
            return userModel
                .findOne({ email })
                .then(async user => {
                    if (!user) {
                        return cb(null, false, {
                            message: 'Incorrect email or password.',
                        });
                    }

                    const checkPassword = await BcryptCompare(password, user.password);
                    if (checkPassword) {
                        delete user.password;
                        return cb(null, user, {
                            message: 'Logged In Successfully',
                        });
                    }

                    return cb(null, false, {
                        message: 'Incorrect email or password.',
                    });
                })
                .catch(err => cb(err));
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
            return userModel
                .findOne({ _id: new ObjectId(jwtPayload._id) })
                .then(user => {
                    return cb(null, user);
                })
                .catch(err => {
                    return cb(err);
                });
        }
    )
);

module.exports = passport;
