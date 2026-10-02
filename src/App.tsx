import { Route, Routes } from "react-router-dom";
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

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalogo" element={<Catalog />} />
        <Route path="prestador/:id" element={<ProviderProfile />} />
        <Route path="seja-prestador" element={<ProviderRegister />} />
        <Route path="login" element={<Login />} />
        <Route path="cadastro" element={<Register />} />
        <Route
          path="solicitar"
          element={
            <ProtectedRoute>
              <RequestFreight />
            </ProtectedRoute>
          }
        />
        <Route
          path="meus-fretes"
          element={
            <ProtectedRoute>
              <MyFreights />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
