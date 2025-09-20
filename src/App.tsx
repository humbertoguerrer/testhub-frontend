import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Pessoas from "./pages/Pessoas";
import Pedidos from "./pages/Pedidos";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="p-6">
        <Routes>
          {/* raiz sempre leva para /pessoas */}
          <Route path="/" element={<Navigate to="/pessoas" replace />} />
          <Route path="/pessoas" element={<Pessoas />} />
          <Route path="/pedidos" element={<Pedidos />} />
          {/* opcional: 404 */}
          {/* <Route path="*" element={<Navigate to="/pessoas" replace />} /> */}
        </Routes>
      </main>
    </div>
  );
}
