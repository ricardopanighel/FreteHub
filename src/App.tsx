import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Home } from "./pages/Home";
import { Catalog } from "./pages/Catalog";
import { ProviderProfile } from "./pages/ProviderProfile";
import { ProviderRegister } from "./pages/ProviderRegister";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AdminDashboard } from "./pages/AdminDashboard";
import { MyFreights } from "./pages/MyFreights";
import { RequestFreight } from "./pages/RequestFreight";
import { NotFound } from "./pages/NotFound";
import { DriverDashboard } from "./pages/DriverDashboard";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalogo" element={<Catalog />} />
        <Route path="motorista/:id" element={<ProviderProfile />} />
        <Route path="prestador/:id" element={<LegacyProviderRedirect />} />
        <Route path="seja-motorista" element={<ProviderRegister />} />
        <Route path="seja-prestador" element={<Navigate to="/seja-motorista" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="cadastro" element={<Register />} />
        <Route
          path="solicitar"
          element={
            <ProtectedRoute roles={["CLIENTE"]}>
              <RequestFreight />
            </ProtectedRoute>
          }
        />
        <Route
          path="meus-fretes"
          element={
            <ProtectedRoute roles={["CLIENTE"]}>
              <MyFreights />
            </ProtectedRoute>
          }
        />
        <Route path="painel-motorista" element={<ProtectedRoute roles={["MOTORISTA"]}><DriverDashboard /></ProtectedRoute>} />
        <Route
          path="admin"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function LegacyProviderRedirect() {
  const { id } = useParams();
  return <Navigate to={`/motorista/${id}`} replace />;
}
