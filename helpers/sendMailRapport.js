const moment = require('moment');
const sendMail = require('./sendMail');
const fs = require('fs');

const configHelper = require('../helpers/configHelper');
configHelper.createConfigFile();
const CONFIG_FILE_PATH = 'config.json';

const sendMailRapport = async function (id, data) {
    const configData = fs.readFileSync(CONFIG_FILE_PATH);
    const config = JSON.parse(configData);
    // const dataSubject = '✅ Rapport ' + data.date;
    const dataSubject =
        '📝 Rapport du ' + moment(data.date).format('YYYY/MM/DD');
    const dataMessage = '';
    const dataMailTo = config.mail.to_chef;
    
    //const dataMailTo = data.agentsData.map(agentData => agentData.email).join(',');
    console.log(data);
    console.log(data.date);
    console.log('rapport: ' + id);
    console.log(data.notes);
    console.log(data.matricules);
    const dataHTML = `
<!DOCTYPE html>
<html>

<head>
    <title>Rapport</title>
    <style>
        /* CSS */
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }

        .container {
            margin: 50px;
        }

        .header {
            background-color: #56007b;
            padding: 10px;
            text-align: center;
            color: #fff
        }

        .content {
            padding: 20px;
        }

        .footer {
            background-color: #fff;
            padding: 10px;
            text-align: center;
        }

        .logo img {
            height: 50px;
            margin: 5px;
        }

        /* Style de la page */
        .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            margin-top: 0;
        }

        .footer div:first-child {
            margin-bottom: 10px;
        }

        .logo {
            display: flex;
            justify-content: center;
        }

        ul {
            list-style: none;
            margin: 0 0 0 60px;
            padding: 0;
        }


        li {
            margin-top: 10px;
        }

        .content p strong {
            font-weight: bold;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>📝 Rapport du ${moment(data.date).format('YYYY/MM/DD')}</h1>
            <p>🆔 : ${id}</p>
        </div>
        <div class="content">
<p><strong>👮 Agents:</strong></p>
<ul>
  ${data.matricules
      .map(
          (matricule, index) =>
              `<li>${matricule} - ${data.lastnames[index]} ${data.firstnames[index]}</li>`
      )
      .join('')}
</ul>

            <p><strong>📅 Horaire presté:</strong> ${data.horaire}</p>
            <p><strong>🚙 Véhicule:</strong> ${data.vehicule}</p>
            <p><strong>📌 Quartiers effectués:</strong></p>
            <ul>
                ${data.quartiers
                    .map(quartier => `<li>🏘️ ${quartier}</li>`)
                    .join('')}
            </ul>
            <p><strong>📌 Missions quartier effectuées:</strong></p>
            <ul>
                ${data.missionsQuartierValidate
                    .map(
                        missionsQuartierValidate =>
                            `<li>• ${missionsQuartierValidate}</li>`
                    )
                    .join('')}
            </ul>
            <p><strong>📋 Liste des missions effectuées:</strong></p>
            <ul>
                ${data.missions
                    .map(mission => `<li>• ${mission}</li>`)
                    .join('')}
            </ul>
            <p><strong>📝 Notes:</strong></p>
            <ul>
  ${data.notes}
            </ul>
            <p><strong>📑 Annexes:</strong></p>
            <ul>
  ${data.annexes}
            </ul><br><br>

            <p><strong>Envoyé le :</strong>${moment(data.createdAt)
                .utcOffset('+0100')
                .format('YYYY/MM/DD à HH:MM')}</p>
        </div>
    </div>
    <div class="footer">
        <div>Gardien de la Paix - Ville de Mouscron</div>
        <div class="logo">
            <img src="https://ekreativ.be/images/visuel.png"
                alt="Logo Gardien de la Paix Belgique" />
            <img src="https://ekreativ.be/images/ville.png"
                alt="Logo Mouscron" />
        </div>
    </div>
</body>

</html>
    `;

    sendMail(dataSubject, dataMessage, dataHTML, dataMailTo)
        .then(() => console.log('📄 Mail rapport envoyé avec succès'))
        .catch(err => console.error("Erreur lors de l'envoi du rapport:", err));
};

module.exports = sendMailRapport;
