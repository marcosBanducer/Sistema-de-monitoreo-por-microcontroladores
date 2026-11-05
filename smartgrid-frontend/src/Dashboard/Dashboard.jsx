
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const { instalacionId } = useParams();

  const [mediciones, setMediciones] = useState([]);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  // ==========================================
  // CONSULTAR Y ACTUALIZAR MEDICIONES
  // ==========================================

  useEffect(() => {
    let activo = true;
    let consultando = false;

    setCargando(true);
    setMediciones([]);
    setError(null);

    const obtenerMediciones = async () => {
      if (!activo || consultando) return;

      consultando = true;

      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          throw new Error(
            "Debes iniciar sesión para ver las mediciones"
          );
        }

        const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

const url = instalacionId
  ? `${API_URL}/api/instalaciones/${instalacionId}/mediciones`
  : `${API_URL}/api/mediciones`;
        const respuesta = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (respuesta.status === 401) {
          throw new Error(
            "Tu sesión expiró. Iniciá sesión nuevamente."
          );
        }

        if (!respuesta.ok) {
          throw new Error(
            "No se pudieron consultar las mediciones"
          );
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos)) {
          throw new Error(
            "La API devolvió un formato inesperado"
          );
        }

        if (activo) {
          setMediciones(datos);
          setError(null);
        }
      } catch (err) {
        console.error(err);

        if (activo) {
          setError(err.message);
        }
      } finally {
        consultando = false;

        if (activo) {
          setCargando(false);
        }
      }
    };

    obtenerMediciones();

    const intervalo = setInterval(
      obtenerMediciones,
      5000
    );

    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, [instalacionId]);

  // ==========================================
  // FORMATEAR VALORES
  // ==========================================

  const numeroValido = (valor) => {
    if (valor === null || valor === undefined || valor === "") {
      return null;
    }

    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : null;
  };

  const mostrarWatts = (valor) => {
    const numero = numeroValido(valor);

    return numero === null
      ? "--"
      : `${numero.toFixed(2)} W`;
  };

  const mostrarUnidad = (valor, unidad) => {
    const numero = numeroValido(valor);

    return numero === null
      ? "--"
      : `${numero.toFixed(2)} ${unidad}`;
  };

  const obtenerFecha = (medicion) =>
    medicion.fechaHora ?? medicion.createdAt;

  const formatearFecha = (medicion) => {
    const fecha = new Date(obtenerFecha(medicion));

    return Number.isNaN(fecha.getTime())
      ? "Fecha no disponible"
      : fecha.toLocaleString("es-AR");
  };

  // ==========================================
  // ORDENAR MEDICIONES
  // ==========================================

  const medicionesOrdenadas = [...mediciones].sort(
    (a, b) =>
      new Date(obtenerFecha(b)) -
      new Date(obtenerFecha(a))
  );

  const ultimaMedicion = medicionesOrdenadas[0] ?? null;

  // Última medición con consumo simulado válido.
  // Se utiliza para evitar interpretar datos
  // históricos incompletos como consumos reales.
  const ultimaConBalance = medicionesOrdenadas.find(
    (medicion) =>
      medicion.origenConsumo === "SIMULADO" &&
      numeroValido(medicion.consumo) !== null &&
      numeroValido(medicion.excedente) !== null &&
      numeroValido(medicion.deficit) !== null
  );

  // ==========================================
  // DATOS DEL GRÁFICO
  // ==========================================

  const datosGrafico = [...medicionesOrdenadas]
    .reverse()
    .slice(-50)
    .map((medicion) => {
      const fecha = new Date(obtenerFecha(medicion));

      const tieneSimulacion =
        medicion.origenConsumo === "SIMULADO";

      return {
        hora: Number.isNaN(fecha.getTime())
          ? "--"
          : fecha.toLocaleTimeString("es-AR"),

        Generacion: numeroValido(medicion.potencia),

        Consumo: tieneSimulacion
          ? numeroValido(medicion.consumo)
          : null,

        Excedente: tieneSimulacion
          ? numeroValido(medicion.excedente)
          : null
      };
    });

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="dashboard">

      {instalacionId && (
        <div className="dashboard-volver">
          <button
            type="button"
            className="btn-volver-instalaciones"
            onClick={() => navigate("/instalaciones")}
          >
            ← Volver a mis instalaciones
          </button>
        </div>
      )}

      <section className="estado">
        <span className="indicador"></span>

        {error
          ? "Error al consultar mediciones"
          : cargando
          ? "Consultando mediciones..."
          : "Mediciones actualizadas"}
      </section>

      {error && (
        <div className="error">
          ⚠️ {error}
        </div>
      )}

      {/* VARIABLES ELÉCTRICAS */}

      <h2>Monitoreo de generación fotovoltaica</h2>

      <section className="cards">

        <div className="card">
          <h3>⚡ Tensión</h3>
          <strong>
            {mostrarUnidad(
              ultimaMedicion?.tension,
              "V"
            )}
          </strong>
        </div>

        <div className="card">
          <h3>🔌 Corriente</h3>
          <strong>
            {mostrarUnidad(
              ultimaMedicion?.corriente,
              "A"
            )}
          </strong>
        </div>

        <div className="card">
          <h3>☀️ Generación</h3>
          <strong>
            {mostrarWatts(
              ultimaMedicion?.potencia
            )}
          </strong>
        </div>

      </section>

      {/* BALANCE ENERGÉTICO */}

      <h2>Balance de potencia</h2>

      <p>
        Consumo simulado y excedentes estimados
        a partir de las mediciones del sistema.
      </p>

      <section className="cards">

        <div className="card">
          <h3>🏠 Consumo simulado</h3>
          <strong>
            {mostrarWatts(
              ultimaConBalance?.consumo
            )}
          </strong>
        </div>

        <div className="card">
          <h3>🟢 Excedente estimado</h3>
          <strong>
            {mostrarWatts(
              ultimaConBalance?.excedente
            )}
          </strong>
        </div>

        <div className="card">
          <h3>🔴 Déficit estimado</h3>
          <strong>
            {mostrarWatts(
              ultimaConBalance?.deficit
            )}
          </strong>
        </div>

      </section>

      {ultimaConBalance && (
        <p>
          Último balance simulado:{" "}
          {formatearFecha(ultimaConBalance)}
        </p>
      )}

      {/* GRÁFICO COMPARATIVO */}

      <section
        className="historial"
        style={{
          marginBottom: "30px",
          height: "400px"
        }}
      >
        <h2>
          Generación, consumo y excedente (W)
        </h2>

        <ResponsiveContainer
          width="100%"
          height="85%"
        >
          <LineChart data={datosGrafico}>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
            />

            <XAxis
              dataKey="hora"
              stroke="#6b7280"
              minTickGap={25}
            />

            <YAxis
              stroke="#6b7280"
              unit=" W"
            />

            <Tooltip />

            <Legend />

            <Line
              type="monotone"
              dataKey="Generacion"
              name="Generación"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="Consumo"
              name="Consumo simulado"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="Excedente"
              name="Excedente estimado"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />

          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* HISTORIAL */}

      <section className="historial">

        <h2>Últimas mediciones</h2>

        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nodo</th>
                <th>Tensión</th>
                <th>Corriente</th>
                <th>Generación</th>
                <th>Consumo</th>
                <th>Excedente</th>
                <th>Déficit</th>
                <th>Origen</th>
                <th>Fecha y hora</th>
              </tr>
            </thead>

            <tbody>
              {medicionesOrdenadas.map((medicion) => {
                const esSimulada =
                  medicion.origenConsumo === "SIMULADO";

                return (
                  <tr key={medicion.id}>
                    <td>{medicion.id}</td>
                    <td>{medicion.nodo}</td>

                    <td>
                      {mostrarUnidad(
                        medicion.tension,
                        "V"
                      )}
                    </td>

                    <td>
                      {mostrarUnidad(
                        medicion.corriente,
                        "A"
                      )}
                    </td>

                    <td>
                      {mostrarWatts(
                        medicion.potencia
                      )}
                    </td>

                    <td>
                      {esSimulada
                        ? mostrarWatts(medicion.consumo)
                        : "--"}
                    </td>

                    <td>
                      {esSimulada
                        ? mostrarWatts(medicion.excedente)
                        : "--"}
                    </td>

                    <td>
                      {esSimulada
                        ? mostrarWatts(medicion.deficit)
                        : "--"}
                    </td>

                    <td>
                      {medicion.origenConsumo ?? "Sin dato"}
                    </td>

                    <td>
                      {formatearFecha(medicion)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {mediciones.length === 0 &&
          !error &&
          !cargando && (
            <p>No hay mediciones registradas.</p>
          )}

      </section>
    </div>
  );
}
