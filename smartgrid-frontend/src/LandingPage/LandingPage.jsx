import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="dashboard"
      style={{ textAlign: "center", paddingTop: "60px" }}
    >
      <header>
        <h1 style={{ fontSize: "42px", color: "#1f2937" }}>
          Sistema de monitoreo y gestión de energía solar
        </h1>

        <p
          style={{
            fontSize: "18px",
            maxWidth: "600px",
            margin: "15px auto 30px"
          }}
        >
          Controlá variables críticas en tiempo real con gráficos
          dinámicos, alertas automáticas e historial estructurado
          para tu empresa.
        </p>
      </header>

      <div
        className="estado"
        style={{ display: "inline-flex", marginBottom: "40px" }}
      >
        <div className="indicador"></div>
        <span>Servidores activos y operando al 100%</span>
      </div>

      <div className="cards" style={{ margin: "20px 0 40px" }}>
        <div className="card">
          <h3>Tiempo Real</h3>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            Visualización instantánea de cada cambio en tus dispositivos.
          </p>
        </div>

        <div className="card">
          <h3>Gráficos Avanzados</h3>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            Análisis de tendencias mediante herramientas dinámicas
            e intuitivas.
          </p>
        </div>

        <div className="card">
          <h3>Alertas al Instante</h3>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            Notificaciones inmediatas ante cualquier anomalía
            crítica detectada.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate("/login")}
        style={{
          background: "#22c55e",
          color: "white",
          border: "none",
          padding: "12px 30px",
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "8px",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)"
        }}
      >
        Ingresar al Sistema
      </button>
    </div>
  );
}