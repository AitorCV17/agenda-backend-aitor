import 'reflect-metadata'
import app from './app'
import { logger } from './utils/logger'

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  logger.info(`Servidor corriendo en http://localhost:${PORT}`)
})
