import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import Workers from "./pages/Workers";
import WorkerDetails from "./pages/WorkerDetails";
import Categories from "./pages/Categories";
import Designs from "./pages/Designs";
import RateTypes from "./pages/RateTypes";
import ProductRates from "./pages/ProductRates";
import WorkEntries from "./pages/WorkEntries";
import Payments from "./pages/Payments";
import ReadyStock from "./pages/ReadyStock";
import Showrooms from "./pages/Showrooms";
import Shipments from "./pages/Shipments";
import Reports from "./pages/Reports";
import WorkerStatements from "./pages/reports/WorkerStatements";
import WorkerSummary from "./pages/reports/WorkerSummary";
import PaymentSummary from "./pages/reports/PaymentSummary";
import ProductionReport from "./pages/reports/ProductionReport";
import ShipmentReport from "./pages/reports/ShipmentReport";
import ShowroomShipmentHistory from "./pages/reports/ShowroomShipmentHistory";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workers"
          element={
            <ProtectedRoute>
              <Workers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workers/:id"
          element={
            <ProtectedRoute>
              <WorkerDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/categories"
          element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/designs"
          element={
            <ProtectedRoute>
              <Designs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/rate-types"
          element={
            <ProtectedRoute>
              <RateTypes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/product-rates"
          element={
            <ProtectedRoute>
              <ProductRates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-entries"
          element={
            <ProtectedRoute>
              <WorkEntries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ready-stock"
          element={
            <ProtectedRoute>
              <ReadyStock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/showrooms"
          element={
            <ProtectedRoute>
              <Showrooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipments"
          element={
            <ProtectedRoute>
              <Shipments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/worker-statements"
          element={
            <ProtectedRoute>
              <WorkerStatements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/worker-summary"
          element={
            <ProtectedRoute>
              <WorkerSummary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/payment-summary"
          element={
            <ProtectedRoute>
              <PaymentSummary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/production"
          element={
            <ProtectedRoute>
              <ProductionReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/shipments"
          element={
            <ProtectedRoute>
              <ShipmentReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/showroom-shipments"
          element={
            <ProtectedRoute>
              <ShowroomShipmentHistory />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
