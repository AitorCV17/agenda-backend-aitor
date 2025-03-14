import cron from 'node-cron';
import prisma from '../utils/prisma';
import dayjs from 'dayjs';
import { sendEmail } from '../utils/email';

cron.schedule('* * * * *', async () => {
  console.log('Verificando recordatorios...');
  const now = dayjs();

  const events = await prisma.event.findMany({
    where: {
      reminderOffset: { not: null },
      startTime: {
        lte: now.add(15, 'minute').toDate(),
        gte: now.toDate()
      },
    },
    include: { user: true }
  });

  for (const event of events) {
    const eventStart = dayjs(event.startTime);
    const reminderTime = eventStart.subtract(event.reminderOffset || 0, 'minute');
    if (now.isAfter(reminderTime)) {
      if (event.user && event.user.email) {
        const subject = `Recordatorio: ${event.title} está por iniciar`;
        const html = `<p>Hola ${event.user.name || 'Usuario'},</p>
                      <p>Este es un recordatorio de que el evento <strong>${event.title}</strong> comenzará a las ${eventStart.format('HH:mm')}.</p>`;
        await sendEmail(event.user.email, subject, html);
        console.log(`Recordatorio enviado a ${event.user.email} para el evento ${event.title}`);
      }
    }
  }
});
