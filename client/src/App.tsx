import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard } from "./shared/components/AuthGuard.js";
import { AppLayout } from "./shared/layout/AppLayout.js";
import { LandingPage } from "./features/landing/LandingPage.js";
import { LoginPage } from "./features/auth/LoginPage.js";
import { RegisterPage } from "./features/auth/RegisterPage.js";
import { DashboardPage } from "./features/dashboard/DashboardPage.js";
import { ReportsPage } from "./features/reports/ReportsPage.js";
import { CalendarPage } from "./features/calendar/CalendarPage.js";
import { AlertSettings } from "./features/alerts/AlertSettings.js";
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
import { MapPage } from "./features/map/MapPage.js";
import { ProfilePage } from "./features/users/ProfilePage.js";
import { PestListPage } from "./features/pests/PestListPage.js";
import { PestDetailPage } from "./features/pests/PestDetailPage.js";
import { PestFormPage } from "./features/pests/PestFormPage.js";
import { CuadernoCampo } from "./features/legal/CuadernoCampo.js";
import { ImportPage } from "./features/import/ImportPage.js";
import { NotFoundPage } from "./features/errors/NotFoundPage.js";

/** Redirects authenticated users to dashboard */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/alerts" element={<AlertSettings />} />
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
            <Route path="/pests" element={<PestListPage />} />
            <Route path="/pests/new" element={<PestFormPage />} />
            <Route path="/pests/:id" element={<PestDetailPage />} />
            <Route path="/pests/:id/edit" element={<PestFormPage />} />
            <Route path="/costs" element={<CostsPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/legal" element={<CuadernoCampo />} />
            <Route path="/import" element={<ImportPage />} />
          </Route>
        </Route>

        {/* 404 — must be last */}
        <Route path="*" element={<Navigate to="/404" replace />} />
        <Route path="/404" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
