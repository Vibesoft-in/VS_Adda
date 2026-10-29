const fs = require('fs');
const path = require('path');

const artifactDir = 'C:\\Users\\bisht\\.gemini\\antigravity-ide\\brain\\4ae20644-ef9b-405a-a8ca-3bee5e591091';
const webImagesDir = path.resolve('apps/web/public/images');
const apiUploadsDir = path.resolve('apps/api/uploads');

fs.mkdirSync(webImagesDir, { recursive: true });
fs.mkdirSync(apiUploadsDir, { recursive: true });

const files = fs.readdirSync(artifactDir);
const bakeryImg = files.find(f => f.startsWith('bakery_pastries') && f.endsWith('.jpg'));
const techImg = files.find(f => f.startsWith('tech_workspace') && f.endsWith('.jpg'));
const chipImg = files.find(f => f.startsWith('futuristic_chip') && f.endsWith('.jpg'));
const fitnessImg = files.find(f => f.startsWith('fitness_athlete') && f.endsWith('.jpg'));
const camilaImg = files.find(f => f.startsWith('camila_avatar') && f.endsWith('.jpg'));

const list = [
  { src: bakeryImg, dst: 'bakery.jpg' },
  { src: techImg, dst: 'tech_office.jpg' },
  { src: chipImg, dst: 'ai_chip.jpg' },
  { src: fitnessImg, dst: 'fitness.jpg' },
  { src: camilaImg, dst: 'camila.jpg' },
];

for (const item of list) {
  if (item.src) {
    fs.copyFileSync(path.join(artifactDir, item.src), path.join(webImagesDir, item.dst));
    fs.copyFileSync(path.join(artifactDir, item.src), path.join(apiUploadsDir, item.dst));
    console.log(`Copied ${item.dst}`);
  }
}
console.log('All image files copied successfully!');
