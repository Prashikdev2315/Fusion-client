import { createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Notifications } from "@mantine/notifications";
import { useSelector } from "react-redux";
import { Layout } from "./components/layout";
import Dashboard from "./Modules/Dashboard/dashboardNotifications";
import Profile from "./Modules/Dashboard/StudentProfile/profilePage";
import LoginPage from "./pages/login";
import ForgotPassword from "./pages/forgotPassword";
import AcademicPage from "./Modules/Academic/index";
import ValidateAuth from "./helper/validateauth";
import FacultyProfessionalProfile from "./Modules/facultyProfessionalProfile/facultyProfessionalProfile";
import InactivityHandler from "./helper/inactivityhandler";
import Examination from "./Modules/Examination/examination";
import Database from "./Modules/Database/database";
import ProgrammeCurriculumRoutes from "./Modules/Program_curriculum/programmCurriculum";
import NotFoundPage from "./components/NotFoundPage";

import Appointments from "./Modules/PHC/Appointments";
import HealthProfile from "./Modules/PHC/HealthProfile";
import Prescriptions from "./Modules/PHC/Prescriptions";
import CompAppointments from "./Modules/PHC/compounder/CompAppointments";
import PHCHome from "./Modules/PHC/PHCHome";
import Reimbursement from "./Modules/PHC/Reimbursement";
import ClaimApproval from "./Modules/PHC/staff/ClaimApproval";

// Staff (Compounder/PHC Staff) components
import StaffDashboard from "./Modules/PHC/staff/StaffDashboard";
import PatientSearch from "./Modules/PHC/staff/PatientSearch";
import DoctorManagement from "./Modules/PHC/staff/DoctorManagement";
import InventoryManagement from "./Modules/PHC/staff/InventoryManagement";
import RequisitionManagement from "./Modules/PHC/staff/RequisitionManagement";
import ReimbursementProcessing from "./Modules/PHC/staff/ReimbursementProcessing";
import AnnouncementBoard from "./Modules/PHC/staff/AnnouncementBoard";
import AppointmentManagement from "./Modules/PHC/staff/AppointmentManagement";
import AmbulanceLoggerUC11 from "./Modules/PHC/staff/AmbulanceLoggerUC11";
import Reports from "./Modules/PHC/staff/Reports";
import RequisitionApproval from "./Modules/PHC/staff/RequisitionApproval";
import AuditorActionHistory from "./Modules/PHC/auditor/AuditorActionHistory";

const theme = createTheme({
  breakpoints: {
    xxs: "300px",
    xs: "375px",
    sm: "768px",
    md: "992px",
    lg: "1200px",
    xl: "1408px",
  },
});

function StaffOnlyAmbulanceRoute({ children }) {
  const phcRole = useSelector((state) => state.user.phcRole);
  const selectedRole = useSelector((state) => state.user.role);

  const normalizedPhcRole = String(phcRole || "").toLowerCase();
  const normalizedRole = String(selectedRole || "").toLowerCase();
  const isProfessorView = normalizedRole === "professor";
  const isAuditorView = /(auditor|audit|accounts)/.test(normalizedRole) || normalizedPhcRole === "accounts";
  const isPHCStaff = normalizedPhcRole === "phc_staff" && !isProfessorView && !isAuditorView;

  if (!isPHCStaff) {
    return <Navigate to="/phc" replace />;
  }

  return children;
}

