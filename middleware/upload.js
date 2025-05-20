const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helper to ensure directory exists
function createStorage(folder) {
  const dir = path.join(__dirname, '..', 'uploads', folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dir),
      filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
      }
    })
  });
}

// Export named instances
module.exports = {
  uploadMessage: createStorage('messages'),
  uploadCommunity: createStorage('community'),
  uploadThought: createStorage('thoughts'), // 👈 Add this one
};
