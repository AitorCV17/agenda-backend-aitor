import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"Agenda Personal" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Correo enviado a ${to} con el asunto "${subject}"`);
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
};
