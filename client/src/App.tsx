import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard } from "./shared/components/AuthGuard.js";
import { AppLayout } from "./shared/layout/AppLayout.js";
import { LoginPage } from "./features/auth/LoginPage.js";
import { RegisterPage } from "./features/auth/RegisterPage.js";
import { ParcelListPage } from "./features/parcels/ParcelListPage.js";
import { ParcelDetailPage } from "./features/parcels/ParcelDetailPage.js";
import { ParcelFormPage } from "./features/parcels/ParcelFormPage.js";
import { CropListPage } from "./features/crops/CropListPage.js";
import { CropDetailPage } from "./features/crops/CropDetailPage.js";
import { CropFormPage } from "./features/crops/CropFormPage.js";
import { IrrigationListPage } from "./features/irrigations/IrrigationListPage.js";
import { IrrigationDetailPage } from "./features/irrigations/IrrigationDetailPage.js";
import { IrrigationFormPage } from "./features/irrigations/IrrigationFormPage.js";

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
            <Route path="/crops" element={<CropListPage />} />
            <Route path="/crops/new" element={<CropFormPage />} />
            <Route path="/crops/:id" element={<CropDetailPage />} />
            <Route path="/crops/:id/edit" element={<CropFormPage />} />
            <Route path="/irrigations" element={<IrrigationListPage />} />
            <Route path="/irrigations/new" element={<IrrigationFormPage />} />
            <Route path="/irrigations/:id" element={<IrrigationDetailPage />} />
            <Route path="/irrigations/:id/edit" element={<IrrigationFormPage />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/parcels" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
