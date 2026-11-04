import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API = "http://localhost:3000/api/mediciones";

const obtenerFecha = (medicion) =>
  medicion.createdAt ?? medicion.fechaHora;

const formatearFecha = (fecha) => {
  if (!fecha) return "Sin fecha";

  const valor = new Date(fecha);

  return Number.isNaN(valor.getTime())
    ? "Fecha inválida"
    : valor.toLocaleString("es-AR");
};

const formatearNumero = (valor, decimales = 2) => {
  const numero = Number(valor);

  return valor === null ||
    valor === undefined ||
    valor === "" ||
    !Number.isFinite(numero)
    ? "—"
    : numero.toFixed(decimales);
};

export default function HistorialMediciones() {
  const [mediciones, setMediciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [nodo, setNodo] = useState("todos");
  const [variable, setVariable] = useState("potencia");

const cargar = useCallback(async (signal) => {
  setCargando(true);
  setError("");

  try {
    const token = sessionStorage.getItem("token");

    if (!token) {
      throw new Error(
        "Debes iniciar sesión para consultar el historial"
      );
    }

    const respuesta = await fetch(
      "http://localhost:3000/api/mediciones",
      {
        signal,
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (respuesta.status === 401) {
      throw new Error(
        "Tu sesión expiró. Iniciá sesión nuevamente."
      );
    }

    if (!respuesta.ok) {
      throw new Error(
        `Error al consultar las mediciones: HTTP ${respuesta.status}`
      );
    }

    const datos = await respuesta.json();

    if (!Array.isArray(datos)) {
      throw new Error(
        "La API no devolvió una lista de mediciones"
      );
    }

    if (!signal?.aborted) {
      setMediciones(datos);
      setError("");
    }

  } catch (e) {
    if (e.name !== "AbortError") {
      setError(
        `No se pudo consultar el historial: ${e.message}`
      );
    }
  } finally {
    if (!signal?.aborted) {
      setCargando(false);
    }
  }
}, []);

  useEffect(() => {
    const controller = new AbortController();

    cargar(controller.signal);

    return () => controller.abort();
  }, [cargar]);

  // LISTA DE NODOS

  const nodos = useMemo(() => {
    return [
      ...new Set(
        mediciones
          .map((m) => m.nodo)
          .filter(Boolean)
      ),
    ].sort();
  }, [mediciones]);

  // FILTRAR MEDICIONES

  const filtradas = useMemo(() => {
    return mediciones
      .filter(
        (m) => nodo === "todos" || m.nodo === nodo
      )
      .sort(
        (a, b) =>
          new Date(obtenerFecha(a)) -
          new Date(obtenerFecha(b))
      );
  }, [mediciones, nodo]);

  // CONFIGURACIÓN DE VARIABLES

  
const variables = {
  tension: {
    nombre: "Tensión",
    unidad: "V",
    color: "#2563eb"
  },
  corriente: {
    nombre: "Corriente",
    unidad: "A",
    color: "#f59e0b"
  },
  potencia: {
    nombre: "Generación",
    unidad: "W",
    color: "#16a34a"
  },
  consumo: {
    nombre: "Consumo simulado",
    unidad: "W",
    color: "#f59e0b"
  },
  excedente: {
    nombre: "Excedente estimado",
    unidad: "W",
    color: "#10b981"
  },
  deficit: {
    nombre: "Déficit estimado",
    unidad: "W",
    color: "#dc2626"
  }
};


  const configuracion = variables[variable];

  // DATOS DEL GRÁFICO

  const datosGrafico = useMemo(() => {
    return filtradas
      .filter((m) => {
        const valor = m[variable];
        const fecha = obtenerFecha(m);

        return (
          valor !== null &&
          valor !== undefined &&
          valor !== "" &&
          Number.isFinite(Number(valor)) &&
          fecha &&
          !Number.isNaN(new Date(fecha).getTime())
        );
      })
      .map((m) => ({
        ...m,
        valor: Number(m[variable]),
        fechaGrafico: new Date(
          obtenerFecha(m)
        ).toLocaleString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        fechaCompleta: formatearFecha(
          obtenerFecha(m)
        ),
      }));
  }, [filtradas, variable]);

  // ESTADÍSTICAS

  const estadisticas = useMemo(() => {
    const valores = datosGrafico.map(
      (m) => m.valor
    );

    if (valores.length === 0) {
      return {
        minimo: 0,
        maximo: 0,
        promedio: 0,
      };
    }

    return {
      minimo: Math.min(...valores),
      maximo: Math.max(...valores),
      promedio:
        valores.reduce(
          (total, valor) => total + valor,
          0
        ) / valores.length,
    };
  }, [datosGrafico]);

  return (
    <section className="historial-page">

      {/* ENCABEZADO */}

      <div className="historial-encabezado">
        <div>
          <h2>📈 Histórico de mediciones</h2>

          <p>
            Consultá y analizá las mediciones
            registradas por los nodos ESP32
            de SmartGrid.
          </p>
        </div>

        <button
          type="button"
          className="historial-btn-actualizar"
          onClick={() => cargar()}
          disabled={cargando}
        >
          🔄 {cargando ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* FILTROS */}

      <div className="historial-filtros">

        <div className="historial-filtro">
          <label htmlFor="filtro-nodo">
            Nodo ESP32
          </label>

          <select
            id="filtro-nodo"
            value={nodo}
            onChange={(e) => setNodo(e.target.value)}
          >
            <option value="todos">
              Todos los nodos
            </option>

            {nodos.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="historial-filtro">
          <label htmlFor="filtro-variable">
            Variable
          </label>

          <select
            id="filtro-variable"
            value={variable}
            onChange={(e) =>
              setVariable(e.target.value)
            }
          >
            <option value="potencia">
              Potencia (W)
            </option>

            <option value="tension">
              Tensión (V)
            </option>

            <option value="corriente">
              Corriente (A)
            </option>
            <option value="consumo">
  Consumo simulado (W)
</option>

<option value="excedente">
  Excedente estimado (W)
</option>

<option value="deficit">
  Déficit estimado (W)
</option>
          </select>
        </div>

      </div>

      {/* ESTADOS */}

      {error && (
        <div
          className="historial-mensaje-error"
          role="alert"
        >
          ⚠️ {error}
        </div>
      )}

      {cargando && (
        <p className="historial-cargando">
          Cargando mediciones...
        </p>
      )}

      {!cargando &&
        !error &&
        filtradas.length === 0 && (
          <div className="historial-vacio">
            No hay mediciones disponibles
            para el nodo seleccionado.
          </div>
        )}

      {!cargando &&
        !error &&
        filtradas.length > 0 && (
          <>

            {/* TARJETAS ESTADÍSTICAS */}

            <div className="historial-estadisticas">

              <div className="historial-stat">
                <span>📊 Registros</span>

                <strong>
                  {filtradas.length}
                </strong>
              </div>

              <div className="historial-stat">
                <span>
                  ⬇️ {configuracion.nombre} mínima
                </span>

                <strong>
                  {formatearNumero(
                    estadisticas.minimo
                  )}{" "}
                  {configuracion.unidad}
                </strong>
              </div>

              <div className="historial-stat">
                <span>
                  ⬆️ {configuracion.nombre} máxima
                </span>

                <strong>
                  {formatearNumero(
                    estadisticas.maximo
                  )}{" "}
                  {configuracion.unidad}
                </strong>
              </div>

              <div className="historial-stat">
                <span>
                  📉 {configuracion.nombre} promedio
                </span>

                <strong>
                  {formatearNumero(
                    estadisticas.promedio
                  )}{" "}
                  {configuracion.unidad}
                </strong>
              </div>

            </div>

            {/* GRÁFICO */}

            <div className="historial-grafico-card">

              <h3>
                Evolución de {configuracion.nombre}
                {" "}({configuracion.unidad})
              </h3>

              {datosGrafico.length > 0 ? (
                <div className="historial-grafico">

                  <ResponsiveContainer
                    width="100%"
                    height={350}
                  >
                    <LineChart
                      data={datosGrafico}
                      margin={{
                        top: 20,
                        right: 25,
                        left: 5,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="fechaGrafico"
                        minTickGap={35}
                      />

                      <YAxis
                        domain={["auto", "auto"]}
                        unit={configuracion.unidad}
                      />

                      <Tooltip
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload
                            ?.fechaCompleta ?? ""
                        }
                        formatter={(valor) => [
                          `${formatearNumero(valor)} ${configuracion.unidad}`,
                          configuracion.nombre,
                        ]}
                      />

                      <Line
                        type="monotone"
                        dataKey="valor"
                        stroke={configuracion.color}
                        strokeWidth={3}
                        dot={datosGrafico.length <= 100}
                        activeDot={{ r: 6 }}
                        name={configuracion.nombre}
                      />

                    </LineChart>
                  </ResponsiveContainer>

                </div>
              ) : (
                <p>
                  No hay valores válidos para
                  representar esta variable.
                </p>
              )}

            </div>

            {/* TABLA */}

            <div className="historial-tabla-card">

              <h3>📋 Registro de mediciones</h3>

              <div className="historial-tabla-contenedor">

                <table className="historial-tabla">

                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nodo</th>
                      <th>Tensión</th>
                      <th>Corriente</th>
                      <th>Potencia</th>
                      <th>Fecha y hora</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[...filtradas]
                      .reverse()
                      .map((m, i) => (
                        <tr key={m.id ?? i}>

                          <td>{m.id ?? "—"}</td>

                          <td>{m.nodo ?? "—"}</td>

                          <td>
                            {formatearNumero(m.tension)} V
                          </td>

                          <td>
                            {formatearNumero(m.corriente)} A
                          </td>

                          <td>
                            {formatearNumero(m.potencia)} W
                          </td>

                          <td>
                            {formatearFecha(
                              obtenerFecha(m)
                            )}
                          </td>

                        </tr>
                      ))}
                  </tbody>

                </table>

              </div>
            </div>

          </>
        )}

    </section>
  );
}