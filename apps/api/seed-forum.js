const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const admin = await prisma.profile.findFirst({ where: { user: { role: 'SUPER_ADMIN' } } });
  
  // Seed categories
  const catNames = ['ANNOUNCEMENTS', 'STRATEGIES', 'GENERAL'];
  const categories = [];
  for (const name of catNames) {
    let cat = await prisma.forumCategory.findFirst({ where: { name: name }});
    if (!cat) {
        cat = await prisma.forumCategory.create({ data: { name, description: name }});
    }
    categories.push(cat);
  }

  const topics = [
    { title: 'Bienvenue sur le forum officiel de Sudoku Premium', slug: 'bienvenue-forum-officiel', content: 'Discutez des stratégies, des tournois à venir et des mises à jour de la plateforme ici. Ce forum est optimisé pour le référencement naturel et permet d\'attirer une communauté mondiale de passionnés de Sudoku.', categoryId: categories[0].id, authorId: admin.userId, isPinned: true },
    { title: 'Techniques Avancées de Sudoku : X-Wing et Swordfish', slug: 'techniques-avancees-x-wing-swordfish', content: 'Maîtriser ces techniques est crucial pour résoudre les grilles difficiles en moins de 5 minutes. Quelle est votre technique préférée ?', categoryId: categories[1].id, authorId: admin.userId },
    { title: 'Comment améliorer votre Elo en Mode Duel', slug: 'ameliorer-elo-mode-duel', content: 'La cohérence et la vitesse. Entraînez-vous contre le Bot Difficile avant de défier de vrais joueurs. Le bot difficile joue avec précision.', categoryId: categories[2].id, authorId: admin.userId }
  ];
  
  for (const t of topics) {
    const { authorId, categoryId, ...rest } = t;
    await prisma.forumPost.create({ 
        data: { 
            ...rest, 
            author: { connect: { id: authorId } },
            category: { connect: { id: categoryId } }
        } 
    });
  }
  
  console.log('Forum seeded!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
