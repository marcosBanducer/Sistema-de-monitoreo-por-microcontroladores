import React, { useState } from "react";

export default function Registro({ alRegistrar, alIrALogin }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre || !email || !password) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    setError("");
    alRegistrar(); // Simula el registro exitoso
  };

  return (
    <div className="dashboard" style={{ maxWidth: "450px", paddingTop: "50px" }}>
      <div className="card">
        <header style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1>Nuevo Usuario</h1>
          <p>Crea una cuenta para empezar a monitorear</p>
        </header>

        {error && <div className="error" style={{ fontSize: "14px" }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "14px", fontWeight: "bold", color: "#6b7280" }}>Nombre Completo</label>
            <input 
              type="text" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "15px" }}
              placeholder="Juan Pérez"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "14px", fontWeight: "bold", color: "#6b7280" }}>Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "15px" }}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "14px", fontWeight: "bold", color: "#6b7280" }}>Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "15px" }}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button 
            type="submit"
            style={{
              background: "#22c55e",
              color: "white",
              border: "none",
              padding: "12px",
              fontSize: "16px",
              fontWeight: "bold",
              borderRadius: "8px",
              cursor: "pointer",
              marginTop: "10px"
            }}
          >
            Registrarse
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#6b7280" }}>
          ¿Ya tenés cuenta?{" "}
          <span onClick={alIrALogin} style={{ color: "#3b82f6", cursor: "pointer", fontWeight: "bold" }}>
            Iniciá sesión
          </span>
        </p>
      </div>
    </div>
  );
}