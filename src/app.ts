import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// No es necesario llamar a dotenv.config() aquí ya que se ha hecho en index.ts

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(bodyParser.json());

// Importar rutas
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import userRoutes from './routes/user.routes';
import eventRoutes from './routes/event.routes';
import noteRoutes from './routes/note.routes';
import taskRoutes from './routes/task.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Configurar rutas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

export default app;
