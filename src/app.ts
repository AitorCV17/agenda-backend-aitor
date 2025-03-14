import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import authRoutes from './routes/auth.routes'
import adminRoutes from './routes/admin.routes'
import userRoutes from './routes/user.routes'
import eventRoutes from './routes/event.routes'
import noteRoutes from './routes/note.routes'
import taskRoutes from './routes/task.routes'

const app = express()

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}))

app.use(bodyParser.json())

// Rutas
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/users', userRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/tasks', taskRoutes)

export default app
