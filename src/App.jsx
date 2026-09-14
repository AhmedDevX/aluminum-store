import { Routes, Route, Navigate } from "react-router-dom";
import LoginRegister from "./pages/Auth/LoginRegister.jsx";
import Products from "./pages/Products/Products.jsx";
import ProductDetail from "./pages/ProductDetail/ProductDetail.jsx";
import MyRequests from "./pages/MyRequests/MyRequests.jsx";
import Chat from "./pages/Chat/Chat.jsx";
import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import About from "./pages/About/About.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRegister />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:productId" element={<ProductDetail />} />
      <Route
        path="/my-requests"
        element={
          <ProtectedRoute>
            <MyRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  );
}
