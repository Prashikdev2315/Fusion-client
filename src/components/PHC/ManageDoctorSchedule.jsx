import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Button,
  Select,
  TimeInput,
  Group,
  Stack,
  Text,
  Card,
  Grid,
  Badge,
  Loader,
  Alert,
  Table,
  Modal,
  Divider,
  SimpleGrid,
  ActionIcon,
  ThemeIcon,
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconClock,
  IconAlertCircle,
  IconCheck,
  IconEdit,
} from '@tabler/icons-react';
import axios from 'axios';
import './ManageDoctorSchedule.css';
import logger from '../../utils/logger';

/**
 * UC-07: Manage Doctor Master Schedule Component
 * Allows PHC staff to create and manage doctor availability schedules
 */
const ManageDoctorSchedule = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [editingDay, setEditingDay] = useState(null);

  const DAYS_OF_WEEK = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' },
  ];

  const HOURS = Array.from({ length: 24 }, (_, i) => ({
    value: String(i).padStart(2, '0'),
    label: `${String(i).padStart(2, '0')}:00`,
  }));

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/phc/doctors/list/', {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        const doctorsList = response.data.data.map((doc) => ({
          value: doc.id,
          label: doc.name || `Dr. ${doc.user.first_name} ${doc.user.last_name}`,
        }));
        setDoctors(doctorsList);
      }
    } catch (err) {
      logger.error('Failed to fetch doctors', err);
      setError('Failed to fetch doctors list');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorSchedule = async (doctorId) => {
    try {
      const response = await axios.get(`/phc/doctors/${doctorId}/schedule/`, {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setCurrentSchedule(response.data.data);
        // Initialize schedule from fetched data
        const scheduleMap = {};
        response.data.data.forEach((slot) => {
          scheduleMap[slot.day_of_week] = {
            start_time: slot.start_time,
            end_time: slot.end_time,
          };
        });
        setSchedule(scheduleMap);
      }
    } catch (err) {
      logger.error('Failed to fetch schedule', err);
      setSchedule({});
    }
  };

  const handleSelectDoctor = (doctorId) => {
    setSelectedDoctor(doctorId);
    setError(null);
    setSuccess(null);
    if (doctorId) {
      fetchDoctorSchedule(doctorId);
    }
  };

  const handleAddShift = (dayValue) => {
    setEditingDay(dayValue);
  };

  const handleSaveShift = (dayValue, startTime, endTime) => {
    if (!startTime || !endTime) {
      setError('Please select both start and end times');
      return;
    }

    if (startTime >= endTime) {
      setError('Start time must be before end time');
      return;
    }

    setSchedule({
      ...schedule,
      [dayValue]: { start_time: startTime, end_time: endTime },
    });
    setEditingDay(null);
    setError(null);
  };

  const handleRemoveShift = (dayValue) => {
    const newSchedule = { ...schedule };
    delete newSchedule[dayValue];
    setSchedule(newSchedule);
  };

  const handleSaveSchedule = async () => {
    if (!selectedDoctor) {
      setError('Please select a doctor first');
      return;
    }

    if (Object.keys(schedule).length === 0) {
      setError('Please add at least one schedule shift');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Convert schedule object to array format
      const scheduleData = Object.entries(schedule).map(([day, times]) => ({
        day_of_week: parseInt(day),
        start_time: times.start_time,
        end_time: times.end_time,
      }));

      const response = await axios.post(
        '/phc/staff/doctor/schedule/',
        {
          doctor_id: selectedDoctor,
          schedule: scheduleData,
        },
        {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setSuccess('Doctor schedule updated successfully!');
        fetchDoctorSchedule(selectedDoctor);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.data.message || 'Failed to update schedule');
      }
    } catch (err) {
      logger.error('Failed to save schedule', err);
      setError(err.response?.data?.message || 'Error saving schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getDayLabel = (dayValue) => {
    return DAYS_OF_WEEK.find((d) => d.value === parseInt(dayValue))?.label || 'Unknown';
  };

  return (
    <Container size="lg" py="xl" className="schedule-manager">
      <Stack spacing="lg">
        {/* Header */}
        <div>
          <Group position="apart" align="center" mb="md">
            <div>
              <Text size="xl" weight={700}>
                Manage Doctor Schedule
              </Text>
              <Text size="sm" color="dimmed">
                Set doctor availability for each day of the week
              </Text>
            </div>
            <Badge size="lg" variant="filled" leftSection={<IconClock size={14} />}>
              UC-07
            </Badge>
          </Group>
        </div>

        {/* Alerts */}
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            {error}
          </Alert>
        )}
        {success && (
          <Alert icon={<IconCheck size={16} />} title="Success" color="green">
            {success}
          </Alert>
        )}

        {/* Doctor Selection */}
        <Paper p="lg" radius="md" withBorder className="selection-card">
          <Stack spacing="md">
            <div>
              <Text weight={600} mb="sm">
                Select Doctor
              </Text>
              <Select
                placeholder="Choose a doctor"
                searchable
                clearable
                value={selectedDoctor ? String(selectedDoctor) : null}
                onChange={(value) => handleSelectDoctor(value ? parseInt(value) : null)}
                data={doctors}
                icon={<IconClock size={16} />}
                disabled={loading}
              />
            </div>
            {loading && <Loader size="sm" />}
          </Stack>
        </Paper>

        {/* Schedule Editor */}
        {selectedDoctor && (
          <Paper p="lg" radius="md" withBorder className="schedule-editor">
            <Stack spacing="lg">
              <div>
                <Text weight={700} size="lg" mb="md">
                  Weekly Schedule
                </Text>

                <SimpleGrid cols={2} spacing="md" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
                  {DAYS_OF_WEEK.map((day) => (
                    <Card key={day.value} p="md" radius="md" withBorder className="day-card">
                      <Stack spacing="sm">
                        <Group position="apart" align="center">
                          <Text weight={600}>{day.label}</Text>
                          {schedule[day.value] && (
                            <Badge size="sm" color="blue" variant="light">
                              Scheduled
                            </Badge>
                          )}
                        </Group>

                        {schedule[day.value] ? (
                          <>
                            <div className="time-display">
                              <Text size="sm" color="dimmed">
                                Shift Time
                              </Text>
                              <Group spacing="xs">
                                <Badge size="lg" variant="outline" leftSection={<IconClock size={12} />}>
                                  {schedule[day.value].start_time}:00 - {schedule[day.value].end_time}:00
                                </Badge>
                              </Group>
                            </div>
                            <Group spacing="xs">
                              <Button
                                size="xs"
                                variant="light"
                                leftIcon={<IconEdit size={14} />}
                                onClick={() => handleAddShift(day.value)}
                                fullWidth
                              >
                                Edit
                              </Button>
                              <ActionIcon
                                size="lg"
                                color="red"
                                variant="light"
                                onClick={() => handleRemoveShift(day.value)}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </>
                        ) : (
                          <Button
                            size="xs"
                            variant="light"
                            leftIcon={<IconPlus size={14} />}
                            onClick={() => handleAddShift(day.value)}
                            fullWidth
                          >
                            Add Shift
                          </Button>
                        )}
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              </div>

              {/* Shift Editor Modal */}
              {editingDay !== null && (
                <ShiftEditorModal
                  day={editingDay}
                  dayLabel={getDayLabel(editingDay)}
                  currentShift={schedule[editingDay]}
                  hours={HOURS}
                  onSave={(startTime, endTime) => handleSaveShift(editingDay, startTime, endTime)}
                  onClose={() => setEditingDay(null)}
                />
              )}

              {/* Schedule Summary */}
              {Object.keys(schedule).length > 0 && (
                <div className="schedule-summary">
                  <Divider my="md" />
                  <Text weight={600} mb="md">
                    Schedule Summary
                  </Text>
                  <Table striped highlightOnHover size="sm">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Shift Time</th>
                        <th>Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(schedule).map(([day, times]) => {
                        const hours = parseInt(times.end_time) - parseInt(times.start_time);
                        return (
                          <tr key={day}>
                            <td>{getDayLabel(day)}</td>
                            <td>
                              {times.start_time}:00 - {times.end_time}:00
                            </td>
                            <td>{hours} hours</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Save Button */}
              <Button
                size="md"
                onClick={handleSaveSchedule}
                loading={saving}
                leftIcon={<IconCheck size={18} />}
              >
                {saving ? 'Saving Schedule...' : 'Save Schedule'}
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Current Schedule Display */}
        {currentSchedule && currentSchedule.length > 0 && (
          <Paper p="lg" radius="md" withBorder className="current-schedule">
            <Text weight={700} size="lg" mb="md">
              Current Active Schedule
            </Text>
            <SimpleGrid cols={2} spacing="md" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
              {currentSchedule.map((slot, idx) => (
                <Card key={`${slot.day_of_week || slot.day || "day"}-${slot.start_time || "start"}-${slot.end_time || "end"}-${idx}`} p="md" radius="md" withBorder className="slot-card">
                  <Group position="apart" mb="xs">
                    <Text weight={600}>{getDayLabel(slot.day_of_week)}</Text>
                    <ThemeIcon size="lg" variant="light" radius="md">
                      <IconClock size={16} />
                    </ThemeIcon>
                  </Group>
                  <Text size="sm" color="dimmed">
                    {slot.start_time}:00 - {slot.end_time}:00
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          </Paper>
        )}
      </Stack>
    </Container>
  );
};

// Shift Editor Modal Component
const ShiftEditorModal = ({ day, dayLabel, currentShift, hours, onSave, onClose }) => {
  const [startTime, setStartTime] = useState(currentShift?.start_time || '09');
  const [endTime, setEndTime] = useState(currentShift?.end_time || '17');

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={`Edit ${dayLabel} Shift`}
      centered
      size="md"
    >
      <Stack spacing="md">
        <Select
          label="Start Time"
          placeholder="Select start time"
          value={startTime}
          onChange={setStartTime}
          data={hours}
          icon={<IconClock size={16} />}
        />
        <Select
          label="End Time"
          placeholder="Select end time"
          value={endTime}
          onChange={setEndTime}
          data={hours}
          icon={<IconClock size={16} />}
        />
        <Group position="right" spacing="sm">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(startTime, endTime)}>
            Save Shift
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ManageDoctorSchedule;
