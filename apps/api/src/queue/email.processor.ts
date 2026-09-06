import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EmailService } from '../email/email.service';

@Processor('email-queue')
export class EmailProcessor extends WorkerHost implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  onModuleInit() {
    this.worker?.on('error', (err) => {
      this.logger.debug(`EmailProcessor worker connection event: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    try {
      await this.worker?.close();
    } catch {
      // Ignore cleanup error
    }
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `Processing email job ${job.id} for template: ${job.data.templateName}`,
    );

    const { userId, templateName, variables } = job.data;

    try {
      // In a real environment, this calls SendGrid/SMTP.
      // For now we use the email service's inner logic
      await this.emailService.sendEmailInternal(
        userId,
        templateName,
        variables,
      );
      this.logger.log(`Email job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(
        `Email job ${job.id} failed: ${error.message}`,
        error.stack,
      );
      throw error; // Throwing triggers BullMQ retry/backoff mechanism
    }
  }
}
