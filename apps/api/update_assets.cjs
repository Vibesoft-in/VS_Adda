const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const paths = [
    '/images/bakery.jpg',
    '/images/tech_office.jpg',
    '/images/ai_chip.jpg',
    '/images/fitness.jpg',
  ];
  const assets = await prisma.mediaAsset.findMany();
  for (let i = 0; i < assets.length; i++) {
    await prisma.mediaAsset.update({
      where: { id: assets[i].id },
      data: { url: paths[i % paths.length] },
    });
  }
  console.log(`Updated ${assets.length} media assets in database!`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
