const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const canonicalTemplates = [
  {
    name: 'WELCOME_EMAIL',
    subject: 'Welcome to {{siteName}}, {{username}}!',
    htmlContent: `<h2>Welcome to {{siteName}}!</h2><p>Hello <strong>{{username}}</strong>,</p><p>Your account has been successfully created. Join thousands of players online to solve daily challenges, learn new solving techniques, and participate in competitive duels.</p><p><a href="http://localhost:3000" style="background-color:#FF4500;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;">Play Sudoku Now</a></p><p>See you soon on {{siteName}}!</p><p>Need help? Contact us at {{supportEmail}}.</p>`,
  },
  {
    name: 'EMAIL_VERIFICATION',
    subject: 'Verify your email address - {{siteName}}',
    htmlContent: `<h2>Verify your email address</h2><p>Hello <strong>{{username}}</strong>,</p><p>Thank you for registering on {{siteName}}. Please verify your email address to unlock full member features and save your global ranking:</p><p><a href="{{verificationLink}}" style="background-color:#FF4500;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;">Verify My Account</a></p><p>If the button above does not work, copy and paste this link into your browser:<br>{{verificationLink}}</p><p>This verification link will expire in 24 hours.</p><p>Best regards,<br>The {{siteName}} Team</p>`,
  },
  {
    name: 'PASSWORD_RESET',
    subject: 'Reset your password - {{siteName}}',
    htmlContent: `<h2>Password Reset Request</h2><p>Hello <strong>{{username}}</strong>,</p><p>We received a request to reset your password on {{siteName}}.</p><p><a href="{{resetLink}}" style="background-color:#FF4500;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;">Reset Password</a></p><p>If you did not request this password reset, please ignore this email or contact {{supportEmail}} immediately.</p><p>This link expires in 1 hour.</p><p>The {{siteName}} Team</p>`,
  },
  {
    name: 'DUEL_INVITATION',
    subject: 'Sudoku 1v1 Duel Challenge from {{username}}',
    htmlContent: `<h2>You have been challenged to a duel!</h2><p><strong>{{username}}</strong> (Elo: {{elo}}) invites you to a live Sudoku duel match.</p><p><a href="http://localhost:3000/duel" style="background-color:#FFCC00;color:#020F24;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;">Join the Duel</a></p><p>See you on the leaderboard!</p>`,
  },
];

async function seed() {
  console.log('Seeding canonical English email templates...');
  for (const t of canonicalTemplates) {
    await prisma.emailTemplate.upsert({
      where: { name: t.name },
      update: {
        subject: t.subject,
        htmlContent: t.htmlContent,
      },
      create: {
        name: t.name,
        subject: t.subject,
        htmlContent: t.htmlContent,
      },
    });
    console.log(`✅ Seeded/Updated template: ${t.name}`);
  }
}

seed()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
  });
