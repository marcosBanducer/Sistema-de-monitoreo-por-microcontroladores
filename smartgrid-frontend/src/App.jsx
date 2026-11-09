
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./App.css";

import RegistroInstalacion from "./RegistroInstalacion";
import MisInstalaciones from "./MisInstalaciones";
import HistorialMediciones from "./HistorialMediciones";
import LandingPage from "./LandingPage/LandingPage";
import Login from "./Login/Login";
import Dashboard from "./Dashboard/Dashboard";
import MainLayout from "./Components/MainLayout";
import RegistroUsuario from "./RegistroUsuario/RegistroUsuario";
import RutaProtegida from "./Components/RutaProtegida";

function App() {
  return (
    <BrowserRouter>
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/registro" element={<RegistroUsuario />} />

    <Route element={<RutaProtegida />}>
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/instalaciones" element={<MisInstalaciones />} />
        <Route path="/instalaciones/nueva" element={<RegistroInstalacion />} />
        <Route path="/historial" element={<HistorialMediciones />} />
      </Route>

      <Route
        path="/instalaciones/:instalacionId/dashboard"
        element={<Dashboard />}
      />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>
  );
}

export default App;