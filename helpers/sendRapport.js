const moment = require('moment');
const sendMail = require('./sendMail');
const fs = require('fs');

const sendHabitation = async function (id, data) {
    // const dataSubject = '✅ Rapport ' + data.date;
    const dataSubject =
        '📝 Rapport du ' + moment(data.date).format('YYYY/MM/DD');
    const dataMessage = '';
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
            <p>ID unique: ${id}</p>
        </div>
        <div class="content">
            <p><strong>🆔 Matricules:</strong></p>
            <ul>
                ${data.matricules
                    .map(matricule => `<li>${matricule}</li>`)
                    .join('')}
            </ul>
            <p><strong>👮 Agents:</strong></p>
            <ul>
                ${data.lastnames
                    .map(lastname => `<li>${lastname}</li>`)
                    .join('')}
            </ul>
            <p><strong>📅 Horaire presté:</strong> ${data.horaire}</p>
            <p><strong>🚙 Véhicule:</strong> ${data.vehicule}</p>
            <p><strong>📌 Quartiers effectués:</strong></p>
            <ul>
                ${data.quartiers
                    .map(quartier => `<li>${quartier}</li>`)
                    .join('')}
            </ul>
            <p><strong>📌 Missions quartier effectuées:</strong></p>
            <ul>
                ${data.missionsQuartierValidate
                    .map(
                        missionsQuartierValidate =>
                            `<li>${missionsQuartierValidate}</li>`
                    )
                    .join('')}
            </ul>
            <p><strong>📋 Liste des missions effectuées:</strong></p>
            <ul>
                ${data.missions.map(mission => `<li>${mission}</li>`).join('')}
            </ul>
            <p><strong>📝 Notes:</strong></p>
            <ul>
                ${data.notes.map(note => `<li>${note}</li>`).join('')}
            </ul>
            <p><strong>📑 Annexes:</strong></p>
            <ul>
                ${data.annexes.map(annexe => `<li>${annexe}</li>`).join('')}
            </ul><br><br>
            <p><strong>Envoyé le :</strong>${moment(data.createdAt)
                .utcOffset('+0100')
                .format('YYYY/MM/DD à HH:MM')}</p>
        </div>
    </div>
    <div class="footer">
        <div>Gardien de la Paix - Ville de Mouscron</div>
        <div class="logo">
            <img src="https://www.perwez.be/commune/autres-services/gardiens-de-la-paix/visuel.png"
                alt="Logo Gardien de la Paix Belgique" />
            <img src="https://www.mouscron.be/cpskinlogo.png/@@images/1d2c8501-9f39-478c-b643-d1ee63496fd5.png"
                alt="Logo Mouscron" />
        </div>
    </div>
</body>

</html>
    `;

    sendMail(dataSubject, dataMessage, dataHTML)
        .then(() => console.log('📄 Mail Habitation envoyé avec succès'))
        .catch(err =>
            console.error("Erreur lors de l'envoi de l'habitation:", err)
        );
};

module.exports = sendHabitation;
