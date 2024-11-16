// Se definen varias funciones relacionadas con la autenticación de usuarios, 
// incluyendo el registro, inicio de sesión y cierre de sesión.
// Llama a los métodos create y login de UserRepository para gestionar 
// la creación y autenticación de usuarios.

const UserRepository = require('./user-repository.js');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator'); // para validar los datos proporcionados por el usuario antes de llamarlas funciones del UserRepository.

//const { SECRET_JWT_KEY } = require('../config.js');
require('dotenv').config(); // Importa y configura dotenv
const SECRET_JWT_KE = process.env.SECRET_JWT_KEY // extrae el secret key del .env
const { pool } = require("../conection/conection");


// Función para registrar un nuevo usuario
// Si la entrada es válida, se llama a UserRepository.create para crear un nuevo usuario.

const registrarUsuario = async (req, res) => {
    const { username, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const id = await UserRepository.create({ username, password });  // verifica si el usuario existe, hashea la contraseña, genera un ID único e inserta el nuevo usuario en la base de datos
        return res.status(201).json({ id });
    } catch (error) {
        return res.status(400).send(error.message);
    }
};

// Función para iniciar sesión
// Si la entrada es válida, se llama a UserRepository.login para autenticar al usuario.
// Si la autenticación es exitosa, se genera un token JWT y se envía al cliente.
const iniciarSesion = async (req, res) => {
    const { username, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await UserRepository.login({ username, password });
        const token = jwt.sign(
            { id: user._id, username: user.username },
            SECRET_JWT_KEY,
            { expiresIn: '1h' }
        );

        res
            .cookie('access_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'PRODUCTION',  // configuración de una cookie en un entorno Node.js y se refiere a la seguridad de la cookie.
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 // 1 hora
            })
            .json({ user, token });
    } catch (error) {
        console.error(error);
        return res.status(401).send(error.message);
    }
};

// Función para cerrar sesión
// simplemente elimina la cookie que contiene el token JWT, cerrando efectivamente la sesión del usuario.
const cerrarSesion = (req, res) => {
    return res
        .clearCookie('access_token')
        .json({ message: 'Logout successful' });
};

