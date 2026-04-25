import React, { useCallback, useState } from "react";
import {
  TextInput,
  Button,
  Card,
  Table,
  Text,
  Group,
  Badge,
  Stack,
  Title,
  Alert,
  Loader,
  Grid,
  Textarea,
  Select,
  NumberInput,
} from "@mantine/core";
import PHCNav from "../components/PHCNav";
import { searchPatient, getPatientHistory, getAvailableMedicines, createEnhancedVisit, useMedicinesFromPrescription } from "../api";
import { useSelector } from "react-redux";
import logger from "../../../utils/logger";

const medicineFrequencyOptions = [
  { value: "once_daily", label: "Once daily" },
  { value: "twice_daily", label: "Twice daily" },
  { value: "thrice_daily", label: "Thrice daily" },
  { value: "every_x_hours", label: "Every X hours" },
];

const medicineDurationUnitOptions = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
];

const createMedicineInput = () => ({
  medicine_id: "",
  quantity: 1,
  frequency: "",
  duration_value: 1,
  duration_unit: "days",
});

const PatientSearch = () => {
  const phcRole = useSelector((state) => state.user.phcRole);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitForm, setVisitForm] = useState({
    diagnosis: "",
    medicines: [],
    notes: "",
  });
  const [medicineInputs, setMedicineInputs] = useState([]); // For quantity inputs
  const [medicineErrors, setMedicineErrors] = useState([]);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      alert("Enter at least 2 characters");
      return;
    }

    setLoading(true);
    try {
      const results = await searchPatient(searchQuery);
      setSearchResults(results);
    } catch (error) {
      alert("Error searching patients: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setHistoryLoading(true);
    try {
      const history = await getPatientHistory(patient.patient_id);
      setPatientHistory(history);
      
      // Fetch available medicines
      const medicines = await getAvailableMedicines();
      setAvailableMedicines(medicines);
      setMedicineInputs([]); // Reset medicine selections
      setMedicineErrors([]);
    } catch (error) {
      alert("Error fetching patient history: " + (error.response?.data?.message || error.message));
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAddMedicine = useCallback(() => {
    setMedicineInputs((currentMedicines) => [...currentMedicines, createMedicineInput()]);
    setMedicineErrors((currentErrors) => [...currentErrors, {}]);
  }, []);

  const handleRemoveMedicine = useCallback((index) => {
    setMedicineInputs((currentMedicines) => currentMedicines.filter((_, i) => i !== index));
    setMedicineErrors((currentErrors) => currentErrors.filter((_, i) => i !== index));
  }, []);

  const handleMedicineChange = useCallback((index, field, value) => {
    setMedicineInputs((currentMedicines) =>
      currentMedicines.map((medicine, medicineIndex) => (
        medicineIndex === index
          ? { ...medicine, [field]: value }
          : medicine
      )),
    );
    setMedicineErrors((currentErrors) =>
      currentErrors.map((errors, errorIndex) => (
        errorIndex === index
          ? { ...errors, [field]: undefined }
          : errors
      )),
    );
  }, []);

  const handleSubmitVisit = async () => {
    logger.debug("Submitting visit form");
    
    // Validation
    if (!visitForm.diagnosis || visitForm.diagnosis.trim().length === 0) {
      alert("❌ Error: Diagnosis field cannot be empty");
      return;
    }

    if (medicineInputs.length === 0) {
      alert("❌ Error: Please select at least one medicine");
      return;
    }

    const nextMedicineErrors = medicineInputs.map((medicine) => {
      const errors = {};

      if (!medicine.medicine_id) {
        errors.medicine_id = "Select a medicine";
      }
      if (!medicine.frequency) {
        errors.frequency = "Select dosage frequency";
      }
      if (!medicine.duration_value || Number(medicine.duration_value) <= 0) {
        errors.duration_value = "Enter duration";
      }
      if (!medicine.duration_unit) {
        errors.duration_unit = "Select unit";
      }
      if (!medicine.quantity || Number(medicine.quantity) <= 0) {
        errors.quantity = "Quantity must be at least 1";
      }

      return errors;
    });

    const hasValidationErrors = nextMedicineErrors.some((errors) => Object.keys(errors).length > 0);
    if (hasValidationErrors) {
      setMedicineErrors(nextMedicineErrors);
      alert("❌ Error: Please complete the prescription details for each medicine");
      return;
    }

    setMedicineErrors([]);

    // Build prescription text from selected medicines
    const prescriptionText = medicineInputs
      .map(m => {
        const med = availableMedicines.find(med => String(med.id) === String(m.medicine_id));
        return `${med?.medicine_name} - ${m.quantity} unit(s) - ${m.frequency} - ${m.duration_value} ${m.duration_unit}`;
      })
      .join(", ");

    // Build visit creation payload
    const visitPayload = {
      diagnosis: visitForm.diagnosis,
      prescription: prescriptionText,
      patient_id: selectedPatient.patient_id,
      notes: visitForm.notes,
    };

    logger.debug("Creating walk-in visit with medicines");

    try {
      // Create visit
      const result = await createEnhancedVisit(visitPayload);
      logger.info("Visit created successfully");

      // Deduct medicines from inventory
      const medicinesPayload = {
        visit_id: result?.visit_id || result?.id,
        medicines: medicineInputs,
      };

      await useMedicinesFromPrescription(medicinesPayload);
      logger.info("Medicines deducted from inventory");

      alert("✅ Visit record created successfully! Medicines deducted from inventory.");
      setVisitForm({ diagnosis: "", medicines: [], notes: "" });
      setMedicineInputs([]);
      setMedicineErrors([]);
      setShowVisitForm(false);
      await handleSelectPatient(selectedPatient); // Refresh history
    } catch (error) {
      logger.error("Failed to create visit", error);
      const errorMsg = error.response?.data?.message || error.message || "Unknown error";
      alert(`❌ Error: ${errorMsg}`);
    }
  };

  if (phcRole !== "phc_staff") {
    return (
      <div style={{ padding: 16 }}>
        <PHCNav />
        <Alert color="red" title="Access Denied">
          Only PHC staff can access patient search.
        </Alert>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />
      <Title order={2} mb="md">
        Patient Search & Management
      </Title>

      <Card withBorder radius="md" p="lg" mb="md">
        <Group mb="md">
          <TextInput
            placeholder="Search by patient ID, name, or username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            style={{ flex: 1 }}
          />
          <Button onClick={handleSearch} loading={loading}>
            Search
          </Button>
        </Group>

        {searchResults.length > 0 && (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Username</Table.Th>
                <Table.Th>Blood Type</Table.Th>
                <Table.Th>Last Appointment</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {searchResults.map((patient) => (
                <Table.Tr key={patient.patient_id}>
                  <Table.Td>{patient.patient_id}</Table.Td>
                  <Table.Td>{patient.full_name}</Table.Td>
                  <Table.Td>{patient.username}</Table.Td>
                  <Table.Td>
                    <Badge>{patient.blood_type}</Badge>
                  </Table.Td>
                  <Table.Td>{patient.last_appointment || "N/A"}</Table.Td>
                  <Table.Td>
                    <Button size="xs" onClick={() => handleSelectPatient(patient)}>
                      View
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {selectedPatient && (
        <>
          {historyLoading ? (
            <Loader />
          ) : (
            patientHistory && (
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder radius="md" p="lg" mb="md">
                    <Title order={4} mb="md">
                      Patient Information
                    </Title>
                    <Stack gap="xs">
                      <div>
                        <Text size="sm" c="dimmed">
                          Name
                        </Text>
                        <Text fw={500}>{patientHistory.patient_name}</Text>
                      </div>
                      <div>
                        <Text size="sm" c="dimmed">
                          Username
                        </Text>
                        <Text fw={500}>{patientHistory.username}</Text>
                      </div>
                      {patientHistory.medical_profile && (
                        <>
                          <div>
                            <Text size="sm" c="dimmed">
                              Blood Type
                            </Text>
                            <Badge>{patientHistory.medical_profile.blood_type}</Badge>
                          </div>
                          <div>
                            <Text size="sm" c="dimmed">
                              Gender
                            </Text>
                            <Text fw={500}>{patientHistory.medical_profile.gender}</Text>
                          </div>
                          <div>
                            <Text size="sm" c="dimmed">
                              Height / Weight
                            </Text>
                            <Text fw={500}>
                              {patientHistory.medical_profile.height}m / {patientHistory.medical_profile.weight}kg
                            </Text>
                          </div>
                        </>
                      )}
                    </Stack>
                  </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder radius="md" p="lg" mb="md">
                    <Title order={4} mb="md">
                      Medical Treatment History
                    </Title>
                    {patientHistory.recent_visits && patientHistory.recent_visits.length > 0 ? (
                      <Stack gap="xs">
                        {patientHistory.recent_visits.slice(0, 5).map((visit) => (
                          <div
                            key={visit.id}
                            style={{
                              padding: 8,
                              border: "1px solid #dee2e6",
                              borderRadius: 4,
                              backgroundColor: "#f8f9fa"
                            }}
                          >
                            <Group justify="space-between" mb={4}>
                              <div>
                                <Text size="sm" fw={500}>
                                  Dr. {visit.doctor}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {visit.created_at}
                                </Text>
                              </div>
                            </Group>
                            <Text size="xs" c="dimmed">
                              <strong>Diagnosis:</strong> {visit.diagnosis}
                            </Text>
                          </div>
                        ))}
                      </Stack>
                    ) : (
                      <Text c="dimmed" size="sm">
                        No previous visits. This may be a new patient or walk-in.
                      </Text>
                    )}
                  </Card>
                </Grid.Col>
              </Grid>
            )
          )}

          <Card withBorder radius="md" p="lg" mb="md">
            <Group justify="space-between" mb="md">
              <div>
                <Title order={4}>Create New Visit Record</Title>
                <Text size="sm" c="dimmed">Walk-in Patient Visit (No Appointment Required)</Text>
              </div>
              <Button
                size="xs"
                variant={showVisitForm ? "filled" : "light"}
                onClick={() => setShowVisitForm(!showVisitForm)}
              >
                {showVisitForm ? "Cancel" : "New Visit"}
              </Button>
            </Group>

            {showVisitForm && (
              <Stack gap="md">
                <Alert color="blue" title="Walk-in Visit - New Record">
                  This is a NEW visit record for a walk-in patient (no prior appointment). 
                  Diagnosis and medicines are required. Selected medicines will be automatically deducted from inventory.
                </Alert>
                
                <Textarea
                  label="Diagnosis *"
                  placeholder="Enter diagnosis details (e.g., Influenza, Headache, Fever, etc.)"
                  value={visitForm.diagnosis}
                  onChange={(e) =>
                    setVisitForm({ ...visitForm, diagnosis: e.target.value })
                  }
                  minRows={3}
                  required
                  description="Required field - describe the patient's condition"
                />

                <div>
                  <Group justify="space-between" mb="xs">
                    <Title order={5}>Prescribe Medicines *</Title>
                    <Button size="xs" variant="light" onClick={handleAddMedicine}>
                      + Add Medicine
                    </Button>
                  </Group>
                  
                  {medicineInputs.length === 0 ? (
                    <Alert color="yellow" title="No medicines added">
                      Please click "Add Medicine" to prescribe medicines. They will be deducted from inventory.
                    </Alert>
                  ) : (
                    <Stack gap="xs">
                      {medicineInputs.map((input, index) => (
                        <Grid key={`${input.medicine_id || "new"}-${input.quantity || 0}-${index}`} gutter="xs" align="flex-start">
                          <Grid.Col span={{ base: 12, md: 3 }}>
                            <Select
                              label={index === 0 ? "Medicine" : ""}
                              placeholder="Select medicine..."
                              data={
                                availableMedicines?.map((med) => ({
                                  value: String(med.id),
                                  label: `${med.medicine_name} (Stock: ${med.quantity})`,
                                  medicine: med,
                                })) || []
                              }
                              value={input.medicine_id}
                              onChange={(value) => handleMedicineChange(index, "medicine_id", value)}
                              searchable
                              error={medicineErrors[index]?.medicine_id}
                            />
                          </Grid.Col>
                          <Grid.Col span={{ base: 6, md: 2 }}>
                            <NumberInput
                              label={index === 0 ? "Quantity" : ""}
                              placeholder="Qty"
                              value={input.quantity}
                              onChange={(value) => handleMedicineChange(index, "quantity", value || 1)}
                              min={1}
                              max={100}
                              error={medicineErrors[index]?.quantity}
                            />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, md: 3 }}>
                            <Select
                              label={index === 0 ? "Frequency" : ""}
                              placeholder="Select frequency..."
                              data={medicineFrequencyOptions}
                              value={input.frequency}
                              onChange={(value) => handleMedicineChange(index, "frequency", value)}
                              error={medicineErrors[index]?.frequency}
                            />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, md: 2 }}>
                            <NumberInput
                              label={index === 0 ? "Duration" : ""}
                              placeholder="Value"
                              value={input.duration_value}
                              onChange={(value) => handleMedicineChange(index, "duration_value", value || 1)}
                              min={1}
                              error={medicineErrors[index]?.duration_value}
                            />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, md: 2 }}>
                            <Select
                              label={index === 0 ? "" : ""}
                              placeholder="Unit"
                              data={medicineDurationUnitOptions}
                              value={input.duration_unit}
                              onChange={(value) => handleMedicineChange(index, "duration_unit", value)}
                              error={medicineErrors[index]?.duration_unit}
                            />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, md: 2 }}>
                            <Button
                              fullWidth
                              size="xs"
                              variant="light"
                              color="red"
                              onClick={() => handleRemoveMedicine(index)}
                              style={{ marginTop: index === 0 ? 24 : 0 }}
                            >
                              Remove
                            </Button>
                          </Grid.Col>
                        </Grid>
                      ))}
                    </Stack>
                  )}
                </div>

                <Textarea
                  label="Additional Clinical Notes"
                  placeholder="Any follow-up instructions, precautions, or additional observations (optional)"
                  value={visitForm.notes}
                  onChange={(e) =>
                    setVisitForm({ ...visitForm, notes: e.target.value })
                  }
                  minRows={2}
                  description="Optional field - Use for recommendations or special instructions"
                />

                <Group justify="flex-end">
                  <Button variant="light" onClick={() => setShowVisitForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitVisit}>
                    Create Visit & Deduct Medicines
                  </Button>
                </Group>
              </Stack>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default PatientSearch;
