import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createAppointment, getAppointments, getDoctorAvailability, getDoctors } from './api';
import AppointmentForm from './components/AppointmentForm';
import AppointmentsTable from './components/AppointmentsTable';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import PHCNav from './components/PHCNav';
import { Badge, Button, Card, Grid, Group, Select, Text, Title } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import '@mantine/dates/styles.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [availabilityDoctorId, setAvailabilityDoctorId] = useState('');
  const [availabilityCalendarDate, setAvailabilityCalendarDate] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAppointments();
      setAppointments(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await getDoctors();
      setDoctors(data || []);
    } catch (e) {
      // Keep page usable even if doctor list fetch fails.
      setDoctors([]);
    }
  };

  const fetchAvailability = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDoctorAvailability({
        date: availabilityDate || undefined,
        doctor_id: availabilityDoctorId || undefined,
      });
      setAvailability(data?.availability || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForApi = (dateObj) => {
    if (!dateObj) {
      return '';
    }
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dayToIndex = (value) => {
    const raw = String(value || '').trim().toLowerCase();
    if (/^\d+$/.test(raw)) {
      const asNum = Number(raw);
      return asNum >= 0 && asNum <= 6 ? asNum : null;
    }

    const map = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 0,
    };
    return map[raw] ?? null;
  };

  const selectedDoctor = doctors.find((doc) => String(doc.doctor_id) === String(availabilityDoctorId));
  const availableWeekdays = new Set(
    (selectedDoctor?.master_schedule || [])
      .map((row) => dayToIndex(row.day))
      .filter((idx) => idx !== null),
  );

  const isDateAvailableForDoctor = (dateObj) => {
    if (!availabilityDoctorId || !selectedDoctor) {
      return false;
    }
    return availableWeekdays.has(dateObj.getDay());
  };

  const handleSelectAvailabilityDate = (value) => {
    setAvailabilityCalendarDate(value);
    setAvailabilityDate(formatDateForApi(value));
  };

  const handleSelectDoctorId = useCallback((value) => {
    setAvailabilityDoctorId(value || '');
  }, []);

  const doctorOptions = useMemo(
    () => doctors.map((doc) => ({
      value: String(doc.doctor_id),
      label: `${doc.doctor_name}${doc.specialization ? ` (${doc.specialization})` : ''}`,
    })),
    [doctors],
  );

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    setError('');
    try {
      await createAppointment(payload);
      await fetchAppointments();
      await fetchAvailability();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />
      
      <Title order={2} mb="sm">PHC - Appointments</Title><Card withBorder radius="md" p="md" mb="md">
        <AppointmentForm onSubmit={handleCreate} submitting={submitting} doctors={doctors} />
      </Card>

      <Card withBorder radius="md" p="md" mb="md">
        <Text fw={700} mb="sm">Doctor Availability</Text>
        <Group style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Select
            placeholder="Select doctor"
            data={doctorOptions}
            value={availabilityDoctorId}
            onChange={handleSelectDoctorId}
            searchable
            clearable
            style={{ minWidth: 280 }}
          />
          <Button type="button" variant="light" onClick={fetchAvailability}>View Doctor Availability</Button>
        </Group>

        <Card withBorder radius="md" p="sm" mb="md">
          <Text size="sm" fw={600} mb="xs">Availability Calendar</Text>
          <DatePicker
            value={availabilityCalendarDate}
            onChange={handleSelectAvailabilityDate}
            renderDay={(date) => {
              const day = date.getDate();
              const isAvailable = isDateAvailableForDoctor(date);
              return (
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isAvailable ? '#d3f9d8' : 'transparent',
                    border: isAvailable ? '1px solid #40c057' : '1px solid transparent',
                    color: isAvailable ? '#2b8a3e' : 'inherit',
                    fontWeight: isAvailable ? 700 : 400,
                  }}
                >
                  {day}
                </div>
              );
            }}
          />
          <Text size="xs" c="dimmed" mt="xs">
            Select a doctor to highlight available days. Then pick a date and click "View Doctor Availability".
          </Text>
        </Card>

        {!loading && availabilityDate && availabilityDoctorId ? (
          <Text size="sm" c="dimmed">
            Availability loaded for selected doctor on {availabilityDate}.
          </Text>
        ) : null}
      </Card>

      {loading ? <LoadingState text="Fetching appointments..." /> : null}
      {error ? <ErrorState error={error} /> : null}
      {!loading && !error ? (
        <Card withBorder radius="md" p="md">
          <Text fw={700} mb="sm">My Appointments</Text>
          <AppointmentsTable data={appointments} />
        </Card>
      ) : null}
    </div>
  );
};

export default Appointments;