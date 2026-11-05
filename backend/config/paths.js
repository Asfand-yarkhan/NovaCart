const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const SEED_IMAGE_DIR = path.join(__dirname, '..', 'seed', 'images');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// uploads/ is not in git and hosts like Render wipe it on every deploy.
// The catalogue photos are in the repo, so put back any that are missing.
if (fs.existsSync(SEED_IMAGE_DIR)) {
    for (const file of fs.readdirSync(SEED_IMAGE_DIR)) {
        const target = path.join(UPLOAD_DIR, `seed-${file}`);
        if (!fs.existsSync(target)) fs.copyFileSync(path.join(SEED_IMAGE_DIR, file), target);
    }
}

module.exports = { UPLOAD_DIR };
