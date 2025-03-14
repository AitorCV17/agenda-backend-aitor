import cron from 'node-cron';
import prisma from '../utils/prisma';
import { sendReminderEmail } from '../utils/email';
import dayjs from 'dayjs';

// Ejecuta cada minuto
cron.schedule('* * * * *', async () => {
  const now = dayjs();
  // Encuentra eventos que están a 1 minuto de iniciar, tomando en cuenta el reminderOffset
  const events = await prisma.event.findMany({
    where: {
      reminderOffset: { not: null },
      startTime: {
        gte: now.add(1, 'minute').toDate(),
        lte: now.add(1, 'minute').toDate() // o ajusta la ventana según sea necesario
      }
    }
  });

  for (const event of events) {
    // Calcula si debe enviarse el recordatorio
    // Por ejemplo, si la diferencia entre el startTime y el ahora es igual a reminderOffset
    const diff = dayjs(event.startTime).diff(now, 'minute');
    if (diff === event.reminderOffset) {
      await sendReminderEmail(event);
    }
  }
});
