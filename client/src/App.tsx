import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard } from "./shared/components/AuthGuard.js";
import { AppLayout } from "./shared/layout/AppLayout.js";
import { LoginPage } from "./features/auth/LoginPage.js";
import { RegisterPage } from "./features/auth/RegisterPage.js";
import { DashboardPage } from "./features/dashboard/DashboardPage.js";
import { ReportsPage } from "./features/reports/ReportsPage.js";
import { ParcelListPage } from "./features/parcels/ParcelListPage.js";
import { ParcelDetailPage } from "./features/parcels/ParcelDetailPage.js";
import { ParcelFormPage } from "./features/parcels/ParcelFormPage.js";
import { CropListPage } from "./features/crops/CropListPage.js";
import { CropDetailPage } from "./features/crops/CropDetailPage.js";
import { CropFormPage } from "./features/crops/CropFormPage.js";
import { IrrigationListPage } from "./features/irrigations/IrrigationListPage.js";
import { IrrigationDetailPage } from "./features/irrigations/IrrigationDetailPage.js";
import { IrrigationFormPage } from "./features/irrigations/IrrigationFormPage.js";
import { HarvestListPage } from "./features/harvests/HarvestListPage.js";
import { HarvestDetailPage } from "./features/harvests/HarvestDetailPage.js";
import { HarvestFormPage } from "./features/harvests/HarvestFormPage.js";
import { InventoryListPage } from "./features/inventory/InventoryListPage.js";
import { InventoryDetailPage } from "./features/inventory/InventoryDetailPage.js";
import { InventoryFormPage } from "./features/inventory/InventoryFormPage.js";
import { CostsPage } from "./features/costs/CostsPage.js";
import { ProfilePage } from "./features/users/ProfilePage.js";

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
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reports" element={<ReportsPage />} />
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
            <Route path="/harvests" element={<HarvestListPage />} />
            <Route path="/harvests/new" element={<HarvestFormPage />} />
            <Route path="/harvests/:id" element={<HarvestDetailPage />} />
            <Route path="/harvests/:id/edit" element={<HarvestFormPage />} />
            <Route path="/inventory" element={<InventoryListPage />} />
            <Route path="/inventory/new" element={<InventoryFormPage />} />
            <Route path="/inventory/:id" element={<InventoryDetailPage />} />
            <Route path="/inventory/:id/edit" element={<InventoryFormPage />} />
            <Route path="/costs" element={<CostsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
