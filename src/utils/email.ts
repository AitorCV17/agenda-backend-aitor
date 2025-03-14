import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendReminderEmail = async (event: any) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: 'destinatario@ejemplo.com', // Aquí debería ir el destinatario, quizá el email del usuario asociado al evento
    subject: `Recordatorio: ${event.title}`,
    text: `Te recordamos que el evento "${event.title}" comienza a las ${new Date(event.startTime).toLocaleString()}.`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Recordatorio enviado para el evento ${event.id}`);
  } catch (error) {
    console.error('Error enviando el correo de recordatorio:', error);
  }
};
