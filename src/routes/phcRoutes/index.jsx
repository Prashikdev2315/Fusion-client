// Path: Fusion-client/src/routes/phcRoutes/index.jsx

import Appointments from "../../Modules/PHC/Appointments";
import Ambulance from "../../Modules/PHC/Ambulance";
import HealthProfile from "../../Modules/PHC/HealthProfile";
import Prescriptions from "../../Modules/PHC/Prescriptions";

// ── Staff (Compounder/PHC Staff) components ──────────────────────────────────
import StaffDashboard from "../../Modules/PHC/staff/StaffDashboard";
import PatientSearch from "../../Modules/PHC/staff/PatientSearch";
import DoctorManagement from "../../Modules/PHC/staff/DoctorManagement";
import InventoryManagement from "../../Modules/PHC/staff/InventoryManagement";
import RequisitionManagement from "../../Modules/PHC/staff/RequisitionManagement";
import ReimbursementProcessing from "../../Modules/PHC/staff/ReimbursementProcessing";
import AnnouncementBoard from "../../Modules/PHC/staff/AnnouncementBoard";
import AppointmentManagement from "../../Modules/PHC/staff/AppointmentManagement";
import AmbulanceLogger from "../../Modules/PHC/staff/AmbulanceLogger";
import RequisitionApproval from "../../Modules/PHC/staff/RequisitionApproval";
import RequisitionFulfillment from "../../Modules/PHC/staff/RequisitionFulfillment";
import ClaimApproval from "../../Modules/PHC/staff/ClaimApproval";
import { Navigate } from "react-router-dom";

// ── Legacy Compounder components ──────────────────────────────────────────────
import CompAppointments from "../../Modules/PHC/compounder/CompAppointments";
// Uncomment each import below as you complete each feature:
// import CompPrescriptions   from "../../Modules/PHC/compounder/CompPrescriptions";
// import CompComplaints      from "../../Modules/PHC/compounder/CompComplaints";
// import CompStock           from "../../Modules/PHC/compounder/CompStock";
// import CompAdmissions      from "../../Modules/PHC/compounder/CompAdmissions";
// import CompAmbulance       from "../../Modules/PHC/compounder/CompAmbulance";
// import CompDoctors         from "../../Modules/PHC/compounder/CompDoctors";
// import CompSchedules       from "../../Modules/PHC/compounder/CompSchedules";
// import CompAttendance      from "../../Modules/PHC/compounder/CompAttendance";
// import CompReimbursements  from "../../Modules/PHC/compounder/CompReimbursements";

const phcRoutes = [
  // ── Existing patient routes (untouched) ─────────────────────────────────────
  { path: "/phc/appointments",   element: <Appointments /> },
  { path: "/phc/ambulance",      element: <Ambulance /> },
  { path: "/phc/health-profile", element: <HealthProfile /> },
  { path: "/phc/prescriptions",  element: <Prescriptions /> },

  // ── Staff (Compounder/PHC Staff) routes ──────────────────────────────────────
  { path: "/phc/staff/dashboard",           element: <StaffDashboard /> },
  { path: "/phc/staff/patients",            element: <PatientSearch /> },
  { path: "/phc/staff/doctors",             element: <DoctorManagement /> },
  { path: "/phc/staff/inventory",           element: <InventoryManagement /> },
  { path: "/phc/staff/requisitions",        element: <RequisitionManagement /> },
  { path: "/phc/staff/requisitions/create", element: <Navigate to="/phc/staff/requisitions" replace /> },
  { path: "/phc/staff/requisitions/approve", element: <RequisitionApproval /> },
  { path: "/phc/staff/requisitions/fulfill", element: <RequisitionFulfillment /> },
  { path: "/phc/staff/reimbursement",       element: <ReimbursementProcessing /> },
  { path: "/phc/staff/reimbursement/claims", element: <ClaimApproval /> },
  { path: "/phc/staff/announcements",       element: <AnnouncementBoard /> },
  { path: "/phc/staff/appointments",        element: <AppointmentManagement /> },
  { path: "/phc/staff/ambulance",           element: <AmbulanceLogger /> },

  // ── Legacy Compounder routes (backward compatibility) ────────────────────────
  { path: "/phc/compounder/appointments",   element: <CompAppointments /> },
  // Uncomment each line below as you complete each feature:
  // { path: "/phc/compounder/prescriptions",  element: <CompPrescriptions /> },
  // { path: "/phc/compounder/complaints",     element: <CompComplaints /> },
  // { path: "/phc/compounder/stock",          element: <CompStock /> },
  // { path: "/phc/compounder/admissions",     element: <CompAdmissions /> },
  // { path: "/phc/compounder/ambulance",      element: <CompAmbulance /> },
  // { path: "/phc/compounder/doctors",        element: <CompDoctors /> },
  // { path: "/phc/compounder/schedules",      element: <CompSchedules /> },
  // { path: "/phc/compounder/attendance",     element: <CompAttendance /> },
  // { path: "/phc/compounder/reimbursements", element: <CompReimbursements /> },
];

export default phcRoutes;