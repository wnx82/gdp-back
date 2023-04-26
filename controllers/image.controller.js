const fs = require('fs');
const path = require('path');

exports.saveImage = (req, res) => {
  console.log('Received a request to save image');
  const imageDirectory = path.join(__dirname, '..', 'public', 'images');
  console.log(imageDirectory); // "/root/personal-projects/gdp-back/public/images"

  if (!fs.existsSync(imageDirectory)) {
    fs.mkdirSync(imageDirectory, { recursive: true });
    console.log(`Created directory ${imageDirectory}`);
  }

  console.log('coucou');
  const imageData = req.file.buffer;
  const imageName = req.file.originalname;
  const imagePath = path.join(imageDirectory, imageName);
  console.log(imageData);
  console.log(imageName);
  console.log(imagePath);

  console.log(`Writing file to ${imagePath}`);
  fs.writeFile(imagePath, imageData, 'base64', (err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: 'Erreur lors de l\'enregistrement de l\'image' });
    }

    console.log('Image enregistrée avec succès');
    return res.status(200).json({ message: 'Image enregistrée avec succès' });
  });
};
