import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegistroUsuario() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const registrarUsuario = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número"
      );
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(
        "http://localhost:3000/api/usuarios/registro",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre,
            email,
            password,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "Error al registrarse");
      }

      alert("Cuenta creada correctamente. Ahora podés iniciar sesión.");

      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="registro-usuario-page">
      <div className="registro-usuario-card">

        <div className="registro-usuario-header">
          <div className="registro-usuario-icono">☀️</div>

          <h1>Crear cuenta</h1>

          <p>
            Registrate para administrar tus instalaciones
            fotovoltaicas con SmartGrid.
          </p>
        </div>

        <form onSubmit={registrarUsuario}>

          <div className="registro-usuario-campo">
            <label>Nombre completo</label>

            <input
              type="text"
              placeholder="Ingresá tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="registro-usuario-campo">
            <label>Correo electrónico</label>

            <input
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="registro-usuario-campo">
            <label>Contraseña</label>

            <input
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="registro-usuario-campo">
            <label>Confirmar contraseña</label>

            <input
              type="password"
              placeholder="Repetí tu contraseña"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <div className="registro-usuario-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="registro-usuario-btn"
            disabled={cargando}
          >
            {cargando ? "Registrando..." : "Crear cuenta"}
          </button>

        </form>

        <div className="registro-usuario-footer">
          <p>¿Ya tenés una cuenta?</p>

          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Iniciar sesión
          </button>
        </div>

      </div>
    </div>
  );
}