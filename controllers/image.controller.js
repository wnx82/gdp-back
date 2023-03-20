const fs = require('fs');
const path = require('path');

exports.saveImage = (req, res) => {
  const imageDirectory = path.join(__dirname, 'public', 'images');
  if (!fs.existsSync(imageDirectory)) {
    fs.mkdirSync(imageDirectory, { recursive: true });
  }

  const imageData = req.body.imageData;
  const imageName = 'image.jpg';
  const imagePath = path.join(imageDirectory, imageName);

  fs.writeFile(imagePath, imageData, 'base64', (err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: 'Erreur lors de l\'enregistrement de l\'image' });
    }
    
    console.log('Image enregistrée avec succès');
    return res.status(200).json({ message: 'Image enregistrée avec succès' });
  });
};
