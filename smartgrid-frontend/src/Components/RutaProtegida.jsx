
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function RutaProtegida() {
  const [estado, setEstado] = useState("verificando");

  useEffect(() => {
    const token = sessionStorage.getItem("smartgrid_token");

    if (!token) {
      setEstado("invalido");
      return;
    }

    const controlador = new AbortController();

    fetch("http://localhost:3000/api/usuarios/perfil", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal: controlador.signal
    })
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("Sesión inválida");
        }
        setEstado("valido");
      })
      .catch((error) => {
        if (error.name === "AbortError") return;

        sessionStorage.removeItem("smartgrid_token");
        sessionStorage.removeItem("smartgrid_usuario");
        setEstado("invalido");
      });

    return () => controlador.abort();
  }, []);

  if (estado === "verificando") {
    return <p>Verificando sesión...</p>;
  }

  if (estado === "invalido") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
