import React, { useEffect, useMemo, useState } from 'react';
import { createVisit, getStaffAppointments, updateAppointmentStatus } from '../api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PHCNav from '../components/PHCNav';
import { Alert, Badge, Button, Card, Group, Select, Stack, Table, Text, Textarea, TextInput, Title } from '@mantine/core';

const initialVisit = {
  appointment_id: '',
  diagnosis: '',
  details: '',
  specialInstructions: '',
  testsRecommended: '',
  followUpSuggestions: '',
  medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
  status: 'completed',
};

const todayIsoDate = () => new Date().toISOString().split('T')[0];

const CompAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [visitForm, setVisitForm] = useState(initialVisit);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const todaysAppointments = useMemo(() => {
    const today = todayIsoDate();
    return appointments.filter((row) => row.appointment_date === today);
  }, [appointments]);

  const todaysQueue = useMemo(
    () => todaysAppointments.filter((row) => ['booked', 'rescheduled'].includes(String(row.status || '').toLowerCase())),
    [todaysAppointments],
  );

  const todaysVisited = useMemo(
    () => todaysAppointments.filter((row) => String(row.status || '').toLowerCase() === 'completed'),
    [todaysAppointments],
  );

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getStaffAppointments();
      setAppointments(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch scheduled appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // Auto-refresh appointments every 30 seconds to show latest appointments regularly
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const submitVisit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const medicines = visitForm.medicines
        .map((medicine) => ({
          name: (medicine.name || '').trim(),
          dosage: (medicine.dosage || '').trim(),
          frequency: (medicine.frequency || '').trim(),
          duration: (medicine.duration || '').trim(),
        }))
        .filter((medicine) => medicine.name || medicine.dosage || medicine.frequency || medicine.duration);

      const prescriptionPayload = {
        diagnosis_details: (visitForm.details || '').trim(),
        special_instructions: (visitForm.specialInstructions || '').trim(),
        medicines,
        recommended_tests: (visitForm.testsRecommended || '').trim(),
        follow_up_suggestions: (visitForm.followUpSuggestions || '').trim(),
      };

      await createVisit({
        appointment_id: visitForm.appointment_id,
        diagnosis: visitForm.diagnosis,
        prescription: JSON.stringify(prescriptionPayload),
        status: visitForm.status,
      });
      setSuccess('Prescription created and patient marked as visited for today');
      setVisitForm(initialVisit);
      await fetchAppointments();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create visit record');
    } finally {
      setSubmitting(false);
    }
  };

  const markNotVisited = async (appointmentId) => {
    setUpdatingId(String(appointmentId));
    setError('');
    setSuccess('');
    try {
      await updateAppointmentStatus({
        appointment_id: appointmentId,
        status: 'cancelled',
        notes: 'Removed from today queue by compounder: patient did not visit',
      });
      setSuccess('Patient removed from today queue (not visited).');
      await fetchAppointments();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update patient visit status');
    } finally {
      setUpdatingId('');
    }
  };

  const selectAppointmentForPrescription = (appointmentId) => {
    setVisitForm((prev) => ({ ...prev, appointment_id: String(appointmentId) }));
  };

  const updateMedicine = (index, field, value) => {
    setVisitForm((prev) => {
      const next = [...prev.medicines];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, medicines: next };
    });
  };

  const addMedicineRow = () => {
    setVisitForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '' }],
    }));
  };

  const removeMedicineRow = (index) => {
    setVisitForm((prev) => {
      if (prev.medicines.length === 1) {
        return { ...prev, medicines: [{ name: '', dosage: '', frequency: '', duration: '' }] };
      }
      return {
        ...prev,
        medicines: prev.medicines.filter((_, idx) => idx !== index),
      };
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />
      <Title order={2} mb="md">Compounder - Today's Patient Visits</Title>
      <Button type="button" variant="light" onClick={fetchAppointments} style={{ marginBottom: 12 }}>
        Refresh
      </Button>

      <Group mb="md">
        <Badge variant="light" color="blue">Today Queue: {todaysQueue.length}</Badge>
        <Badge variant="light" color="green">Visited Today: {todaysVisited.length}</Badge>
        <Badge variant="light" color="gray">Total Today: {todaysAppointments.length}</Badge>
      </Group>

      {loading ? <LoadingState text="Loading scheduled appointments..." /> : null}
      {error ? <ErrorState error={error} /> : null}
      {success ? <Alert color="green" mb="md">{success}</Alert> : null}

      {!loading ? (
        <Card withBorder radius="md" p="md" mb="md">
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Patient</Table.Th>
                <Table.Th>Doctor</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Time</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {todaysQueue.length ? (
                todaysQueue.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{row.id}</Table.Td>
                    <Table.Td>{row.patient}</Table.Td>
                    <Table.Td>{row.doctor}</Table.Td>
                    <Table.Td>{row.appointment_date}</Table.Td>
                    <Table.Td>{row.appointment_time}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={row.status === 'completed' ? 'green' : row.status === 'cancelled' ? 'red' : 'blue'}>
                        {row.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button size="xs" variant="light" onClick={() => selectAppointmentForPrescription(row.id)}>
                          Create Prescription
                        </Button>
                        <Button
                          size="xs"
                          color="red"
                          variant="outline"
                          loading={updatingId === String(row.id)}
                          onClick={() => markNotVisited(row.id)}
                        >
                          Didn't Visit
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={7}><Text c="dimmed">No patients pending in today's queue.</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      ) : null}

      <Card withBorder radius="md" p="md" maw={760}>
      <Title order={4} mb="md">Create Prescription For Visited Patient</Title>
      <form onSubmit={submitVisit} style={{ display: 'grid', gap: 8 }}>
        <TextInput
          placeholder="Appointment ID"
          value={visitForm.appointment_id}
          onChange={(e) => setVisitForm((prev) => ({ ...prev, appointment_id: e.target.value }))}
          required
        />
        <TextInput
          placeholder="Diagnosis"
          value={visitForm.diagnosis}
          onChange={(e) => setVisitForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
          required
        />
        <Textarea
          placeholder="Details"
          value={visitForm.details}
          onChange={(e) => setVisitForm((prev) => ({ ...prev, details: e.target.value }))}
          minRows={3}
        />
        <Textarea
          placeholder="Special Instructions"
          value={visitForm.specialInstructions}
          onChange={(e) => setVisitForm((prev) => ({ ...prev, specialInstructions: e.target.value }))}
          minRows={2}
        />
        <Textarea
          placeholder="Tests Recommended"
          value={visitForm.testsRecommended}
          onChange={(e) => setVisitForm((prev) => ({ ...prev, testsRecommended: e.target.value }))}
          minRows={2}
        />
        <Textarea
          placeholder="Follow-up Suggestions"
          value={visitForm.followUpSuggestions}
          onChange={(e) => setVisitForm((prev) => ({ ...prev, followUpSuggestions: e.target.value }))}
          minRows={2}
        />

        <Title order={6}>Medicines</Title>
        {visitForm.medicines.map((medicine, index) => (
          <Group key={`${medicine.name || "medicine"}-${medicine.dosage || ""}-${medicine.frequency || ""}-${index}`} align="end" grow>
            <TextInput
              label="Medicine"
              placeholder="e.g. Atorvastatin"
              value={medicine.name}
              onChange={(e) => updateMedicine(index, 'name', e.target.value)}
            />
            <TextInput
              label="Dosage"
              placeholder="e.g. 1 tablet"
              value={medicine.dosage}
              onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
            />
            <TextInput
              label="Frequency"
              placeholder="e.g. 1 time/day"
              value={medicine.frequency}
              onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
            />
            <TextInput
              label="Duration"
              placeholder="e.g. 5 days"
              value={medicine.duration}
              onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
            />
            <Button type="button" color="red" variant="outline" onClick={() => removeMedicineRow(index)}>
              Remove
            </Button>
          </Group>
        ))}

        <Group>
          <Button type="button" variant="default" onClick={addMedicineRow}>Add Medicine</Button>
        </Group>

        <Select
          value={visitForm.status}
          onChange={(value) => setVisitForm((prev) => ({ ...prev, status: value || 'completed' }))}
          data={[
            { value: 'completed', label: 'completed' },
            { value: 'cancelled', label: 'cancelled' },
          ]}
        />
        <Button type="submit" loading={submitting}>
          {submitting ? 'Saving...' : 'Create Prescription'}
        </Button>
      </form>
      </Card>
    </div>
  );
};

export default CompAppointments;
