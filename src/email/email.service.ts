import { Resend } from 'resend';

const resend = new Resend(process.env.EMAIL_API_KEY);

/**
 * Функция для отправки письма с подтверждением
 * @param {string} to - Адрес получателя
 * @param {string} subject - Тема письма
 * @param {string} text - Текст письма (будет использован как текстовая версия)
 */
export async function sendVerificationEmail(
  to: string,
  subject: string,
  text: string,
) {
  // Создаём HTML-версию письма с красивым оформлением
  const emailBody = `
    <html lang="">
      <head>
      <title>Artem</title>
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
            color: #4caf50;
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
            background-color: #4caf50;
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
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Your Magic Link</h1>
          <p>Hello!</p>
          <p>We received a request to create an account for you. Click the button below to activate your account and get started:</p>
         <a href="${text}" class="button">Activate Your Account</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <div class="footer">
            <p>Best regards,<br/>The Taskcraft Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'support@taskcraft.click', // Отправитель (твое доменное имя)
      to, // Адрес получателя
      subject, // Тема письма
      text, // Текстовая версия для почтовых клиентов без HTML
      html: emailBody, // HTML-версия с оформлением
    });
  } catch (error) {

  }
}
export async function sendPasswordResetEmail(
  to: string,
  subject: string,
  resetLink: string
) {
  // Создаём HTML-версию письма для сброса пароля
  const emailBody = `
    <html lang="">
      <head>
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
            color: #f44336;
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
            background-color: #f44336;
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
        </style><title>Artem</title>
      </head>
      <body>
        <div class="container">
          <h1>Password Reset</h1>
          <p>Hello!</p>
          <p>We received a request to reset your password. Click the button below to reset your password:</p>
         <a href="${resetLink}" class="button">Reset Your Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <div class="footer">
            <p>Best regards,<br/>The Taskcraft Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'support@taskcraft.click', // Отправитель (твое доменное имя)
      to, // Адрес получателя
      subject, // Тема письма
      text: `To reset your password, click on the following link: ${resetLink}`, // Текстовая версия для почтовых клиентов без HTML
      html: emailBody, // HTML-версия с оформлением
    });
  } catch (error) {

  }
}