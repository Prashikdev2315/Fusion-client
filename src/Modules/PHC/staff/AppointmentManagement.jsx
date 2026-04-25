import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Select,
  Text,
  Title,
  Stack,
  Group,
  Badge,
  Alert,
  Loader,
  Textarea,
  Tabs,
  TextInput,
} from "@mantine/core";
import PHCNav from "../components/PHCNav";
import {
  getAppointmentsList,
  updateAppointmentStatus,
  createEnhancedVisit,
  getInventoryMedicines,
  getVisitDetail,
} from "../api";
import { useSelector } from "react-redux";
import logger from "../../../utils/logger";

const AppointmentManagement = () => {
  const phcRole = useSelector((state) => state.user.phcRole);
  const [appointments, setAppointments] = useState([]);
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("scheduled");
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [openPrescriptionModal, setOpenPrescriptionModal] = useState(false);
  const [openViewPrescriptionModal, setOpenViewPrescriptionModal] = useState(false);
  const [openUpdatePrescriptionModal, setOpenUpdatePrescriptionModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [updateForm, setUpdateForm] = useState({
    status: "completed",
    notes: "",
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: "",
    details: "",
    specialInstructions: "",
    testsRecommended: "",
    followUpSuggestions: "",
    medicines: [],
  });

  const [viewingVisit, setViewingVisit] = useState(null);
  const [fetchingVisit, setFetchingVisit] = useState(false);

  useEffect(() => {
    if (phcRole === "phc_staff") {
      fetchAppointments();
      fetchMedicines();
      const interval = setInterval(fetchAppointments, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [phcRole]);

  const fetchMedicines = async () => {
    try {
      const medicines = await getInventoryMedicines();
      setAvailableMedicines(medicines);
    } catch (error) {
      logger.error("Failed to fetch medicines", error);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await getAppointmentsList();
      setAppointments(data);
    } catch (error) {
      alert("Error fetching appointments: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (phcRole !== "phc_staff") {
    return (
      <div style={{ padding: 16 }}>
        <PHCNav />
        <Alert color="red" title="Access Denied">
          Only PHC staff can manage appointments.
        </Alert>
      </div>
    );
  }

  const handleOpenUpdateModal = (appointment) => {
    setSelectedAppointment(appointment);
    setUpdateForm({ status: "completed", notes: "" });
    setOpenUpdateModal(true);
  };

  const handleSubmitUpdate = async () => {
    const appointmentId = selectedAppointment?.appointment_id || selectedAppointment?.id;
    try {
      await updateAppointmentStatus({
        appointment_id: appointmentId,
        ...updateForm,
      });
      alert("Appointment updated successfully!");
      setOpenUpdateModal(false);
      fetchAppointments();
    } catch (error) {
      alert("Error updating appointment: " + (error.response?.data?.message || error.message));
    }
  };

  const handleOpenPrescriptionModal = (appointment) => {
    setSelectedAppointment(appointment);
    setPrescriptionForm({
      diagnosis: "",
      details: "",
      specialInstructions: "",
      testsRecommended: "",
      followUpSuggestions: "",
      medicines: [],
    });
    setOpenPrescriptionModal(true);
  };

  const handleOpenViewPrescriptionModal = async (appointment) => {
    setSelectedAppointment(appointment);
    setFetchingVisit(true);
    try {
      const visitData = await getVisitDetail(appointment.visit_id);
      setViewingVisit(visitData);
      setOpenViewPrescriptionModal(true);
    } catch (error) {
      alert("Error fetching prescription details: " + (error.response?.data?.message || error.message));
    } finally {
      setFetchingVisit(false);
    }
  };

  const handleOpenUpdatePrescriptionModal = async (appointment) => {
    setSelectedAppointment(appointment);
    setFetchingVisit(true);
    try {
      const visitData = await getVisitDetail(appointment.visit_id);
      // Parse prescription text to extract medicines if possible
      const prescriptionLines = visitData.prescription.split('\n').filter(line => line.trim());
      setPrescriptionForm({
        diagnosis: visitData.diagnosis || "",
        details: visitData.prescription || "",
        specialInstructions: "",
        testsRecommended: "",
        followUpSuggestions: "",
        medicines: [],
      });
      setOpenUpdatePrescriptionModal(true);
    } catch (error) {
      alert("Error fetching prescription details: " + (error.response?.data?.message || error.message));
    } finally {
      setFetchingVisit(false);
    }
  };

  const handleSubmitPrescription = async () => {
    if (!prescriptionForm.diagnosis) {
      alert("Please enter diagnosis");
      return;
    }

    // Validate medicines exist in inventory
    for (const med of prescriptionForm.medicines) {
      if (!med.name) {
        alert("Please fill in all medicine names");
        return;
      }
      
      const medicineExists = availableMedicines.some(
        (m) => m.medicine_name?.toLowerCase() === med.name.toLowerCase() || 
               m.name?.toLowerCase() === med.name.toLowerCase()
      );
      
      if (!medicineExists) {
        alert(`Medicine "${med.name}" is not available in inventory. Please add it to inventory first.`);
        return;
      }
    }

    try {
      const appointmentId = selectedAppointment?.appointment_id || selectedAppointment?.id;
      
      // Format medicines into prescription text
      const medicineText = prescriptionForm.medicines
        .map((med) => `${med.name} - ${med.dosage || 'N/A'} | ${med.frequency || 'N/A'} | ${med.duration || 'N/A'}`)
        .join('\n');

      // Build prescription details
      const prescriptionDetails = [
        prescriptionForm.details && `Advice: ${prescriptionForm.details}`,
        prescriptionForm.specialInstructions && `Special Instructions: ${prescriptionForm.specialInstructions}`,
        prescriptionForm.testsRecommended && `Recommended Tests: ${prescriptionForm.testsRecommended}`,
        prescriptionForm.followUpSuggestions && `Follow-up: ${prescriptionForm.followUpSuggestions}`,
      ]
        .filter(Boolean)
        .join('\n');

      const prescriptionPayload = {
        appointment_id: appointmentId,
        diagnosis: prescriptionForm.diagnosis,
        prescription: medicineText ? `${medicineText}\n\n${prescriptionDetails}`.trim() : prescriptionDetails,
        notes: prescriptionForm.details,
      };

      await createEnhancedVisit(prescriptionPayload);
      alert("Prescription created successfully!");
      setOpenPrescriptionModal(false);
      fetchAppointments();
    } catch (error) {
      alert("Error creating prescription: " + (error.response?.data?.message || error.message));
    }
  };

  const addMedicineRow = () => {
    setPrescriptionForm({
      ...prescriptionForm,
      medicines: [...prescriptionForm.medicines, { name: "", dosage: "", frequency: "", duration: "" }],
    });
  };

  const removeMedicineRow = (index) => {
    setPrescriptionForm({
      ...prescriptionForm,
      medicines: prescriptionForm.medicines.filter((_, i) => i !== index),
    });
  };

  const updateMedicine = (index, field, value) => {
    const updatedMedicines = [...prescriptionForm.medicines];
    updatedMedicines[index] = { ...updatedMedicines[index], [field]: value };
    setPrescriptionForm({ ...prescriptionForm, medicines: updatedMedicines });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
      case "booked":
        return "blue";
      case "completed":
        return "green";
      case "cancelled":
        return "red";
      case "no_show":
        return "gray";
      case "rescheduled":
        return "yellow";
      default:
        return "gray";
    }
  };

  const normalizeStatus = (status) => {
    if (status === "booked") {
      return "scheduled";
    }
    return status;
  };

  const filterAppointmentsByStatus = (status) => {
    return appointments.filter((appt) => normalizeStatus(appt.status) === status);
  };

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />
      <Group justify="space-between" mb="md">
        <Title order={2}>Appointment Management</Title>
        <Group>
          <Button onClick={fetchAppointments} loading={loading}>
            Refresh
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Loader />
      ) : (
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab
              value="scheduled"
              badge={filterAppointmentsByStatus("scheduled").length}
            >
              Scheduled
            </Tabs.Tab>
            <Tabs.Tab
              value="completed"
              badge={filterAppointmentsByStatus("completed").length}
            >
              Completed
            </Tabs.Tab>
            <Tabs.Tab
              value="cancelled"
              badge={filterAppointmentsByStatus("cancelled").length}
            >
              Cancelled
            </Tabs.Tab>
            <Tabs.Tab
              value="no_show"
              badge={filterAppointmentsByStatus("no_show").length}
            >
              No Show
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value={activeTab} pt="md">
            <Card withBorder radius="md" p="lg">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Appointment ID</Table.Th>
                    <Table.Th>Patient</Table.Th>
                    <Table.Th>Doctor</Table.Th>
                    <Table.Th>Date & Time</Table.Th>
                    <Table.Th>Reason</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filterAppointmentsByStatus(activeTab).map((appointment, index) => {
                    const rowId = appointment.appointment_id || appointment.id || `${appointment.patient_id || "p"}-${appointment.doctor_id || "d"}-${appointment.appointment_date || "date"}-${appointment.time_slot || "time"}-${index}`;
                    return (
                    <Table.Tr key={rowId}>
                      <Table.Td fw={500}>{appointment.appointment_id || appointment.id}</Table.Td>
                      <Table.Td>{appointment.patient_name}</Table.Td>
                      <Table.Td>{appointment.doctor_name}</Table.Td>
                      <Table.Td size="sm">
                        {appointment.appointment_date} {appointment.time_slot}
                      </Table.Td>
                      <Table.Td size="sm">{appointment.reason}</Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(normalizeStatus(appointment.status))}>
                          {normalizeStatus(appointment.status)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {normalizeStatus(appointment.status) === "scheduled" && (
                          <Group gap="xs">
                            <Button
                              size="xs"
                              variant="light"
                              onClick={() => handleOpenUpdateModal(appointment)}
                            >
                              Update
                            </Button>
                            <Button size="xs" variant="light" color="red">
                              Cancel
                            </Button>
                          </Group>
                        )}
                        {normalizeStatus(appointment.status) === "completed" && !appointment.has_prescription && (
                          <Button
                            size="xs"
                            variant="light"
                            color="green"
                            onClick={() => handleOpenPrescriptionModal(appointment)}
                          >
                            Create Prescription
                          </Button>
                        )}
                        {normalizeStatus(appointment.status) === "completed" && appointment.has_prescription && (
                          <Group gap="xs">
                            <Button
                              size="xs"
                              variant="light"
                              color="blue"
                              onClick={() => handleOpenViewPrescriptionModal(appointment)}
                            >
                              View Prescription
                            </Button>
                            <Button
                              size="xs"
                              variant="light"
                              color="yellow"
                              onClick={() => handleOpenUpdatePrescriptionModal(appointment)}
                            >
                              Update
                            </Button>
                          </Group>
                        )}
                        {normalizeStatus(appointment.status) !== "scheduled" && normalizeStatus(appointment.status) !== "completed" && (
                          <Text size="xs" c="dimmed">
                            {normalizeStatus(appointment.status)}
                          </Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Card>
          </Tabs.Panel>
        </Tabs>
      )}

      {/* Update Appointment Modal */}
      <Modal
        opened={openUpdateModal}
        onClose={() => setOpenUpdateModal(false)}
        title="Update Appointment Status"
        centered
      >
        {selectedAppointment && (
          <Stack gap="md">
            <div>
              <Text size="sm" c="dimmed">
                Patient
              </Text>
              <Text fw={500}>{selectedAppointment.patient_name}</Text>
            </div>

            <div>
              <Text size="sm" c="dimmed">
                Doctor
              </Text>
              <Text fw={500}>{selectedAppointment.doctor_name}</Text>
            </div>

            <Select
              label="Status"
              placeholder="Select status"
              data={[
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
                { value: "no_show", label: "No Show" },
                { value: "rescheduled", label: "Rescheduled" },
              ]}
              value={updateForm.status}
              onChange={(value) =>
                setUpdateForm({ ...updateForm, status: value })
              }
              required
            />

            <Textarea
              label="Status Notes"
              placeholder="Enter notes about status update"
              value={updateForm.notes}
              onChange={(e) =>
                setUpdateForm({ ...updateForm, notes: e.target.value })
              }
              minRows={3}
            />

            <Group justify="flex-end">
              <Button variant="light" onClick={() => setOpenUpdateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitUpdate}>Update Status</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Create Prescription Modal */}
      <Modal
        opened={openPrescriptionModal}
        onClose={() => setOpenPrescriptionModal(false)}
        title="Create Prescription"
        centered
        size="lg"
      >
        {selectedAppointment && (
          <Stack gap="md">
            <div>
              <Text size="sm" c="dimmed">Patient</Text>
              <Text fw={500}>{selectedAppointment.patient_name}</Text>
            </div>

            <TextInput
              label="Diagnosis"
              placeholder="Enter diagnosis"
              value={prescriptionForm.diagnosis}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
              required
            />

            <Textarea
              label="Details"
              placeholder="Enter consultation details"
              value={prescriptionForm.details}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, details: e.target.value })}
              minRows={2}
            />

            <Textarea
              label="Special Instructions"
              placeholder="Enter special instructions if any"
              value={prescriptionForm.specialInstructions}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, specialInstructions: e.target.value })}
              minRows={2}
            />

            <div>
              <Text size="sm" fw={500} mb="xs">Medicines</Text>
              {availableMedicines.length === 0 && (
                <Alert color="yellow" mb="md">
                  No medicines available in inventory. Please add medicines to inventory first.
                </Alert>
              )}
              {prescriptionForm.medicines.length > 0 && (
                <Card withBorder p="md" mb="md">
                  <Table size="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Medicine</Table.Th>
                        <Table.Th>Dosage</Table.Th>
                        <Table.Th>Frequency</Table.Th>
                        <Table.Th>Duration</Table.Th>
                        <Table.Th>Action</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {prescriptionForm.medicines.map((med, idx) => (
                        <Table.Tr key={`${med.name || "new"}-${med.dosage || ""}-${med.frequency || ""}-${idx}`}>
                          <Table.Td>
                            <Select
                              placeholder="Select medicine"
                              searchable
                              data={availableMedicines.map((m) => ({
                                value: m.medicine_name || m.name,
                                label: m.medicine_name || m.name,
                              }))}
                              value={med.name}
                              onChange={(value) => updateMedicine(idx, "name", value || "")}
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>
                            <TextInput
                              placeholder="e.g., 500mg"
                              value={med.dosage}
                              onChange={(e) => updateMedicine(idx, "dosage", e.target.value)}
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>
                            <TextInput
                              placeholder="e.g., Twice daily"
                              value={med.frequency}
                              onChange={(e) => updateMedicine(idx, "frequency", e.target.value)}
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>
                            <TextInput
                              placeholder="e.g., 7 days"
                              value={med.duration}
                              onChange={(e) => updateMedicine(idx, "duration", e.target.value)}
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>
                            <Button
                              size="xs"
                              color="red"
                              variant="light"
                              onClick={() => removeMedicineRow(idx)}
                            >
                              Remove
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Card>
              )}
              <Button 
                variant="light" 
                size="sm" 
                onClick={addMedicineRow}
                disabled={availableMedicines.length === 0}
              >
                + Add Medicine
              </Button>
            </div>

            <Textarea
              label="Tests Recommended"
              placeholder="Enter recommended tests"
              value={prescriptionForm.testsRecommended}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, testsRecommended: e.target.value })}
              minRows={2}
            />

            <Textarea
              label="Follow-up Suggestions"
              placeholder="Enter follow-up suggestions"
              value={prescriptionForm.followUpSuggestions}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, followUpSuggestions: e.target.value })}
              minRows={2}
            />

            <Group justify="flex-end">
              <Button variant="light" onClick={() => setOpenPrescriptionModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitPrescription}>Create Prescription</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* View Prescription Modal */}
      <Modal
        opened={openViewPrescriptionModal}
        onClose={() => setOpenViewPrescriptionModal(false)}
        title="View Prescription"
        size="lg"
      >
        {fetchingVisit ? (
          <Loader />
        ) : viewingVisit ? (
          <Stack>
            <div>
              <Text fw={500}>Patient: {selectedAppointment?.patient_name}</Text>
              <Text fw={500}>Doctor: {selectedAppointment?.doctor_name}</Text>
              <Text fw={500}>Appointment ID: {selectedAppointment?.appointment_id || selectedAppointment?.id}</Text>
            </div>

            <Card withBorder p="md" bg="gray.0">
              <Stack gap="md">
                <div>
                  <Text fw={500} mb="xs">Diagnosis:</Text>
                  <Text>{viewingVisit.diagnosis || "N/A"}</Text>
                </div>

                <div>
                  <Text fw={500} mb="xs">Prescription & Medicine Details:</Text>
                  <Text style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {viewingVisit.prescription || "No prescription details"}
                  </Text>
                </div>

                <div>
                  <Text fw={500} size="sm">Created by: {viewingVisit.created_by}</Text>
                  <Text fw={500} size="sm">Created at: {new Date(viewingVisit.created_at).toLocaleString()}</Text>
                </div>
              </Stack>
            </Card>

            <Group justify="flex-end">
              <Button variant="light" onClick={() => setOpenViewPrescriptionModal(false)}>
                Close
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>

      {/* Update Prescription Modal */}
      <Modal
        opened={openUpdatePrescriptionModal}
        onClose={() => setOpenUpdatePrescriptionModal(false)}
        title="Update Prescription"
        size="lg"
      >
        {fetchingVisit ? (
          <Loader />
        ) : selectedAppointment && viewingVisit ? (
          <Stack>
            <div>
              <Text fw={500}>Patient: {selectedAppointment.patient_name}</Text>
              <Text fw={500}>Doctor: {selectedAppointment.doctor_name}</Text>
              <Text fw={500} size="sm">Originally created on: {new Date(viewingVisit.created_at).toLocaleString()}</Text>
            </div>

            <Alert color="yellow" title="Update existing prescription">
              Make changes to the prescription details below and submit to update.
            </Alert>

            <TextInput
              label="Diagnosis"
              placeholder="Update diagnosis"
              value={prescriptionForm.diagnosis}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
              required
            />

            <Textarea
              label="Prescription & Medicine Details"
              placeholder="Update medicine details and instructions"
              value={prescriptionForm.details}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, details: e.target.value })}
              minRows={4}
            />

            <Group justify="flex-end">
              <Button variant="light" onClick={() => setOpenUpdatePrescriptionModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                alert("Update prescription functionality coming soon!");
                setOpenUpdatePrescriptionModal(false);
              }}>
                Update Prescription
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>
    </div>
  );
};

export default AppointmentManagement;
