import React, { useMemo, useState } from 'react';
import { Badge, Button, Grid, Group, Select, Text, TextInput, Title } from '@mantine/core';

const initialState = {
  patient_id: '',
  doctor_id: '',
  appointment_type: 'OPD',
  appointment_date: '',
  appointment_time: '',
  chief_complaint: '',
};

const dayToCode = (value) => {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (/^[0-6]$/.test(s)) return s;
  const map = {
    monday: '0',
    tuesday: '1',
    wednesday: '2',
    thursday: '3',
    friday: '4',
    saturday: '5',
    sunday: '6',
  };
  return map[s.toLowerCase()] ?? null;
};

const formatDateYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const buildTimeSlots = (fromTime, toTime) => {
  if (!fromTime || !toTime) return [];
  const [fh, fm] = fromTime.split(':').map(Number);
  const [th, tm] = toTime.split(':').map(Number);
  if ([fh, fm, th, tm].some(Number.isNaN)) return [];

  let start = fh * 60 + fm;
  const end = th * 60 + tm;
  if (start > end) return [];

  const slots = [];
  while (start <= end) {
    const h = String(Math.floor(start / 60)).padStart(2, '0');
    const m = String(start % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
    start += 30;
  }
  return slots;
};

const AppointmentForm = ({ onSubmit, submitting, doctors = [] }) => {
  const [form, setForm] = useState(initialState);
  const [formError, setFormError] = useState('');

  const doctorOptions = doctors.map((doctor) => ({
    value: String(doctor.doctor_id),
    label: `${doctor.doctor_name} (${doctor.specialization})`,
  }));

  const selectedDoctor = useMemo(
    () => doctors.find((doc) => String(doc.doctor_id) === String(form.doctor_id)),
    [doctors, form.doctor_id]
  );

  const availableDayCodes = useMemo(() => {
    const schedule = selectedDoctor?.master_schedule || [];
    return new Set(
      schedule
        .map((row) => dayToCode(row.day))
        .filter((row) => row !== null)
    );
  }, [selectedDoctor]);

  const highlightedDates = useMemo(() => {
    if (!availableDayCodes.size) return [];
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 21; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const weekday = String((d.getDay() + 6) % 7);
      if (availableDayCodes.has(weekday)) {
        dates.push(formatDateYmd(d));
      }
    }
    return dates;
  }, [availableDayCodes]);

  const selectedDateSlots = useMemo(() => {
    if (!selectedDoctor || !form.appointment_date) return [];
    const d = new Date(form.appointment_date);
    if (Number.isNaN(d.getTime())) return [];
    const weekday = String((d.getDay() + 6) % 7);
    const schedule = selectedDoctor.master_schedule || [];
    const daySchedule = schedule.find((row) => dayToCode(row.day) === weekday);
    if (!daySchedule) return [];
    return buildTimeSlots(daySchedule.from_time, daySchedule.to_time);
  }, [selectedDoctor, form.appointment_date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setFormError('');

    if (!highlightedDates.includes(form.appointment_date)) {
      setFormError('Selected date is outside the doctor availability days. Please choose a highlighted date.');
      return;
    }

    if (!selectedDateSlots.includes(form.appointment_time)) {
      setFormError('Selected time is outside the doctor schedule. Please choose an available slot.');
      return;
    }

    const payload = {
      ...form,
      doctor_id: form.doctor_id ? Number(form.doctor_id) : null,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 8 }}>
      <Title order={4} mb="md">Book Appointment</Title>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <TextInput
            name="patient_id"
            label="Patient ID"
            placeholder="Optional legacy"
            value={form.patient_id}
            onChange={handleChange}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Select
            name="doctor_id"
            label="Doctor ID"
            placeholder="Select doctor"
            value={form.doctor_id}
            onChange={(value) => setForm((prev) => ({
              ...prev,
              doctor_id: value || '',
              appointment_date: '',
              appointment_time: '',
            }))}
            data={doctorOptions}
            searchable
            required
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Select
            name="appointment_type"
            label="Type"
            value={form.appointment_type}
            onChange={(value) => setForm((prev) => ({ ...prev, appointment_type: value || 'OPD' }))}
            data={[
              { value: 'OPD', label: 'OPD' },
              { value: 'EMERGENCY', label: 'Emergency' },
              { value: 'FOLLOW_UP', label: 'Follow Up' },
              { value: 'VACCINATION', label: 'Vaccination' },
              { value: 'LAB_TEST', label: 'Lab Test' },
              { value: 'WELLNESS_CHECK', label: 'Wellness Check' },
            ]}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <TextInput
            name="appointment_date"
            type="date"
            label="Date"
            value={form.appointment_date}
            onChange={handleChange}
            min={formatDateYmd(new Date())}
            required
          />
          {form.doctor_id ? (
            <Group gap="xs" mt="xs">
              {highlightedDates.slice(0, 8).map((d) => (
                <Badge
                  key={d}
                  variant={form.appointment_date === d ? 'filled' : 'light'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setForm((prev) => ({ ...prev, appointment_date: d, appointment_time: '' }))}
                >
                  {d}
                </Badge>
              ))}
            </Group>
          ) : null}
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Select
            name="appointment_time"
            label="Time Slot"
            placeholder={form.appointment_date ? 'Select available slot' : 'Select date first'}
            value={form.appointment_time}
            onChange={(value) => setForm((prev) => ({ ...prev, appointment_time: value || '' }))}
            data={selectedDateSlots.map((slot) => ({ value: slot, label: slot }))}
            disabled={!form.appointment_date || selectedDateSlots.length === 0}
            searchable
            required
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 12, lg: 4 }}>
          <TextInput
            name="chief_complaint"
            label="Chief Complaint"
            placeholder="Optional"
            value={form.chief_complaint}
            onChange={handleChange}
          />
        </Grid.Col>
      </Grid>

      {formError ? (
        <Text c="red" size="sm" mt="sm">
          {formError}
        </Text>
      ) : null}

      <Button mt="md" type="submit" loading={submitting}>
        {submitting ? 'Booking...' : 'Book Appointment'}
      </Button>
    </form>
  );
};

export default React.memo(AppointmentForm);