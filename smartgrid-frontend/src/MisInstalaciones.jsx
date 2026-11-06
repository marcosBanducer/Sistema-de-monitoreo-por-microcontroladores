
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:3000";
export default function MisInstalaciones() {
  const navigate = useNavigate();

  const [instalaciones, setInstalaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [seleccionada, setSeleccionada] = useState(null);

  // Administración de accesos
  const [administrando, setAdministrando] = useState(null);
  const [usuariosAutorizados, setUsuariosAutorizados] = useState([]);
  const [email, setEmail] = useState("");
  const [mensajeAcceso, setMensajeAcceso] = useState("");
  const [errorAcceso, setErrorAcceso] = useState("");
  const [cargandoAccesos, setCargandoAccesos] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // ==========================================
  // SOLICITUDES AUTENTICADAS
  // ==========================================

  async function solicitar(ruta, opciones = {}) {
    const token = sessionStorage.getItem("token");

    if (!token) {
      throw new Error("Debes iniciar sesión");
    }

    const respuesta = await fetch(`${API}${ruta}`, {
      ...opciones,
      headers: {
        ...(opciones.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...opciones.headers,
        Authorization: `Bearer ${token}`
      }
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        throw new Error(
          "Tu sesión expiró. Iniciá sesión nuevamente."
        );
      }

      throw new Error(
        datos.error || "No se pudo completar la operación"
      );
    }

    return datos;
  }

  // ==========================================
  // OBTENER INSTALACIONES
  // ==========================================

  useEffect(() => {
    let activo = true;

    async function cargarInstalaciones() {
      try {
        const datos = await solicitar("/api/instalaciones");

        if (!Array.isArray(datos)) {
          throw new Error(
            "La API no devolvió una lista de instalaciones"
          );
        }

        if (activo) {
          setInstalaciones(datos);
          setError("");
        }
      } catch (e) {
        if (activo) {
          setError(
            e.message || "Error de conexión con la API"
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarInstalaciones();

    return () => {
      activo = false;
    };
  }, []);

  // ==========================================
  // IDENTIFICAR AL PROPIETARIO
  // ==========================================

  // El backend devuelve propietarioId en cada instalación.
  // Para identificar al usuario actual necesitamos su ID.
  // Se obtiene del JWT que guardamos al iniciar sesión.
  // El backend sigue verificando todos los permisos.

  function obtenerUsuarioActualId() {
    const token = sessionStorage.getItem("token");

    if (!token) return null;

    try {
      const partes = token.split(".");
      if (partes.length !== 3) return null;

      const base64 = partes[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const payload = JSON.parse(
        atob(base64)
      );

      const id = Number(payload.id);

      return Number.isSafeInteger(id) && id > 0
        ? id
        : null;
    } catch {
      return null;
    }
  }

  const usuarioActualId = obtenerUsuarioActualId();

  function esPropietario(instalacion) {
    return (
      usuarioActualId !== null &&
      Number(instalacion.propietarioId) === usuarioActualId
    );
  }

  // ==========================================
  // MONITOREAR INSTALACIÓN
  // ==========================================

  function monitorearInstalacion(instalacion) {
    if (!instalacion?.id) return;

    navigate(
      `/instalaciones/${instalacion.id}/dashboard`
    );
  }

  // ==========================================
  // CONSULTAR USUARIOS AUTORIZADOS
  // ==========================================

  async function cargarUsuarios(instalacionId) {
    setCargandoAccesos(true);
    setErrorAcceso("");

    try {
      const datos = await solicitar(
        `/api/instalaciones/${instalacionId}/usuarios`
      );

      setUsuariosAutorizados(datos);
    } catch (e) {
      setErrorAcceso(e.message);
    } finally {
      setCargandoAccesos(false);
    }
  }

  async function abrirAdministracion(instalacion) {
    setAdministrando(instalacion);
    setSeleccionada(null);
    setUsuariosAutorizados([]);
    setEmail("");
    setMensajeAcceso("");
    setErrorAcceso("");

    await cargarUsuarios(instalacion.id);
  }

  function cerrarAdministracion() {
    setAdministrando(null);
    setUsuariosAutorizados([]);
    setEmail("");
    setMensajeAcceso("");
    setErrorAcceso("");
  }

  // ==========================================
  // AUTORIZAR USUARIO
  // ==========================================

  async function autorizarUsuario(evento) {
    evento.preventDefault();

    if (!administrando || !email.trim() || guardando) {
      return;
    }

    setGuardando(true);
    setErrorAcceso("");
    setMensajeAcceso("");

    try {
      const resultado = await solicitar(
        `/api/instalaciones/${administrando.id}/usuarios`,
        {
          method: "POST",
          body: JSON.stringify({
            email: email.trim().toLowerCase()
          })
        }
      );

      setMensajeAcceso(
        resultado.mensaje || "Usuario autorizado correctamente"
      );

      setEmail("");
      await cargarUsuarios(administrando.id);
    } catch (e) {
      setErrorAcceso(e.message);
    } finally {
      setGuardando(false);
    }
  }

  // ==========================================
  // REVOCAR ACCESO
  // ==========================================

  async function revocarAcceso(usuario) {
    if (!administrando || guardando) return;

    const confirmado = window.confirm(
      `¿Revocar el acceso de ${usuario.nombre} (${usuario.email})?`
    );

    if (!confirmado) return;

    setGuardando(true);
    setErrorAcceso("");
    setMensajeAcceso("");

    try {
      await solicitar(
        `/api/instalaciones/${administrando.id}/usuarios/${usuario.id}`,
        {
          method: "DELETE"
        }
      );

      setMensajeAcceso("Acceso revocado correctamente");
      await cargarUsuarios(administrando.id);
    } catch (e) {
      setErrorAcceso(e.message);
    } finally {
      setGuardando(false);
    }
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <section className="historial">

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12
        }}
      >
        <h2>☀️ Mis instalaciones fotovoltaicas</h2>

        <button
          type="button"
          className="btn-smartgrid btn-verde"
          onClick={() => navigate("/instalaciones/nueva")}
        >
          ➕ Nueva instalación
        </button>
      </div>

      {cargando && <p>Cargando instalaciones...</p>}

      {error && (
        <p role="alert">⚠️ {error}</p>
      )}

      {!cargando && !error && instalaciones.length === 0 && (
        <p>Todavía no hay instalaciones registradas.</p>
      )}

      {!cargando && !error && instalaciones.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: 16,
            marginTop: 16
          }}
        >
          {instalaciones.map((instalacion) => {
            const propietario = esPropietario(instalacion);

            return (
              <article
                key={instalacion.id}
                className="card"
                style={{ padding: 18 }}
              >
                <h3>☀️ {instalacion.nombre}</h3>

                <p>
                  <strong>Ubicación:</strong>{" "}
                  {instalacion.ubicacion}
                </p>

                {instalacion.descripcion && (
                  <p>{instalacion.descripcion}</p>
                )}

                <p>
                  <strong>Acceso:</strong>{" "}
                  {propietario
                    ? "Propietario"
                    : "Compartida conmigo"}
                </p>

                <p>
                  <small>
                    Registrada:{" "}
                    {instalacion.fechaAlta
                      ? new Date(
                          instalacion.fechaAlta
                        ).toLocaleDateString("es-AR")
                      : "Sin fecha"}
                  </small>
                </p>

                <div
                  className="acciones-instalacion"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8
                  }}
                >
                  <button
                    type="button"
                    className="btn-smartgrid btn-azul"
                    onClick={() => {
                      setSeleccionada(instalacion);
                      cerrarAdministracion();
                    }}
                  >
                    📋 Ver detalles
                  </button>

                  <button
                    type="button"
                    className="btn-smartgrid btn-verde"
                    onClick={() =>
                      monitorearInstalacion(instalacion)
                    }
                  >
                    📊 Monitorear
                  </button>

                  {propietario && (
                    <button
                      type="button"
                      className="btn-smartgrid btn-azul"
                      onClick={() =>
                        abrirAdministracion(instalacion)
                      }
                    >
                      👥 Administrar accesos
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* DETALLES */}

      {seleccionada && (
        <section
          style={{
            marginTop: 20,
            padding: 16,
            border: "1px solid #aaa",
            borderRadius: 8
          }}
        >
          <h3>Detalles de {seleccionada.nombre}</h3>

          <p><strong>ID:</strong> {seleccionada.id}</p>

          <p>
            <strong>Ubicación:</strong>{" "}
            {seleccionada.ubicacion}
          </p>

          <p>
            <strong>Descripción:</strong>{" "}
            {seleccionada.descripcion || "Sin descripción"}
          </p>

          <p>
            <strong>Nodos asociados:</strong>{" "}
            {seleccionada.nodos?.length ?? 0}
          </p>

          <button
            type="button"
            className="btn-smartgrid btn-gris"
            onClick={() => setSeleccionada(null)}
          >
            ✖ Cerrar detalles
          </button>
        </section>
      )}

      {/* ADMINISTRACIÓN DE ACCESOS */}

      {administrando && (
        <section
          className="historial"
          style={{
            marginTop: 24,
            padding: 20,
            border: "1px solid #cbd5e1",
            borderRadius: 10
          }}
        >
          <h2>
            👥 Administrar accesos
          </h2>

          <p>
            Instalación: <strong>{administrando.nombre}</strong>
          </p>

          <p>
            Los usuarios autorizados podrán consultar
            las mediciones y el balance de potencia.
          </p>

          <form onSubmit={autorizarUsuario}>
            <label htmlFor="email-acceso">
              Correo electrónico del usuario
            </label>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 8
              }}
            >
              <input
                id="email-acceso"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                required
                style={{
                  padding: 10,
                  flex: "1 1 220px",
                  borderRadius: 6,
                  border: "1px solid #aaa"
                }}
              />

              <button
                type="submit"
                className="btn-smartgrid btn-verde"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : "➕ Autorizar usuario"}
              </button>
            </div>
          </form>

          {mensajeAcceso && (
            <p role="status" style={{ color: "#15803d" }}>
              ✅ {mensajeAcceso}
            </p>
          )}

          {errorAcceso && (
            <p role="alert" style={{ color: "#dc2626" }}>
              ⚠️ {errorAcceso}
            </p>
          )}

          <h3 style={{ marginTop: 24 }}>
            Usuarios autorizados
          </h3>

          {cargandoAccesos ? (
            <p>Cargando usuarios...</p>
          ) : usuariosAutorizados.length === 0 ? (
            <p>No hay usuarios autorizados todavía.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Permiso</th>
                    <th>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosAutorizados.map((acceso) => (
                    <tr key={acceso.id}>
                      <td>{acceso.usuario.nombre}</td>
                      <td>{acceso.usuario.email}</td>
                      <td>Lectura</td>
                      <td>
                        <button
                          type="button"
                          className="btn-smartgrid btn-gris"
                          disabled={guardando}
                          onClick={() =>
                            revocarAcceso(acceso.usuario)
                          }
                        >
                          Revocar acceso
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            type="button"
            className="btn-smartgrid btn-gris"
            style={{ marginTop: 20 }}
            onClick={cerrarAdministracion}
          >
            ✖ Cerrar administración
          </button>
        </section>
      )}

    </section>
  );
}
