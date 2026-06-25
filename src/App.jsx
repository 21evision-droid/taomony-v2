import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './Layout';
import HarmonyResonance from './pages/HarmonyResonance';
import Home from './pages/Home';
import Login from './pages/Login';
import Meditate from './pages/Meditate';
import Profile from './pages/Profile';
import Sleep from './pages/Sleep';
import TaoWeight from './pages/TaoWeight';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="meditate" element={<Meditate />} />
            <Route path="sleep" element={<Sleep />} />
            <Route path="tao-weight" element={<TaoWeight />} />
            <Route path="harmony-resonance" element={<HarmonyResonance />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
