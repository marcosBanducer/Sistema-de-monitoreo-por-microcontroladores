
const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [tipo, token] = authorization.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Debes iniciar sesión"
    });
  }

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);

    if (!Number.isInteger(datos.id)) {
      return res.status(401).json({
        error: "Token inválido"
      });
    }

    req.usuarioId = datos.id;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Sesión inválida o expirada"
    });
  }
}

module.exports = { autenticar };
