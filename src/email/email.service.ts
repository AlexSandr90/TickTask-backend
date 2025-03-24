import { Resend } from 'resend';

const resend = new Resend('re_hnQVNEit_Mw3jKozaQMGGqMz4J5hVum2C'); // Убедись, что заменил на свой ключ

export async function sendVerificationEmail(to: string, subject: string, text: string) {
  const response = await resend.emails.send({
    from: 'smailxxxvizde@gmail.com',  // Используем публичный email Resend
    to,
    subject,
    text,
  });
  console.log('Email sent:', response);
}