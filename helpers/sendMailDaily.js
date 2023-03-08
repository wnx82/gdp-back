const moment = require('moment');
const sendMail = require('./sendMail');
const fs = require('fs');

const sendMailDaily = async function (id, data) {
    // const dataSubject = '✅ Rapport ' + data.date;
    const dataSubject =
        '📝 Missions du ' + moment(data.date).format('YYYY/MM/DD');
    const dataMessage = '';

    console.log(data.agentsData.matricule);

    // accéder à l'attribut agentsData
    const agentsData = data.agentsData;
    console.log(agentsData);
    // boucle pour accéder à chaque objet dans agentsData et afficher le matricule de chaque agent
    data.agentsData.forEach(agentData => {
        console.log(agentData.matricule);
    });

    const dataMailTo = `vandermeulen.christophe@gmail.com`;
    // const dataMailTo = `  ${data.agentsData
    //     .map(agentData => {
    //         return `${agentData.email}`;
    //     })
    //     .join(',')}`;

    // console.log(data);

    const dataHTML = `
<!DOCTYPE html>
<html>

<head>
    <title>Missions</title>
        <style>
            /* Reset styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}
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
            margin: 0 0 0 30px;
            padding: 0;
        }


        li {
            margin-top: 10px;
        }
        .content p {
            margin-bottom: 10px; /* ou la valeur de marge souhaitée */
        }
        .content p strong {
            font-weight: bold;
        }

    </style>

</head>

<body>
    <div class="container">
        <div class="header">
            <h1>📝 Ordre du ${moment(data.date).format('YYYY/MM/DD')}</h1>
            <h2>Bonjour les loulous</h2>
            <p>ID unique: ${id}</p>
        </div>
        <div class="content">
<p><strong>👤 Agents:</strong></p>
<ul>
  ${data.agentsData
      .map(agentData => {
          return `<li>${agentData.matricule} - ${agentData.firstname} ${agentData.lastname}</li>`;
      })
      .join('')}
</ul>
            <p><strong>📅 Horaire presté:</strong> ${data.horaire}</p>
            <p><strong>🚙 Véhicule:</strong> ${data.vehicule}</p>
            <p><strong>📌 Quartiers :</strong></p>
            <ul>
  ${data.quartiersData
      .map(quartiersData => {
          return `<li>${quartiersData.title}</li>`;
      })
      .join('')}
            </ul>
            <p><strong>📌 Missions quartier(s) :</strong></p>
            <ul>
  ${data.quartiersMissionsData
      .map(quartiersMissionsData => {
          return `<li>${quartiersMissionsData.title}</li><ul><li>${quartiersMissionsData.description}</li></ul>`;
      })
      .join('')}
            </ul>
            <p><strong>📋 Liste des missions supplémentaires:</strong></p>
            <ul>
  ${data.missionsData
      .map(missionsData => {
          return `<li>${missionsData.title}</li><ul><li>${missionsData.description}</li></ul>`;
      })
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
            <p><strong>Envoyé le :</strong>${moment(data.sent)
                .utcOffset('+0100')
                .format('YYYY/MM/DD à HH:mm')}</p>
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

    sendMail(dataSubject, dataMessage, dataHTML, dataMailTo)
        .then(() => console.log('📄 Mail Daily envoyé avec succès'))
        .catch(err =>
            console.error("Erreur lors de l'envoi de la daily:", err)
        );
};

module.exports = sendMailDaily;
