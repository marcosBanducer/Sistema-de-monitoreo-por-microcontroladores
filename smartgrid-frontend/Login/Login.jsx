
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Por favor, completá todos los campos.");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(
        "http://localhost:3000/api/usuarios/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "Correo o contraseña incorrectos"
        );
      }

      if (!datos.token) {
        throw new Error("No se recibió el token de autenticación");
      }

      sessionStorage.setItem("token", datos.token);

      navigate("/dashboard", { replace: true });

    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">

        <div className="login-logo">☀️</div>

        <h1>SmartGrid</h1>

        <p className="login-subtitulo">
          Iniciá sesión para monitorear tus
          instalaciones fotovoltaicas.
        </p>

        {error && (
          <div className="login-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="email">
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              placeholder="Ingresá tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={cargando}
          >
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </button>

        </form>

        <div className="registro-link">
          <p>¿Todavía no tenés una cuenta?</p>

          <button
            type="button"
            onClick={() => navigate("/registro")}
          >
            Crear cuenta
          </button>
        </div>

      </div>
    </div>
  );
}
