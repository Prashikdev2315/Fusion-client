import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  TextInput,
  Select,
  Text,
  Title,
  Stack,
  Group,
  Badge,
  Alert,
  Loader,
  Switch,
  Tabs,
} from "@mantine/core";
import PHCNav from "../components/PHCNav";
import {
  createDoctor,
  updateDoctorSchedule,
  markDoctorAttendance,
  toggleDoctorStatus,
  getDoctorsList,
} from "../api";
import { useSelector } from "react-redux";

const DoctorManagement = () => {
  const phcRole = useSelector((state) => state.user.phcRole);
  const selectedRole = useSelector((state) => state.user.role);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAddDoctorModal, setOpenAddDoctorModal] = useState(false);
  const [openScheduleModal, setOpenScheduleModal] = useState(false);
  const [openAttendanceModal, setOpenAttendanceModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [activeTab, setActiveTab] = useState("doctors");

  const [addDoctorForm, setAddDoctorForm] = useState({
    doctor_name: "",
    doctor_phone: "",
    specialization: "",
  });

  const [scheduleForm, setScheduleForm] = useState({
    doctor_id: "",
    day_of_week: "",
    available_from: "",
    available_to: "",
  });

  const [attendanceForm, setAttendanceForm] = useState({
    date: "",
    status: "available",
    notes: "",
  });

  const [togglingId, setTogglingId] = useState("");

  useEffect(() => {
    if (phcRole === "phc_staff") {
      fetchDoctors();
    }
  }, [phcRole, showInactive]);

  const normalizedRole = String(selectedRole || "").toLowerCase();
  const isProfessorView = normalizedRole === "professor";
  const canManageDoctors = phcRole === "phc_staff" && !isProfessorView;

  // Access check is handled by the access denied alert below

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await getDoctorsList(showInactive);
      setDoctors(data);
    } catch (error) {
      alert("Error fetching doctors: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!canManageDoctors) {
    return (
      <div style={{ padding: 16 }}>
        <PHCNav />
        <Alert color="red" title="Access Denied">
          Doctor management is only available for PHC staff (compounder role).
        </Alert>
      </div>
    );
  }

  const handleOpenScheduleModal = (doctor) => {
    setSelectedDoctor(doctor);
    setScheduleForm({
      doctor_id: String(doctor.doctor_id),
      day_of_week: "",
      available_from: "",
      available_to: "",
    });
    setOpenScheduleModal(true);
  };

  const handleOpenWeeklyScheduleModal = () => {
    setSelectedDoctor(null);
    setScheduleForm({ doctor_id: "", day_of_week: "", available_from: "", available_to: "" });
    setOpenScheduleModal(true);
  };

  const handleOpenAddDoctorModal = () => {
    setAddDoctorForm({
      doctor_name: "",
      doctor_phone: "",
      specialization: "",
    });
    setOpenAddDoctorModal(true);
  };

  const handleSubmitAddDoctor = async () => {
    if (!addDoctorForm.doctor_name || !addDoctorForm.doctor_phone || !addDoctorForm.specialization) {
      alert("Please fill all doctor details");
      return;
    }

    try {
      await createDoctor(addDoctorForm);
      alert("Doctor added successfully!");
      setOpenAddDoctorModal(false);
      fetchDoctors();
    } catch (error) {
      alert("Error adding doctor: " + (error.response?.data?.message || error.message));
    }
  };

  const handleOpenAttendanceModal = (doctor) => {
    setSelectedDoctor(doctor);
    setAttendanceForm({ date: "", status: "available", notes: "" });
    setOpenAttendanceModal(true);
  };

  const handleSubmitSchedule = async () => {
    const doctorId = scheduleForm.doctor_id || String(selectedDoctor?.doctor_id || "");
    if (!doctorId || !scheduleForm.day_of_week || !scheduleForm.available_from || !scheduleForm.available_to) {
      alert("Please fill all fields");
      return;
    }

    try {
      await updateDoctorSchedule({
        doctor_id: Number(doctorId),
        schedule: [{
          day: scheduleForm.day_of_week,
          from_time: scheduleForm.available_from,
          to_time: scheduleForm.available_to,
          room: 0,
        }],
      });
      alert("Schedule updated successfully!");
      setOpenScheduleModal(false);
      fetchDoctors();
    } catch (error) {
      alert("Error updating schedule: " + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmitAttendance = async () => {
    if (!attendanceForm.date) {
      alert("Please select a date");
      return;
    }

    try {
      await markDoctorAttendance({
        doctor_id: selectedDoctor.doctor_id,
        ...attendanceForm,
      });
      alert("Attendance marked successfully!");
      setOpenAttendanceModal(false);
      fetchDoctors();
    } catch (error) {
      alert("Error marking attendance: " + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleDoctorStatus = async (doctor) => {
    setTogglingId(String(doctor.doctor_id));
    try {
      await toggleDoctorStatus(doctor.doctor_id);
      const newStatus = doctor.active ? "INACTIVE" : "ACTIVE";
      alert(`Doctor marked as ${newStatus}`);
      await fetchDoctors();
    } catch (error) {
      alert("Error toggling status: " + (error.response?.data?.message || error.message));
    } finally {
      setTogglingId("");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />

      <div style={{ marginBottom: 16 }}>
        <Title order={2}>Compounder Dashboard</Title>
        <Text c="dimmed">Manage doctor appointments, schedules, and patient care from one place.</Text>
      </div>

      <Tabs value={activeTab} onChange={setActiveTab} mb="md">
        <Tabs.List>
          <Tabs.Tab value="doctors">Doctor Management</Tabs.Tab>
          <Tabs.Tab value="schedule">Today's Schedule</Tabs.Tab>
          <Tabs.Tab value="consultation">New Consultation</Tabs.Tab>
          <Tabs.Tab value="prescription">Create Prescription</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="doctors" pt="md">
        <Group justify="space-between" mb="sm" wrap="wrap">
          <Title order={3}>Doctor Management</Title>
          <Group>
            <Switch
              checked={showInactive}
              onChange={(event) => setShowInactive(event.currentTarget.checked)}
              label="Show Inactive"
            />
            <Button onClick={handleOpenAddDoctorModal}>Add Doctor</Button>
          </Group>
        </Group>

        <Text size="sm" c="dimmed" mb="md">
          Total Doctors: {doctors.length}
        </Text>

        <Group>
          <Button onClick={handleOpenWeeklyScheduleModal}>
            Edit Weekly Doctor Schedule
          </Button>
          <Button variant="light" onClick={fetchDoctors} loading={loading}>
            Refresh
          </Button>
        </Group>

        {loading ? (
          <Loader />
        ) : (
          <Card withBorder radius="md" p="lg">
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Specialization</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Status</Table.Th>
                <Table.Th>Schedule</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {doctors.map((doctor) => (
                <Table.Tr key={doctor.doctor_id}>
                  <Table.Td>{doctor.doctor_name}</Table.Td>
                  <Table.Td>{doctor.specialization || "General"}</Table.Td>
                  <Table.Td>{doctor.phone || "-"}</Table.Td>
                  <Table.Td>
                    <Badge color={doctor.active ? "green" : "red"} variant="light">
                      {doctor.active ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {doctor.master_schedule && doctor.master_schedule.length > 0 ? (
                      <Stack gap={2}>
                        {doctor.master_schedule.slice(0, 2).map((schedule) => (
                          <Text key={`${doctor.doctor_id}-${schedule.day}`} size="xs">
                            {schedule.day}: {schedule.from_time || "-"} - {schedule.to_time || "-"}
                          </Text>
                        ))}
                        {doctor.master_schedule.length > 2 ? (
                          <Text size="xs" c="dimmed">+{doctor.master_schedule.length - 2} more</Text>
                        ) : null}
                      </Stack>
                    ) : (
                      <Text size="sm" c="dimmed">Not set</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button 
                        size="xs" 
                        variant={doctor.active ? "filled" : "light"}
                        color={doctor.active ? "green" : "red"}
                        onClick={() => handleToggleDoctorStatus(doctor)}
                        loading={togglingId === String(doctor.doctor_id)}
                      >
                        {doctor.active ? "ACTIVE" : "INACTIVE"}
                      </Button>
                      <Button size="xs" variant="light" onClick={() => handleOpenScheduleModal(doctor)}>
                        Schedule
                      </Button>
                      <Button size="xs" variant="outline" color="blue" onClick={() => handleOpenAttendanceModal(doctor)}>
                        Attendance
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {!doctors.length ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed">No doctors found for the selected filter.</Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </Card>
      )}
        </Tabs.Panel>

        <Tabs.Panel value="schedule" pt="md">
          <Card withBorder radius="md" p="lg">
            <Title order={3}>Today's Schedule</Title>
            <Text c="dimmed" mb="md">View and manage today's doctor schedule and appointments.</Text>
            <Alert color="blue" title="Feature Coming Soon">
              Doctor schedule management is available in the Doctor Management tab. Use the "Edit Weekly Doctor Schedule" button to manage schedules.
            </Alert>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="consultation" pt="md">
          <Card withBorder radius="md" p="lg">
            <Title order={3}>New Consultation</Title>
            <Text c="dimmed" mb="md">Create new patient consultations.</Text>
            <Alert color="blue" title="Feature Coming Soon">
              New consultation management will be available here soon.
            </Alert>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="prescription" pt="md">
          <Card withBorder radius="md" p="lg">
            <Title order={3}>Create Prescription</Title>
            <Text c="dimmed" mb="md">Create prescriptions for patients.</Text>
            <Alert color="blue" title="Feature Coming Soon">
              Prescription creation is available through the Patient Management tab in the staff dashboard.
            </Alert>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Add Doctor Modal */}
      <Modal
        opened={openAddDoctorModal}
        onClose={() => setOpenAddDoctorModal(false)}
        title="Add New Doctor"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Doctor Name"
            placeholder="Enter doctor name"
            value={addDoctorForm.doctor_name}
            onChange={(e) =>
              setAddDoctorForm({ ...addDoctorForm, doctor_name: e.target.value })
            }
            required
          />
          <TextInput
            label="Phone Number"
            placeholder="Enter phone number"
            value={addDoctorForm.doctor_phone}
            onChange={(e) =>
              setAddDoctorForm({ ...addDoctorForm, doctor_phone: e.target.value })
            }
            required
          />
          <TextInput
            label="Specialization"
            placeholder="e.g., Physician"
            value={addDoctorForm.specialization}
            onChange={(e) =>
              setAddDoctorForm({ ...addDoctorForm, specialization: e.target.value })
            }
            required
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setOpenAddDoctorModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAddDoctor}>Save Doctor</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        opened={openScheduleModal}
        onClose={() => setOpenScheduleModal(false)}
        title="Set Doctor Schedule"
        centered
      >
        <Stack gap="md">
          <Select
            label="Doctor"
            placeholder="Select doctor"
            data={doctors.map((doctor) => ({
              value: String(doctor.doctor_id),
              label: `${doctor.doctor_name} (${doctor.specialization || "General"})`,
            }))}
            value={scheduleForm.doctor_id}
            onChange={(value) =>
              setScheduleForm({ ...scheduleForm, doctor_id: value || "" })
            }
            required
          />
          <Select
            label="Day of Week"
            placeholder="Select day"
            data={[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ]}
            value={scheduleForm.day_of_week}
            onChange={(value) =>
              setScheduleForm({ ...scheduleForm, day_of_week: value })
            }
            required
          />
          <TextInput
            label="Available From (e.g., 09:00)"
            placeholder="HH:MM"
            value={scheduleForm.available_from}
            onChange={(e) =>
              setScheduleForm({ ...scheduleForm, available_from: e.target.value })
            }
            required
          />
          <TextInput
            label="Available To (e.g., 17:00)"
            placeholder="HH:MM"
            value={scheduleForm.available_to}
            onChange={(e) =>
              setScheduleForm({ ...scheduleForm, available_to: e.target.value })
            }
            required
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setOpenScheduleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitSchedule}>Save Schedule</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Attendance Modal */}
      <Modal
        opened={openAttendanceModal}
        onClose={() => setOpenAttendanceModal(false)}
        title="Mark Doctor Attendance"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Date"
            type="date"
            value={attendanceForm.date}
            onChange={(e) =>
              setAttendanceForm({ ...attendanceForm, date: e.target.value })
            }
            required
          />
          <Select
            label="Status"
            placeholder="Select status"
            data={[
              { value: "available", label: "Available" },
              { value: "departed", label: "Departed" },
              { value: "on_leave", label: "On Leave" },
            ]}
            value={attendanceForm.status}
            onChange={(value) =>
              setAttendanceForm({ ...attendanceForm, status: value || "available" })
            }
            required
          />
          <TextInput
            label="Notes (optional)"
            placeholder="Any additional notes"
            value={attendanceForm.notes}
            onChange={(e) =>
              setAttendanceForm({ ...attendanceForm, notes: e.target.value })
            }
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setOpenAttendanceModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAttendance}>Mark Attendance</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default DoctorManagement;
