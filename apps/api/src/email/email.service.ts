import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { prisma } from '@repo/database';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(@InjectQueue('email-queue') private emailQueue: Queue) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025', 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'test',
        pass: process.env.SMTP_PASS || 'test',
      },
    });
  }

  async sendEmail(
    userId: string,
    templateName: string,
    data: Record<string, string> = {},
  ) {
    // IDEMPOTENCY: Create a unique job ID based on user, template and current timestamp.
    // In some cases (e.g., welcome email), it should be deterministic.
    const jobId = `email_${templateName}_${userId}_${Date.now()}`;
    await this.emailQueue.add(
      'send',
      { userId, templateName, variables: data },
      { jobId },
    );
    this.logger.log(`Queued email job ${jobId}`);
    return true;
  }

  async sendEmailInternal(
    userId: string,
    templateName: string,
    data: Record<string, string> = {},
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      if (!user) {
        this.logger.error(`User ${userId} not found, cannot send email`);
        return false;
      }

      const template = await prisma.emailTemplate.findUnique({
        where: { name: templateName },
      });

      if (!template) {
        this.logger.warn(`Email template ${templateName} not found`);
        return false;
      }

      // Merge data
      const mergeData = {
        username: user.profile?.username || 'Joueur',
        email: user.email,
        ...data,
      };

      let compiledHtml = template.htmlContent;
      let compiledSubject = template.subject;

      for (const [key, value] of Object.entries(mergeData)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        compiledHtml = compiledHtml.replace(regex, value);
        compiledSubject = compiledSubject.replace(regex, value);
      }

      const mailOptions = {
        from:
          process.env.EMAIL_FROM || '"Sudoku Platform" <noreply@sudoku.com>',
        to: user.email,
        subject: compiledSubject,
        html: compiledHtml,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent to ${user.email} (Template: ${templateName}) - Message ID: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to user ${userId}`, error);
      return false;
    }
  }
}
