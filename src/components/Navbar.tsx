import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const linkCls = ({ isActive }: { isActive: boolean }) =>
  "py-5 px-3 transition " +
  (isActive
    ? "text-blue-700 border-b-2 border-blue-700 font-semibold"
    : "text-gray-700 hover:text-blue-600");

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <nav className="bg-white shadow mb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Esquerda: logo + links */}
          <div className="flex space-x-4">
            <NavLink
              to="/pessoas"
              className="flex items-center py-5 px-2 text-gray-700 font-bold text-lg"
              end
            >
              TestHub
            </NavLink>

            <div className="flex items-center space-x-1">
              <NavLink to="/pessoas" className={linkCls} end>
                Pessoas
              </NavLink>
              <NavLink to="/pedidos" className={linkCls}>
                Pedidos
              </NavLink>
              <NavLink to="/usuarios/novo" className={linkCls}>
                Cadastrar usuário
              </NavLink>
            </div>
          </div>

          {/* Direita: ações */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-300"
              title="Sair"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
