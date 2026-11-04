
const express = require("express");
const { autenticar } = require("./middleware/auth");

function crearRutasInstalaciones(prisma) {
  const router = express.Router();

  // Todas las rutas requieren autenticación
  router.use(autenticar);

  function obtenerId(valor) {
    const id = Number(valor);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }

  // INSTALACIONES PROPIAS Y COMPARTIDAS
  router.get("/", async (req, res) => {
    try {
      const instalaciones = await prisma.instalacion.findMany({
        where: {
          OR: [
            { propietarioId: req.usuarioId },
            {
              accesos: {
                some: { usuarioId: req.usuarioId }
              }
            }
          ]
        },
        include: {
          nodos: true,
          propietario: {
            select: {
              id: true,
              nombre: true
            }
          }
        },
        orderBy: { fechaAlta: "desc" }
      });

      res.json(instalaciones);
    } catch (error) {
      console.error("Error consultando instalaciones:", error);
      res.status(500).json({
        error: "Error al consultar instalaciones"
      });
    }
  });

  // CREAR INSTALACIÓN ASOCIADA AL USUARIO
  router.post("/", async (req, res) => {
    try {
      const { nombre, ubicacion, descripcion } = req.body;

      if (
        typeof nombre !== "string" ||
        typeof ubicacion !== "string" ||
        !nombre.trim() ||
        !ubicacion.trim()
      ) {
        return res.status(400).json({
          error: "Nombre y ubicación son obligatorios"
        });
      }

      const instalacion = await prisma.instalacion.create({
        data: {
          nombre: nombre.trim(),
          ubicacion: ubicacion.trim(),
          descripcion:
            typeof descripcion === "string"
              ? descripcion.trim()
              : null,
          propietarioId: req.usuarioId
        }
      });

      res.status(201).json(instalacion);
    } catch (error) {
      console.error("Error creando instalación:", error);
      res.status(500).json({
        error: "Error al crear instalación"
      });
    }
  });

  // MEDICIONES DE UNA INSTALACIÓN
  router.get("/:id/mediciones", async (req, res) => {
    try {
      const id = obtenerId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error: "ID de instalación inválido"
        });
      }

      const instalacion = await prisma.instalacion.findFirst({
        where: {
          id,
          OR: [
            { propietarioId: req.usuarioId },
            {
              accesos: {
                some: { usuarioId: req.usuarioId }
              }
            }
          ]
        },
        include: {
          nodos: {
            select: { identificador: true }
          }
        }
      });

      if (!instalacion) {
        return res.status(404).json({
          error: "Instalación no encontrada o sin acceso"
        });
      }

      const identificadores = instalacion.nodos.map(
        (nodo) => nodo.identificador
      );

      const mediciones = await prisma.medicion.findMany({
        where: {
          nodo: { in: identificadores }
        },
        orderBy: { fechaHora: "desc" },
        take: 500
      });

      res.json(mediciones);
    } catch (error) {
      console.error("Error consultando mediciones:", error);
      res.status(500).json({
        error: "Error al consultar mediciones"
      });
    }
  });

  // LISTAR USUARIOS AUTORIZADOS - SOLO PROPIETARIO
  router.get("/:id/usuarios", async (req, res) => {
    try {
      const id = obtenerId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error: "ID inválido"
        });
      }

      const instalacion = await prisma.instalacion.findFirst({
        where: {
          id,
          propietarioId: req.usuarioId
        }
      });

      if (!instalacion) {
        return res.status(403).json({
          error: "Solo el propietario puede gestionar accesos"
        });
      }

      const accesos = await prisma.accesoInstalacion.findMany({
        where: { instalacionId: id },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        }
      });

      res.json(accesos);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Error al consultar usuarios"
      });
    }
  });

  // AUTORIZAR USUARIO POR EMAIL
  router.post("/:id/usuarios", async (req, res) => {
    try {
      const id = obtenerId(req.params.id);
      const { email } = req.body || {};

      if (!id || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          error: "Instalación o correo inválido"
        });
      }

      const instalacion = await prisma.instalacion.findFirst({
        where: {
          id,
          propietarioId: req.usuarioId
        }
      });

      if (!instalacion) {
        return res.status(403).json({
          error: "Solo el propietario puede autorizar usuarios"
        });
      }

      const usuario = await prisma.usuario.findUnique({
        where: {
          email: email.trim().toLowerCase()
        }
      });

      if (!usuario) {
        return res.status(404).json({
          error: "El usuario debe registrarse primero"
        });
      }

      if (usuario.id === req.usuarioId) {
        return res.status(400).json({
          error: "Ya eres propietario de esta instalación"
        });
      }

      const acceso = await prisma.accesoInstalacion.upsert({
        where: {
          usuarioId_instalacionId: {
            usuarioId: usuario.id,
            instalacionId: id
          }
        },
        update: {},
        create: {
          usuarioId: usuario.id,
          instalacionId: id
        }
      });

      res.status(201).json({
        mensaje: "Usuario autorizado correctamente",
        acceso
      });
    } catch (error) {
      console.error("Error autorizando usuario:", error);
      res.status(500).json({
        error: "Error al autorizar usuario"
      });
    }
  });

  // REVOCAR ACCESO
  router.delete("/:id/usuarios/:usuarioId", async (req, res) => {
    try {
      const id = obtenerId(req.params.id);
      const usuarioId = obtenerId(req.params.usuarioId);

      if (!id || !usuarioId) {
        return res.status(400).json({
          error: "Identificadores inválidos"
        });
      }

      const instalacion = await prisma.instalacion.findFirst({
        where: {
          id,
          propietarioId: req.usuarioId
        }
      });

      if (!instalacion) {
        return res.status(403).json({
          error: "Solo el propietario puede revocar accesos"
        });
      }

      await prisma.accesoInstalacion.deleteMany({
        where: {
          instalacionId: id,
          usuarioId
        }
      });

      res.json({
        mensaje: "Acceso revocado correctamente"
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Error al revocar acceso"
      });
    }
  });

  return router;
}

module.exports = { crearRutasInstalaciones };
