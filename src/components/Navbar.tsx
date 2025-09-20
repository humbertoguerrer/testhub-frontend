import { NavLink } from "react-router-dom";

const linkCls = ({ isActive }: { isActive: boolean }) =>
  "py-5 px-3 transition " +
  (isActive
    ? "text-blue-700 border-b-2 border-blue-700 font-semibold"
    : "text-gray-700 hover:text-blue-600");

export default function Navbar() {
  return (
    <nav className="bg-white shadow mb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex">
          {/* Logo + links */}
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
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
