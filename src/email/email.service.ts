import { Resend } from 'resend';

const resend = new Resend('emailApiKey'); // Убедись, что заменил на свой ключ

async function sendVerificationEmail(to: string, subject: string, text: string) {
  const response = await resend.emails.send({
    from: 'your-email@example.com',
    to,
    subject,
    text,
  });
  console.log('Email sent:', response);
}