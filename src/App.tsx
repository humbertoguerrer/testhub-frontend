import { Routes, Route, Link } from 'react-router-dom';
import Pessoas from './pages/Pessoas';
import Pedidos from './pages/Pedidos';

function App() {
  return (
    <div style={{ padding: '2rem' }}>
      <nav style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>Pessoas</Link>
        <Link to="/pedidos">Pedidos</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Pessoas />} />
        <Route path="/pedidos" element={<Pedidos />} />
      </Routes>
    </div>
  );
}

export default App;
