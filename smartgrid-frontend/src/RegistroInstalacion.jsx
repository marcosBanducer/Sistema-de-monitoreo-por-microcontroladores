import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegistroInstalacion({ onRegistrada }) {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  const registrar = async (e) => {
    e.preventDefault();

    if (guardando) return;

    setGuardando(true);
    setMensaje("");
    setTipoMensaje("");

    try {
      const respuesta = await fetch(
        "http://localhost:3000/api/instalaciones",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: nombre.trim(),
            ubicacion: ubicacion.trim(),
            descripcion: descripcion.trim(),
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "Error al registrar la instalación");
      }

      setMensaje("Instalación registrada correctamente.");
      setTipoMensaje("exito");

      setNombre("");
      setUbicacion("");
      setDescripcion("");

      if (onRegistrada) {
        onRegistrada(datos);
      }
    } catch (error) {
      setMensaje(error.message || "No se pudo registrar la instalación.");
      setTipoMensaje("error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="registro-instalacion-page">
      <div className="registro-instalacion-card">

        <div className="registro-instalacion-header">
          <span className="registro-instalacion-icono">☀️</span>

          <h2>Registrar instalación fotovoltaica</h2>

          <p>
            Completá los datos para incorporar una nueva instalación
            al sistema de monitoreo SmartGrid.
          </p>
        </div>

        <form
          onSubmit={registrar}
          className="registro-instalacion-form"
        >
          <div className="registro-campo">
            <label htmlFor="nombre-instalacion">
              Nombre de la instalación
            </label>

            <input
              id="nombre-instalacion"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej.: Paneles solares vivienda"
              required
              disabled={guardando}
            />
          </div>

          <div className="registro-campo">
            <label htmlFor="ubicacion-instalacion">
              Ubicación
            </label>

            <input
              id="ubicacion-instalacion"
              type="text"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Ej.: Balsa Las Perlas"
              required
              disabled={guardando}
            />
          </div>

          <div className="registro-campo">
            <label htmlFor="descripcion-instalacion">
              Descripción
            </label>

            <textarea
              id="descripcion-instalacion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describí las características de la instalación..."
              rows={5}
              disabled={guardando}
            />
          </div>

          {mensaje && (
            <div
              className={`registro-mensaje ${tipoMensaje}`}
              role="status"
            >
              {mensaje}
            </div>
          )}

          <div className="registro-botones">
            <button
              type="button"
              className="registro-btn-cancelar"
              onClick={() => navigate("/instalaciones")}
              disabled={guardando}
            >
              ← Volver
            </button>

            <button
              type="submit"
              className="registro-btn-guardar"
              disabled={guardando}
            >
              {guardando
                ? "⏳ Guardando..."
                : "☀️ Registrar instalación"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}