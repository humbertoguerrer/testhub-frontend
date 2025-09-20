import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Pessoas from "./pages/Pessoas";
import Pedidos from "./pages/Pedidos";
import CadastroUsuario from "./pages/CadastroUsuario";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import PrivateRoute from "./auth/PrivateRoute";

function Shell() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {isAuthenticated && <Navbar />}

      <main className="p-6">
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<Login />} />

          {/* Protegidas */}
          <Route
            path="/pessoas"
            element={
              <PrivateRoute>
                <Pessoas />
              </PrivateRoute>
            }
          />
          <Route
            path="/pedidos"
            element={
              <PrivateRoute>
                <Pedidos />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios/novo"
            element={
              <PrivateRoute>
                <CadastroUsuario />
              </PrivateRoute>
            }
          />

          {/* Redirecionamentos */}
          <Route path="/" element={<Navigate to="/pessoas" replace />} />
          <Route path="*" element={<Navigate to="/pessoas" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
