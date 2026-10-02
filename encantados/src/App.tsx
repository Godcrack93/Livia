import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Encantados } from "./pages/Encantados";
import { Home } from "./pages/Home";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/encantados" element={<Encantados />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
