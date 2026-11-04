import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function MainLayout() {
  const navigate = useNavigate();

  return (
    <div className="app-layout">

      <header className="smart-header">
        <h1>☀️ Sistema de monitoreo</h1>

        <button
          className="btn-smartgrid btn-rojo"
          onClick={() => navigate("/")}
        >
          🚪 Cerrar sesión
        </button>
      </header>

      {/* MENÚ PRINCIPAL */}

      <nav className="smartgrid-menu">

        <NavLink
          to="/dashboard"
          className="smartgrid-menu-boton menu-dashboard"
        >
          <span className="menu-icono">📊</span>
          <strong>Dashboard</strong>
        </NavLink>

        <NavLink
          to="/instalaciones"
          className="smartgrid-menu-boton menu-instalaciones"
        >
          <span className="menu-icono">🏠</span>
          <strong>Mis instalaciones</strong>
        </NavLink>

        <NavLink
          to="/instalaciones/nueva"
          className="smartgrid-menu-boton menu-nueva"
        >
          <span className="menu-icono">➕</span>
          <strong>Nueva instalación</strong>
        </NavLink>

        <NavLink
          to="/historial"
          className="smartgrid-menu-boton menu-historial"
        >
          <span className="menu-icono">📈</span>
          <strong>Historial</strong>
        </NavLink>

      </nav>

      {/* CONTENIDO */}

      <main>
        <Outlet />
      </main>

    </div>
  );
}