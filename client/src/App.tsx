import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard } from "./shared/components/AuthGuard.js";
import { AppLayout } from "./shared/layout/AppLayout.js";
import { LoginPage } from "./features/auth/LoginPage.js";
import { RegisterPage } from "./features/auth/RegisterPage.js";
import { ParcelListPage } from "./features/parcels/ParcelListPage.js";
import { ParcelDetailPage } from "./features/parcels/ParcelDetailPage.js";
import { ParcelFormPage } from "./features/parcels/ParcelFormPage.js";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route path="/parcels" element={<ParcelListPage />} />
            <Route path="/parcels/new" element={<ParcelFormPage />} />
            <Route path="/parcels/:id" element={<ParcelDetailPage />} />
            <Route path="/parcels/:id/edit" element={<ParcelFormPage />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/parcels" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
