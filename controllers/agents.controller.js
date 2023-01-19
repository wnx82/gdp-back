const dbClient = require('../utils').dbClient;
const database = dbClient.db(process.env.MONGO_DB_DATABASE);
const collection = database.collection('agents');
const Agent = require('../models/Agent');

const findAll = async (req, res) => {
    console.log('Liste contrôleur agents');
    const data = await collection.find({}).toArray();
    res.status(200).json(data);
};

const findOne = async (req, res) => {
    const { id, lastname, firstname } = req.params;

    if (!id) {
        res.status(400).json({ message: 'No id provided' });
    }
    const data = await collection.findOne({ _id: id });
    if (!data) {
        res.status(404).json({ message: `No user found with id ${id}` });
    }

    res.status(200).json(data);
};
const create = async (req, res) => {
    const { lastname, firstname, matricule, birthday, adresse, cp, tel } =
        req.body;
    try {
        //console.log(req.body);
        console.log(lastname, firstname, matricule);
        console.log(new Date() + ' : requete lancée');

        //console.log(req.body);
        if (!matricule) {
            console.log('errorrrr!!!!!!');
            //req.flash('error', 'Certains champs ne peuvent pas être vides!');
            //res.redirect('/agents/create');
            return;
        }
        await Agent.create({
            lastname: lastname,
            firstname: firstname,
            matricule: matricule,
        }).then(
            console.log(
                `----------->L\'agent ${matricule} a bien été créé<-----------`
            )
        );
        res.status(201).json(data);
    } catch (err) {
        console.log(err);
    }
};
const updateOne = async (req, res) => {};
const deleteOne = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: 'No id provided' });
    }
    const { force } = req.query;

    if (force === undefined || parseInt(force, 10) === 0) {
        //suppression logique
        await collection.updateOne(
            {
                _id: id, //filter
            },
            {
                $set: { deleteAt: new Date() },
            }
        );
        res.status(200).json(data);
    }
    if (parseInt(force, 10) === 1) {
        //suppression physique
        const result = await collection.deleteOne({ _id: id });
        // if (result.deletedCount === 1) {
        //     console.log('Successfully deleted');
        // }
        res.status(204);
    }
    res.status(400).json({ message: 'Malformed parameter "force"' });
};

module.exports = {
    findAll,
    findOne,
    create,
    updateOne,
    deleteOne,
};
