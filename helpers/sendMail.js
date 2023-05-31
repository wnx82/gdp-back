const nodemailer = require('nodemailer');
const fs = require('fs');

const configHelper = require('../helpers/configHelper');
configHelper.createConfigFile();
const CONFIG_FILE_PATH = 'config.json';

const SendMail = async function (dataSubject, dataMessage, dataHTML) {
    // Charger les données de configuration depuis le fichier JSON
    const configData = fs.readFileSync(CONFIG_FILE_PATH);
    const config = JSON.parse(configData);

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: config.mail.host,
        port: config.mail.port,
        secure: true, // true for 465, false for other ports
        auth: {
            user: config.mail.user, // generated ethereal user
            pass: config.mail.password, // generated ethereal password
        },
        logger: true,
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: config.mail.from, // sender address
        to: config.mail.to_chef, // list of receivers
        subject: dataSubject, // Subject line
        text: dataMessage, // plain text body
        html: dataHTML, // html body
    });

    console.log('Message sent: %s', info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
};

module.exports = SendMail;
