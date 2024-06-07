const moment = require('moment');
const sendMail = require('./sendMail');
const fs = require('fs');

const configHelper = require('../helpers/configHelper');
configHelper.createConfigFile();
const CONFIG_FILE_PATH = 'config.json';

const sendHabitation = async function (agentsData, habitationData, note) {
    const configData = fs.readFileSync(CONFIG_FILE_PATH);
    const config = JSON.parse(configData);

    const dataSubject = `✅ Nouvelle entrée pour ${habitationData?.adresse.rue} ${habitationData?.adresse.numero}`;

    const dataMessage = '';
    const dataMailTo = config.mail.to_habitations;
    const dataHTML = `
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

        .details {
            margin-top: 20px;
        }

        .details table {
            width: 100%;
            border-collapse: collapse;
        }

        .details table td {
            padding: 10px;
            vertical-align: top;
            border: 1px solid #dddddd;
        }

        .details table th {
            padding: 10px;
            text-align: left;
            background-color: #f5f5f5;
            border: 1px solid #dddddd;
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
            <h1>📌 Nouvelle entrée pour ${habitationData?.adresse.rue}, ${
        habitationData?.adresse.numero
    }  </h1>
        </div>
        <div class="content">
            <p class="message">
                Ce <strong>${moment(new Date()).format(
                    'YYYY/MM/DD à HH:mm'
                )}</strong>, l'agent GDP <strong>A${
        agentsData.matricule[0]
    } </strong>${
        agentsData.matricule[1] !== undefined
            ? `, accompagné de l'agent GDP <strong> A${agentsData.matricule[1]}`
            : ''
    }
</strong>, s'est rendu à l'habitation : <strong>${
        habitationData?.adresse.rue
    }, ${
        habitationData?.adresse.numero
    }</strong> et a communiqué le commentaire suivant :
                <strong>${note}</strong>
            </p>
            <div class="details">
                <table>
                    <tr>
<th>👮 Agent(s)</th>
    <td>
      A${agentsData.matricule[0]}
${agentsData.matricule[1] !== undefined ? `, A${agentsData.matricule[1]}` : ''}

    </td>
                    </tr>
                    <tr>
                        <th>📌 Habitation</th>
                        <td>${habitationData?.adresse.rue} ${
        habitationData?.adresse.numero
    }</td>
                    </tr>
                    <tr>
                        <th>📝 Note</th>
                        <td>${note}</td>
                    </tr>
                </table>
            </div>
        </div>
        <div class="footer">
            <div>Gardien de la Paix - Ville de Mouscron</div>
            <div class="logo"><img src="https://ekreativ.be/images/visuel.png"
                    alt="Logo Gardien de la Paix Belgique" />
                <img src="https://ekreativ.be/images/ville.png"
                    alt="Logo Mouscron" />

            </div>
        </div>
    </div>
</body>

</html>
    `;

    sendMail(dataSubject, dataMessage, dataHTML, dataMailTo)
        .then(() => console.log('📄 Mail rapport envoyé avec succès'))
        .catch(err =>
            console.error("Erreur lors de l'envoi du rapport :", err)
        );
};

module.exports = sendHabitation;
