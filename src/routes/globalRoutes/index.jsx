export const host = "http://127.0.0.1:8000";

export const authRoute = `${host}/api/auth/me`;
export const loginRoute = `${host}/api/auth/login/`;
export const mediaRoute = `${host}/media/`;

// PHC API routes
export const phcAppointmentsRoute = `${host}/phc/api/appointments/`;
export const phcAmbulanceRoute = `${host}/phc/api/ambulance/`;
export const phcHealthProfileRoute = `${host}/phc/api/health-profile/`;
export const phcPrescriptionsRoute = `${host}/phc/api/prescriptions/`;
export const phcCompAppointmentsRoute = `${host}/phc/api/compounder/appointments/`;
export const phcCreateUserRoute = `${host}/phc/users/create/`;
export const phcUsersRoute = `${host}/phc/users/`;

// PHC Appointment & Visit Management
export const phcDoctorAvailabilityRoute = `${host}/phc/doctors/availability/`;
export const phcAppointmentBookRoute = `${host}/phc/appointments/book/`;
export const phcMyAppointmentsRoute = `${host}/phc/appointments/my/`;
export const phcStaffAppointmentsRoute = `${host}/phc/appointments/`;
export const phcCreateVisitRoute = `${host}/phc/visit/create/`;
export const phcMyVisitsRoute = `${host}/phc/visits/my/`;
export const phcDoctorsRoute = `${host}/phc/doctors/`;
export const phcMedicalRecordsRoute = `${host}/phc/medical-records/`;
export const phcMedicalRecordsDownloadRoute = `${host}/phc/medical-records/download/`;
export const phcReimbursementApplyRoute = `${host}/phc/reimbursement/apply/`;
export const phcReimbursementStatusRoute = `${host}/phc/reimbursement/status/`;
