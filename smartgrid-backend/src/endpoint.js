
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function crearRutasUsuarios(prisma) {
  const router = express.Router();

  // REGISTRO DE USUARIOS
  router.post("/registro", async (req, res) => {
    try {
      const { nombre, email, password } = req.body;

      if (
        typeof nombre !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        !nombre.trim() ||
        !email.trim()
      ) {
        return res.status(400).json({
          error: "Completá todos los campos"
        });
      }

      if (
        password.length < 8 ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password)
      ) {
        return res.status(400).json({
          error: "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número"
        });
      }

      const correo = email.trim().toLowerCase();

      const existente = await prisma.usuario.findUnique({
        where: { email: correo }
      });

      if (existente) {
        return res.status(409).json({
          error: "Este correo ya está registrado"
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const usuario = await prisma.usuario.create({
        data: {
          nombre: nombre.trim(),
          email: correo,
          password: passwordHash
        },
        select: {
          id: true,
          nombre: true,
          email: true
        }
      });

      return res.status(201).json({
        mensaje: "Usuario registrado correctamente",
        usuario
      });

    } catch (error) {
      console.error("Error en registro:", error);

      if (error.code === "P2002") {
        return res.status(409).json({
          error: "Este correo ya está registrado"
        });
      }

      return res.status(500).json({
        error: "Error interno del servidor"
      });
    }
  });

  // INICIO DE SESIÓN
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        !password
      ) {
        return res.status(400).json({
          error: "Ingresá correo y contraseña"
        });
      }

      const usuario = await prisma.usuario.findUnique({
        where: { email: email.trim().toLowerCase() }
      });

      if (!usuario) {
        return res.status(401).json({
          error: "Correo o contraseña incorrectos"
        });
      }

      const passwordValida = await bcrypt.compare(
        password,
        usuario.password
      );

      if (!passwordValida) {
        return res.status(401).json({
          error: "Correo o contraseña incorrectos"
        });
      }

      const token = jwt.sign(
        { id: usuario.id },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      return res.json({
        mensaje: "Inicio de sesión correcto",
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email
        }
      });

    } catch (error) {
      console.error("Error en login:", error);

      return res.status(500).json({
        error: "Error interno del servidor"
      });
    }
  });

  // VERIFICAR USUARIO AUTENTICADO
  router.get("/perfil", async (req, res) => {
    try {
      const authorization = req.headers.authorization || "";
      const [tipo, token] = authorization.split(" ");

      if (tipo !== "Bearer" || !token) {
        return res.status(401).json({
          error: "Token requerido"
        });
      }

      const datos = jwt.verify(token, process.env.JWT_SECRET);

      const usuario = await prisma.usuario.findUnique({
        where: { id: datos.id },
        select: {
          id: true,
          nombre: true,
          email: true
        }
      });

      if (!usuario) {
        return res.status(401).json({
          error: "Usuario no válido"
        });
      }

      return res.json(usuario);

    } catch (error) {
      return res.status(401).json({
        error: "Sesión inválida o expirada"
      });
    }
  });

  return router;
}

module.exports = { crearRutasUsuarios };
