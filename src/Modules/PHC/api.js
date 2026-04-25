import axios from "axios";
import {
  host,
  phcAppointmentsRoute,
  phcAmbulanceRoute,
  phcHealthProfileRoute,
  phcPrescriptionsRoute,
  phcCreateUserRoute,
  phcUsersRoute,
  phcDoctorAvailabilityRoute,
  phcAppointmentBookRoute,
  phcMyAppointmentsRoute,
  phcStaffAppointmentsRoute,
  phcCreateVisitRoute,
  phcMyVisitsRoute,
  phcDoctorsRoute,
  phcMedicalRecordsRoute,
  phcMedicalRecordsDownloadRoute,
  phcReimbursementApplyRoute,
  phcReimbursementStatusRoute,
} from "../../routes/globalRoutes";
import { getValidAuthToken } from "../../helper/sessionManager";

const getAuthToken = () => {
  return getValidAuthToken();
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    if (typeof window !== "undefined" && window.location.pathname !== "/accounts/login") {
      window.location.replace("/accounts/login");
    }
    throw new Error("Authentication token missing");
  }
  return { Authorization: `Token ${token}` };
};

// ---- Appointments ----
export const getAppointments = async (patientId) => {
  const { data } = await axios.get(phcMyAppointmentsRoute, {
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

export const createAppointment = async (payload) => {
  const requestPayload = {
    doctor_id: payload?.doctor_id,
    date: payload?.appointment_date || payload?.date,
    time_slot: payload?.appointment_time || payload?.time_slot,
  };

  const { data } = await axios.post(phcAppointmentBookRoute, requestPayload, {
    headers: getAuthHeaders(),
  });
  return data;
};

export const getDoctorAvailability = async (params = {}) => {
  const { data } = await axios.get(phcDoctorAvailabilityRoute, {
    params,
    headers: getAuthHeaders(),
  });
  return data?.data || { availability: [] };
};

export const getDoctors = async () => {
  const { data } = await axios.get(phcDoctorsRoute, {
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

export const getStaffAppointments = async () => {
  const { data } = await axios.get(phcStaffAppointmentsRoute, {
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

export const createVisit = async (payload) => {
  const { data } = await axios.post(phcCreateVisitRoute, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data;
};

// ---- Ambulance ----
export const getAmbulanceRequests = async (status) => {
  const { data } = await axios.get(phcAmbulanceRoute, {
    params: status ? { status } : {},
    headers: getAuthHeaders(),
  });
  if (Array.isArray(data)) {
    return data;
  }
  return data?.data || [];
};

export const createAmbulanceRequest = async (payload) => {
  const { data } = await axios.post(phcAmbulanceRoute, payload, {
    headers: getAuthHeaders(),
  });
  return data;
};

// ---- Health Profile ----
export const getHealthProfile = async (username) => {
  const { data } = await axios.get(phcHealthProfileRoute, {
    // Keep patient_id for backward compatibility with older endpoint implementations.
    params: { username, patient_id: username },
    headers: getAuthHeaders(),
  });
  return data;
};

// ---- Prescriptions ----
// Using getMedicalRecords() for all prescription/medical record retrieval
export const getPrescriptions = async () => {
  return getMedicalRecords();
};

export const getMedicalRecords = async () => {
  const { data } = await axios.get(phcMedicalRecordsRoute, {
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

export const downloadMedicalRecords = async () => {
  const response = await axios.get(phcMedicalRecordsDownloadRoute, {
    headers: getAuthHeaders(),
    responseType: "blob",
  });
  return response.data;
};

export const applyReimbursement = async (payload) => {
  const files = Array.isArray(payload?.documents) ? payload.documents : [];

  if (files.length) {
    const formData = new FormData();
    formData.append("amount", payload?.amount ?? "");
    formData.append("reason", payload?.reason ?? "");
    formData.append("expense_date", payload?.expense_date ?? "");
    files.forEach((file) => formData.append("documents", file));

    const { data } = await axios.post(phcReimbursementApplyRoute, formData, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return data;
  }

  const { data } = await axios.post(phcReimbursementApplyRoute, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data;
};

export const getReimbursementStatus = async () => {
  const { data } = await axios.get(phcReimbursementStatusRoute, {
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

// ===========================
// PHC STAFF (COMPOUNDER) APIs
// ===========================

const phcStaffBase = `${host}/phc/staff`;

// UC-06: Patient Records
export const searchPatient = async (query) => {
  const { data } = await axios.get(`${phcStaffBase}/patient/search/`, {
    params: { q: query },
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

export const getPatientHistory = async (patientId) => {
  const { data } = await axios.get(`${phcStaffBase}/patient/${patientId}/history/`, {
    headers: getAuthHeaders(),
  });
  return data?.data || {};
};

export const getPatientPendingAppointments = async (patientId) => {
  const { data } = await axios.get(`${phcStaffBase}/patient/${patientId}/appointments/pending/`, {
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

export const createEnhancedVisit = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/visit/create/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

export const getVisitDetail = async (visitId) => {
  const { data } = await axios.get(`${phcStaffBase}/visit/${visitId}/`, {
    headers: getAuthHeaders(),
  });
  return data?.data || {};
};

// UC-07: Doctor Schedule
export const createDoctor = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/doctor/create/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

export const updateDoctorSchedule = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/doctor/schedule/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

// UC-08: Doctor Attendance
export const markDoctorAttendance = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/doctor/attendance/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

// UC-07: Toggle Doctor Status
export const toggleDoctorStatus = async (doctorId) => {
  const { data } = await axios.post(`${phcStaffBase}/doctor/${doctorId}/toggle-status/`, {}, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

// Get doctors list for staff management
export const getDoctorsList = async (includeInactive = false) => {
  const { data } = await axios.get(`${phcStaffBase}/doctors/`, {
    params: { include_inactive: includeInactive },
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

// UC-09: Inventory Management
export const getInventory = async (lowStockOnly = false) => {
  const { data } = await axios.get(`${phcStaffBase}/inventory/`, {
    params: { low_stock: lowStockOnly },
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

export const getInventoryList = async () => {
  return getInventory(false);
};

export const getInventoryMedicines = async () => {
  return getInventory(false);
};

export const getLowStockAlerts = async () => {
  const { data } = await axios.get(`${phcStaffBase}/inventory/low-stock-alerts/`, {
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

export const acknowledgeLowStockAlert = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/inventory/low-stock-alerts/acknowledge/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

export const createMedicine = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/inventory/medicine/create/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

export const manageInventory = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/inventory/manage/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

// Get available medicines for staff (medicines with stock > 0)
export const getAvailableMedicines = async () => {
  const { data } = await axios.get(`${phcStaffBase}/medicines/available/`, {
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

const buildMedicinesUsePayload = (payload = {}) => {
  const rawMedicines = Array.isArray(payload?.medicines) ? payload.medicines : [];

  const medicines = rawMedicines
    .map((medicine) => {
      const medicineId = Number(medicine?.medicine_id);
      const quantityValue = Number(medicine?.quantity);
      const normalizedQuantity = Math.floor(quantityValue);

      if (!Number.isFinite(medicineId) || medicineId <= 0) {
        return null;
      }
      if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
        return null;
      }

      // Keep backend contract strict and stable.
      return {
        medicine_id: medicineId,
        quantity: normalizedQuantity,
      };
    })
    .filter(Boolean);

  return {
    visit_id: payload?.visit_id ?? payload?.id,
    medicines,
  };
};

// Use medicines from prescription and reduce stock
export const useMedicinesFromPrescription = async (payload) => {
  const transformedPayload = buildMedicinesUsePayload(payload);
  const { data } = await axios.post(`${phcStaffBase}/medicines/use/`, transformedPayload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

// UC-10/UC-14: Requisition
export const createRequisition = async (payload) => {
  const items = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.items_data)
      ? payload.items_data
      : [];
  const requestedSupplies = Array.isArray(payload.requested_supplies)
    ? payload.requested_supplies
    : [];

  const transformedPayload = {
    items,
    requested_supplies: requestedSupplies,
    reason: payload.reason,
    notes: payload.notes,
  };
  const { data } = await axios.post(`${phcStaffBase}/requisition/create/`, transformedPayload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

export const getRequisitionsList = async () => {
  const { data } = await axios.get(`${phcStaffBase}/requisitions/`, {
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

export const approveRequisition = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/requisition/approve/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

export const fulfillRequisition = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/requisition/fulfill/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

// UC-8: Announcement Board
export const getAnnouncements = async () => {
  const { data } = await axios.get(`${phcStaffBase}/announcements/`, {
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

export const getPHCNotifications = async (limit = 50) => {
  const { data } = await axios.get(`${phcStaffBase}/notifications/`, {
    params: { limit },
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

export const triggerPHCNotification = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/notifications/trigger/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

export const getSystemReport = async (params) => {
  const { data } = await axios.get(`${phcStaffBase}/reports/`, {
    params,
    headers: getAuthHeaders(),
  });
  return data?.data || { summary: {}, rows: [] };
};

export const downloadSystemReportCsv = async (params) => {
  const response = await axios.get(`${phcStaffBase}/reports/`, {
    params: { ...params, format: 'csv' },
    headers: getAuthHeaders(),
    responseType: 'blob',
  });
  return response.data;
};

export const createAnnouncement = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/announcement/create/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

// UC-9: Appointment Management
export const getAppointmentsList = async () => {
  const { data } = await axios.get(`${host}/phc/api/staff/appointments/`, {
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

export const createAppointmentManagement = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/appointments/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

export const updateAppointmentStatus = async (payload) => {
  const { data } = await axios.post(`${host}/phc/api/staff/appointments/status/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

// UC-11: Ambulance Logging
export const createAmbulanceLog = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/ambulance/log/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

export const getAmbulanceLogs = async (params = {}) => {
  const { data } = await axios.get(`${host}/phc/ambulance/logs/`, {
    params,
    headers: getAuthHeaders(),
  });
  return data?.data || {};
};

export const updateAmbulanceRequestStatus = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/ambulance/request/status/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

// UC-11: Emergency Ambulance Trip Logging
export const logEmergencyAmbulanceTrip = async (payload) => {
  const { data } = await axios.post(`${host}/phc/ambulance/logs/create/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

export const updateAmbulanceAvailability = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/ambulance/availability/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

export const getAmbulanceAvailabilityStatus = async () => {
  const { data } = await axios.get(`${phcStaffBase}/ambulance/availability/`, {
    headers: getAuthHeaders(),
  });
  return data?.data || {};
};

// UC-14: Inventory Management
// Note: Use getInventory() for all inventory fetching

export const getReimbursementClaims = async (status) => {
  const { data } = await axios.get(`${phcStaffBase}/reimbursement/claims/`, {
    params: status ? { status } : {},
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

export const processReimbursement = async (payload) => {
  const { data } = await axios.post(`${phcStaffBase}/reimbursement/process/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

export const getReimbursementClaimsForStaff = async () => {
  return getReimbursementClaims();
};

export const processReimbursementClaim = async (payload) => {
  return processReimbursement(payload);
};

export const getAuditorPendingClaims = async (status) => {
  const { data } = await axios.get(`${host}/phc/reimbursement/pending/`, {
    params: status ? { status } : {},
    headers: getAuthHeaders(),
  });
  return data?.data || [];
};

export const verifyAuditorClaim = async (payload) => {
  const { data } = await axios.post(`${host}/phc/reimbursement/verify/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

export const updateAuditorClaimStatus = async (payload) => {
  const { data } = await axios.post(`${host}/phc/reimbursement/update-status/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

export const processAuditorPayment = async (payload) => {
  const { data } = await axios.post(`${host}/phc/reimbursement/process-payment/`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
  return data?.data || {};
};

// UC-15: Reimbursement Claims for Staff
// Note: Use getReimbursementClaims() and processReimbursement() above
