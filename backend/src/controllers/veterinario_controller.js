import Veterinario from "../models/Veterinario.js"
import {sendMailToRegister, sendMailToRecoveryPassword} from "../config/nodemailer.js"

const registro = async (req,res)=>{
    const {email,password} = req.body
    if (Object.values(req.body).includes("")) return res.status(400).json({msg:"Todos los campos son obligatorios."})
    const verificarEmailBDD = await Veterinario.findOne({email})
    if(verificarEmailBDD) return res.status(400).json({msg:"Lo sentimos, el email ya se encuentra registrado"})
    const nuevoVeterinario = new Veterinario(req.body)
    nuevoVeterinario.password = await nuevoVeterinario.encrypPassword(password)
    const token = nuevoVeterinario.crearToken()
    await sendMailToRegister(email,token)
    await nuevoVeterinario.save()
    res.status(200).json({msg:"Revisa tu correo electrónico para confirmar tu cuenta"})
}

const confirmarMail = async (req,res)=>{
    if(!(req.params.token)) return res.status(400).json({msg:"Lo sentimos, no se puede validar la cuenta"})
    const veterinarioBDD = await Veterinario.findOne({token:req.params.token})
    if(!veterinarioBDD?.token) return res.status(404).json({msg:"La cuenta ya ha sido confirmada"})
    veterinarioBDD.token = null
    veterinarioBDD.confirmEmail=true
    await veterinarioBDD.save()
    res.status(200).json({msg:"Token confirmado, ya puedes iniciar sesión"}) 
}

//Etapa 1
const recuperarPassword = async(req, res) => {
    //Primera validacion: Obtener el email 
    const {email} = req.body
    //2: Verificar que el correo electronico no este en blanco
    if (Object.values(req.body).includes("")) return res.status(404).json({msg: "Todos los campos deben ser llenados obligatoriamente."})

    //Verificar que exista el correo electronico en la base de datos
    const veterinarioBDD = await Veterinario.findOne({email})

    if (!veterinarioBDD) return res.status(404).json({msg: "Lo sentimos, el usuario no existe"})
    //3
    const token = veterinarioBDD.crearToken()
    veterinarioBDD.token = token

    //Enviar email
    await sendMailToRecoveryPassword(email,token)
    await veterinarioBDD.save()
    //4
    res.status(200).json({msg: "Revisa tu correo electrónico para restablecer tu contraseña."})
}

//Etapa 2
const comprobarTokenPassword = async (req, res) => {
    //1
    const {token} = req.params
    //2
    const veterinarioBDD = await Veterinario.findOne({token})
    if(veterinarioBDD.token !== token) return res.status(404).json({msg: "Lo sentimos, no se puede validar la cuenta."})

    //3
    await veterinarioBDD.save()

    //4
    res.status(200).json({msg: "Token confirmado, ya puedes crear una nueva contraseña."})
}

//Etapa 3
const crearnuevoPassword = async (req, res) => {
    //1
    const {password, confirmpassword} = req.body
    //2: Validacion de contraseñas
    if(Object.values(req.body).includes("")) return res.status(404).json({msg: "Este campo debe ser llenado de manera obligatoria."})

    if (password !== confirmpassword) return res.status(404).json({msg: "Las contraseñas no coinciden."})

    const veterinarioBDD = await Veterinario.findOne({token: req.params.token})

    if (veterinarioBDD.token !== req.params.token) return res.status(404).json({msg: "Lo sentimos, no se puede validar la cuenta."})

    //3
    veterinarioBDD.token = null
    //Encriptar el password del usuario
    veterinarioBDD.password = await veterinarioBDD.encrypPassword(password)
    veterinarioBDD.save()    
    //4: Enviar el mensaje de respuesta al usuario
    res.status(200).json({msg: "Su contraseña se ha reestablecido exitosamente, ya puede iniciar sesion"})

}

const login = async (req, res) => {
    //1
    const {email, password} = req.body
    //2
    if(Object.values(req.body).includes("")) return res.status(400).json({msg: "Todos los campos son obligatorios."})
    
    const veterinarioBDD = await Veterinario.findOne({email}).select("-status -__v -token -createdAt -updateAt")   //Quitar de la base de datos los siguientes campos
    
    //Verificar que el usuario ha creado la cuenta.
    if (veterinarioBDD?.confirmEmail === false) return res.status(401).json({msg: "Su usuario debe estar registrado antes de iniciar sesión."})
    //Verificar que el email del usuario exista en la base de datos.
    if(!veterinarioBDD) return res.status(404).json({msg: "Lo sentimos, el usuario no existe."})
    
    const verificarPassword = await veterinarioBDD.matchPassword(password)

    if (!verificarPassword) return res.status(401).json({msg: "Lo sentimos, la contraseña es incorrecta."})
    //3
    const{nombre, apellido, direccion, telefono, _id, rol} = veterinarioBDD

    //4: Enviar los siguientes campos al frontend
    res.status(200).json({
        rol,
        nombre,
        apellido,
        direccion,
        telefono,
        _id,
    }
    )
}

export {
    registro,
    confirmarMail,
    recuperarPassword,
    comprobarTokenPassword,
    crearnuevoPassword,
    login
}
