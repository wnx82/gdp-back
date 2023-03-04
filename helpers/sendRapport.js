const moment = require('moment');
const sendMail = require('./sendMail');
const fs = require('fs');

const sendHabitation = async function (id, data) {
    // const dataSubject = '✅ Rapport ' + data.date;
    const dataSubject = '✅ Rapport ' + moment(data.date).format('YYYY/MM/DD');
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

.content p {
  margin-top: 0;
}

.footer div:first-child {
  margin-bottom: 10px;
}

.logo {
  display: flex;
  justify-content: center;
}

	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Rapport ${moment(data.date).format('YYYY/MM/DD')}</h1>
			<p>${id}</p>
		</div>
		<div class="content">
			<p>Matricules: ${data.matricules}</p>
			<p>Agents: ${data.lastnames}</p>
			<p>Horaire presté: ${data.horaire}</p>
			<p>Véhicule: ${data.vehicule}</p>
			<p>Quartiers effectués : ${data.quartiers}</p>
			<p>Liste des missions effectuées: ${data.missions}</p>
			<p>Notes : ${data.notes}</p>
			<p>Annexes : ${data.annexes}</p>
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
