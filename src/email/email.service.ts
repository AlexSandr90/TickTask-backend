import { Resend } from 'resend';
import { Injectable } from '@nestjs/common';
import { EMAIL_TEMPLATES } from './email.constants';

const resend = new Resend(process.env.EMAIL_API_KEY);

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  context?: Record<string, any>;
}

interface BoardInvitationData {
  to: string;
  receiverName: string;
  senderName: string;
  boardTitle: string;
  invitationToken: string;
  expiresAt: Date;
}

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly fromEmail = 'support@taskcraft.click';

  constructor() {
    this.resend = new Resend(process.env.EMAIL_API_KEY);
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const { to, subject, text, html } = options;

      const emailData: any = {
        from: this.fromEmail,
        to,
        subject,
      };

      if (html) {
        emailData.html = html;
      }
      if (text) {
        emailData.text = text;
      }

      await resend.emails.send(emailData);
    } catch (error) {
      console.error('Error sending email: ', error);
      throw error;
    }
  }

  private getBaseStyles(): string {
    return `
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f7fc;
          color: #333;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 30px;
        }
        h1 {
          text-align: center;
        }
        p {
          font-size: 16px;
          line-height: 1.5;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          text-align: center;
          font-weight: bold;
          margin-top: 20px;
        }
        .footer {
          font-size: 12px;
          text-align: center;
          color: #999;
          margin-top: 30px;
        }
        .success { color: #4caf50; background-color: #4caf50; }
        .danger { color: #f44336; background-color: #f44336; }
        .info { color: #2196f3; background-color: #2196f3; }
      </style>
    `;
  }

  private createHtmlTemplate(
    title: string,
    content: string,
    buttonText?: string,
    buttonLink?: string,
    buttonType: 'success' | 'danger' | 'info' = 'success',
  ): string {
    const button =
      buttonText && buttonLink
        ? `<a href="${buttonLink}" class="button ${buttonType}">${buttonText}</a>`
        : '';

    return `
      <html lang="">
        <head>
          <title>Taskcraft</title>
          ${this.getBaseStyles()}
        </head>
        <body>
          <div class="container">
            <h1 class="${buttonType}">${title}</h1>
            ${content}
            ${button}
            <div class="footer">
              <p>Best regards,<br/>The Taskcraft Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async sendVerificationRegistrationEmail(
    to: string,
    subject: string,
    text: string,
  ): Promise<void> {
    const template = EMAIL_TEMPLATES.VERIFICATION;
    const html = this.createHtmlTemplate(
      template.TITLE,
      template.CONTENT,
      template.BUTTON_TEXT,
      text,
      template.BUTTON_TYPE,
    );
    await this.sendEmail({ to, subject, text, html });
  }

  async sendVerificationChangeEmail(
    to: string,
    subject: string,
    text: string,
  ): Promise<void> {
    const template = EMAIL_TEMPLATES.EMAIL_RESET;
    const html = this.createHtmlTemplate(
      template.TITLE,
      template.CONTENT,
      template.BUTTON_TEXT,
      text,
      template.BUTTON_TYPE,
    );
    await this.sendEmail({ to, subject, text, html });
  }

  async sendPasswordResetEmail(
    to: string,
    subject: string,
    resetLink: string,
  ): Promise<void> {
    const template = EMAIL_TEMPLATES.PASSWORD_RESET;

    const html = this.createHtmlTemplate(
      template.TITLE,
      template.CONTENT,
      template.BUTTON_TEXT,
      resetLink,
      template.BUTTON_TYPE,
    );

    const textVersion = `To reset your password, click on the following link: ${resetLink}`;

    await this.sendEmail({ to, subject, text: textVersion, html });
  }

  async sendBoardInvitation(data: BoardInvitationData): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const invitationUrl = `${frontendUrl}/board-invitation?token=${data.invitationToken}`;

    const expiresFormatted = data.expiresAt.toLocaleString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });

    const content = `
      <p>Привіт, ${data.receiverName}!</p>
      <p><strong>${data.senderName}</strong> запросив тебе приєднатися до дошки "<strong>${data.boardTitle}</strong>".</p>
      <p>Натисни на кнопку нижче, щоб прийняти запрошення:</p>
      <p><small>Запрошення дійсне до: ${expiresFormatted}</small></p>
      <p>Якщо ти не очікував цього запрошення, можеш проігнорувати цей лист.</p>
    `;

    const html = this.createHtmlTemplate(
      `Запрошення до дошки "${data.boardTitle}"`,
      content,
      'Прийняти запрошення',
      invitationUrl,
      'info',
    );

    const textVersion = `${data.senderName} запросив тебе до дошки "${data.boardTitle}". 
Перейди за посиланням, щоб прийняти запрошення: ${invitationUrl}
Запрошення дійсне до: ${expiresFormatted}`;

    await this.sendEmail({
      to: data.to,
      subject: `Запрошення до дошки "${data.boardTitle}"`,
      text: textVersion,
      html,
    });
  }

  async sendCustomEmail(options: {
    to: string;
    subject: string;
    title: string;
    content: string;
    buttonText?: string;
    buttonLink?: string;
    buttonType?: 'success' | 'danger' | 'info';
    customText?: string;
  }): Promise<void> {
    const {
      to,
      subject,
      title,
      content,
      buttonText,
      buttonLink,
      buttonType,
      customText,
    } = options;

    const html = this.createHtmlTemplate(
      title,
      content,
      buttonText,
      buttonLink,
      buttonType || 'info',
    );

    await this.sendEmail({ to, subject, text: customText, html });
  }

  async sendPlainEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    await this.sendEmail({ to, subject, text, html: html || text });
  }
}