export default function App() {
  const location = useLocation();
  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-center" autoClose={2000} limit={1} />
      {location.pathname !== "/accounts/login" && <ValidateAuth />}
      {location.pathname !== "/accounts/login" && <InactivityHandler />}

      <Routes>
        <Route path="/" element={<Navigate to="/accounts/login" replace />} />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/academics"
          element={
            <Layout>
              <AcademicPage />
            </Layout>
          }
        />
        <Route
          path="/profile"
          element={
            <Layout>
              <Profile />
            </Layout>
          }
        />
        <Route
          path="/facultyprofessionalprofile/*"
          element={
            <Layout>
              <FacultyProfessionalProfile />
            </Layout>
          }
        />
        <Route
          path="/programme_curriculum/*"
          element={
            <div>
              <ProgrammeCurriculumRoutes />
            </div>
          }
        />

        <Route
          path="/phc"
          element={
            <Layout>
              <PHCHome />
            </Layout>
          }
        />
        <Route
          path="/phc/appointments"
          element={
            <Layout>
              <Appointments />
            </Layout>
          }
        />
        <Route
          path="/phc/ambulance"
          element={
            <Layout>
              <StaffOnlyAmbulanceRoute>
                <Navigate to="/phc/staff/ambulance" replace />
              </StaffOnlyAmbulanceRoute>
            </Layout>
          }
        />
        <Route
          path="/phc/ambulance/my-requests"
          element={
            <Layout>
              <Navigate to="/phc" replace />
            </Layout>
          }
        />
        <Route
          path="/phc/health-profile"
          element={
            <Layout>
              <HealthProfile />
            </Layout>
          }
        />
        <Route
          path="/phc/prescriptions"
          element={
            <Layout>
              <Prescriptions />
            </Layout>
          }
        />
        <Route
          path="/phc/compounder/appointments"
          element={
            <Layout>
              <CompAppointments />
            </Layout>
          }
        />
        <Route
          path="/phc/reimbursement"
          element={
            <Layout>
              <Reimbursement />
            </Layout>
          }
        />
        <Route
          path="/phc/reimbursement/claims"
          element={
            <Layout>
              <ClaimApproval />
            </Layout>
          }
        />

        {/* Staff (Compounder/PHC Staff) Routes */}
        <Route
          path="/phc/staff/dashboard"
          element={
            <Layout>
              <StaffDashboard />
            </Layout>
          }
        />
        <Route
          path="/phc/staff/patients"
          element={
            <Layout>
              <PatientSearch />
            </Layout>
          }
        />
        <Route
          path="/phc/staff/doctors"
          element={
            <Layout>
              <DoctorManagement />
            </Layout>
          }
        />
        <Route
          path="/phc/staff/inventory"
          element={
            <Layout>
              <InventoryManagement />
            </Layout>
          }
        />
        <Route
          path="/phc/staff/requisitions"
          element={
            <Layout>
              <RequisitionManagement />
            </Layout>
          }
        />
        <Route
          path="/phc/staff/requisitions/create"
          element={
            <Layout>
              <Navigate to="/phc/staff/requisitions" replace />
            </Layout>
          }
        />
        <Route
          path="/phc/staff/requisitions/approve"
          element={
            <Layout>
              <RequisitionApproval />
            </Layout>
          }
        />
        <Route
          path="/phc/staff/reimbursement"
          element={
            <Layout>
              <ReimbursementProcessing />
            </Layout>
          }
        />
        <Route
          path="/phc/staff/reports"
          element={
            <Layout>
              <Reports />
            </Layout>
          }
        />
        <Route
          path="/phc/staff/announcements"
          element={
            <Layout>
              <AnnouncementBoard />
            </Layout>
          }
        />
        <Route
          path="/phc/staff/appointments"
          element={
            <Layout>
              <AppointmentManagement />
            </Layout>
          }
        />
        <Route
          path="/phc/staff/ambulance"
          element={
            <Layout>
              <StaffOnlyAmbulanceRoute>
                <AmbulanceLoggerUC11 />
              </StaffOnlyAmbulanceRoute>
            </Layout>
          }
        />
        <Route
          path="/phc/auditor/action-history"
          element={
            <Layout>
              <AuditorActionHistory />
            </Layout>
          }
        />

        <Route path="/accounts/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ForgotPassword />} />
        <Route path="/examination/*" element={<Examination />} />
        <Route path="/database/*" element={<Database />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MantineProvider>
  );
}
