import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import POS from './pages/POS';
import Admin from './pages/Admin';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<POS />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
