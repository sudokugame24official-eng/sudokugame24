import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChatGateway } from '../chat/chat.gateway';
import { prisma } from '@repo/database';

@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name);

  private readonly botNames = ['Alex_99', 'SudokuKing', 'MasterMind', 'ProGamerX', 'LogicBeast', 'PuzzleSolver', 'Brainiac_22'];
  private readonly chatMessages = [
    'Quelqu\'un pour un duel en mode Master ?',
    'Je viens de battre mon record !',
    'Le challenge du jour était difficile non ?',
    'Hello à tous !',
    'Une astuce pour la technique Swordfish ?',
    'Je cherche un adversaire de mon niveau',
    'Incroyable ce site !',
  ];
  
  private readonly forumTopics = [
    { title: 'Comment repérer un X-Wing facilement ?', content: 'Je galère toujours à trouver les X-Wings. Des astuces visuelles ?' },
    { title: 'Mon record en Expert !', content: 'Je viens de finir une grille expert en 4 minutes, qui dit mieux ?' },
    { title: 'Tournoi ce week-end', content: 'Qui est chaud pour organiser un tournoi amical ce dimanche ?' },
  ];

  constructor(private chatGateway: ChatGateway) {}

  // Run every 5 minutes
  @Cron('0 */5 * * * *')
  async simulateChatActivity() {
    this.logger.log('Simulating chat activity...');
    const botName = this.botNames[Math.floor(Math.random() * this.botNames.length)];
    const message = this.chatMessages[Math.floor(Math.random() * this.chatMessages.length)];
    
    // Broadcast a global message
    this.chatGateway.server.emit('global_message', {
      id: Math.random().toString(36).substring(7),
      senderId: 'bot_' + botName,
      senderName: botName,
      content: message,
      createdAt: new Date().toISOString(),
    });
  }

  // Run every hour
  @Cron(CronExpression.EVERY_HOUR)
  async simulateForumActivity() {
    this.logger.log('Simulating forum activity...');
    try {
      const category = await prisma.forumCategory.findFirst({ where: { name: 'strategies' } });
      if (!category) return;

      // Find or create a bot user
      const botName = this.botNames[Math.floor(Math.random() * this.botNames.length)];
      let bot = await prisma.user.findFirst({ where: { email: `${botName.toLowerCase()}@bot.com` } });
      
      if (!bot) {
        bot = await prisma.user.create({
          data: {
            email: `${botName.toLowerCase()}@bot.com`,
            passwordHash: 'bot_password',
            role: 'MEMBER',
            profile: {
              create: {
                username: botName,
              }
            }
          }
        });
      }

      const topic = this.forumTopics[Math.floor(Math.random() * this.forumTopics.length)];
      
      await prisma.forumPost.create({
        data: {
          title: topic.title,
          content: topic.content,
          authorId: bot.id,
          categoryId: category.id,
        }
      });
      this.logger.log(`Created fake forum post by ${botName}`);
    } catch (e) {
      this.logger.error('Failed to simulate forum activity: ' + e.message);
    }
  }
}
