const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5001;

app.use(cors());
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('audio'), (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, 'uploads', `${Date.now()}.wav`);

  fs.rename(tempPath, targetPath, err => {
    if (err) return res.sendStatus(500);

    res.json({ audioUrl: `http://localhost:5001/${path.basename(targetPath)}` });
  });
});

app.use(express.static('uploads'));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});