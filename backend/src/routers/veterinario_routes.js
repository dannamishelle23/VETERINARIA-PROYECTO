import {Router} from 'express'
import { confirmarMail, recuperarPassword, registro, comprobarTokenPassword, crearnuevoPassword, login } from '../controllers/veterinario_controller.js'
const router = Router()

router.post('/registro',registro)

router.get('/confirmar/:token', confirmarMail)

router.post('/recuperarpassword',recuperarPassword)

router.get('/recuperarpassword/:token',comprobarTokenPassword)

router.post('/nuevopassword/:token', crearnuevoPassword)

router.post('/login', login)

export default router