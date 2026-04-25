import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Button,
  Select,
  Radio,
  Group,
  Stack,
  Text,
  Card,
  Grid,
  Badge,
  Loader,
  Alert,
  Table,
  Textarea,
  SimpleGrid,
  Timeline,
  ThemeIcon,
  RingProgress,
  Center,
} from '@mantine/core';
import {
  IconUserCheck,
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconCalendar,
  IconCheckCircle,
  IconXCircle,
  IconHelp,
} from '@tabler/icons-react';
import axios from 'axios';
import dayjs from 'dayjs';
import './DoctorAttendance.css';
import logger from '../../utils/logger';

/**
 * UC-08: Mark Doctor Attendance Component
 * Allows PHC staff to mark doctor attendance (present/absent/leave/half-day)
 */
const DoctorAttendance = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [status, setStatus] = useState('present');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    leave: 0,
    halfDay: 0,
  });

  const ATTENDANCE_STATUS = [
    { value: 'present', label: 'Present', color: 'green' },
    { value: 'absent', label: 'Absent', color: 'red' },
    { value: 'leave', label: 'Leave', color: 'yellow' },
    { value: 'half_day', label: 'Half Day', color: 'blue' },
  ];

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
    fetchTodayAttendance();
    fetchAttendanceHistory();
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

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get(
        `/phc/staff/doctor/attendance/?date=${dayjs().format('YYYY-MM-DD')}`,
        {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        setTodayAttendance(response.data.data);
        updateStats(response.data.data);
      }
    } catch (err) {
      logger.error('Failed to fetch today attendance', err);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const response = await axios.get(
        `/phc/staff/doctor/attendance/history/?days=7`,
        {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        setAttendanceHistory(response.data.data);
      }
    } catch (err) {
      logger.error('Failed to fetch attendance history', err);
    }
  };

  const updateStats = (attendanceList) => {
    const newStats = { present: 0, absent: 0, leave: 0, halfDay: 0 };
    attendanceList.forEach((record) => {
      if (record.status === 'present') newStats.present++;
      else if (record.status === 'absent') newStats.absent++;
      else if (record.status === 'leave') newStats.leave++;
      else if (record.status === 'half_day') newStats.halfDay++;
    });
    setStats(newStats);
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();

    if (!selectedDoctor) {
      setError('Please select a doctor');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await axios.post(
        '/phc/staff/doctor/attendance/',
        {
          doctor_id: selectedDoctor,
          attendance_date: attendanceDate,
          status: status,
          remarks: remarks || null,
        },
        {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setSuccess('Attendance marked successfully!');
        setRemarks('');
        fetchTodayAttendance();
        fetchAttendanceHistory();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.data.message || 'Failed to mark attendance');
      }
    } catch (err) {
      logger.error('Failed to mark attendance', err);
      setError(err.response?.data?.message || 'Error marking attendance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <IconCheckCircle size={16} color="green" />;
      case 'absent':
        return <IconXCircle size={16} color="red" />;
      case 'leave':
        return <IconHelp size={16} color="orange" />;
      case 'half_day':
        return <IconCheckCircle size={16} color="blue" />;
      default:
        return <IconClock size={16} />;
    }
  };

  const getStatusColor = (status) => {
    const found = ATTENDANCE_STATUS.find((s) => s.value === status);
    return found?.color || 'gray';
  };

  return (
    <Container size="lg" py="xl" className="attendance-manager">
      <Stack spacing="lg">
        {/* Header */}
        <div>
          <Group position="apart" align="center" mb="md">
            <div>
              <Text size="xl" weight={700}>
                Mark Doctor Attendance
              </Text>
              <Text size="sm" color="dimmed">
                Record doctor presence for today and manage attendance records
              </Text>
            </div>
            <Badge size="lg" variant="filled" leftSection={<IconUserCheck size={14} />}>
              UC-08
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

        <Grid gutter="lg">
          {/* Attendance Form */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="lg" radius="md" withBorder className="form-card">
              <Stack spacing="md">
                <Text weight={700} size="lg">
                  Mark Attendance
                </Text>

                <Select
                  label="Doctor"
                  placeholder="Select a doctor"
                  searchable
                  clearable
                  value={selectedDoctor ? String(selectedDoctor) : null}
                  onChange={(value) => setSelectedDoctor(value ? parseInt(value) : null)}
                  data={doctors}
                  icon={<IconUserCheck size={16} />}
                  disabled={loading}
                  required
                />

                <div>
                  <Text size="sm" weight={600} mb="xs">
                    Attendance Date
                  </Text>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    max={dayjs().format('YYYY-MM-DD')}
                    className="date-input"
                  />
                </div>

                <div>
                  <Text size="sm" weight={600} mb="xs">
                    Status
                  </Text>
                  <Radio.Group value={status} onChange={setStatus}>
                    <Stack spacing="xs">
                      {ATTENDANCE_STATUS.map((s) => (
                        <Radio
                          key={s.value}
                          value={s.value}
                          label={s.label}
                          icon={getStatusIcon}
                          className={`status-radio status-${s.value}`}
                        />
                      ))}
                    </Stack>
                  </Radio.Group>
                </div>

                <Textarea
                  label="Remarks (Optional)"
                  placeholder="Add any remarks or notes"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  minRows={3}
                />

                <Button
                  size="md"
                  onClick={handleMarkAttendance}
                  loading={submitting}
                  leftIcon={<IconCheck size={18} />}
                >
                  Mark Attendance
                </Button>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Today's Statistics */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <SimpleGrid cols={2} spacing="md">
              <Card p="md" radius="md" withBorder className="stat-card present">
                <Stack spacing="xs" align="center">
                  <ThemeIcon size="lg" variant="light" color="green" radius="md">
                    <IconCheckCircle size={24} />
                  </ThemeIcon>
                  <Text size="sm" color="dimmed" weight={500}>
                    Present
                  </Text>
                  <Text size="xl" weight={700}>
                    {stats.present}
                  </Text>
                </Stack>
              </Card>

              <Card p="md" radius="md" withBorder className="stat-card absent">
                <Stack spacing="xs" align="center">
                  <ThemeIcon size="lg" variant="light" color="red" radius="md">
                    <IconXCircle size={24} />
                  </ThemeIcon>
                  <Text size="sm" color="dimmed" weight={500}>
                    Absent
                  </Text>
                  <Text size="xl" weight={700}>
                    {stats.absent}
                  </Text>
                </Stack>
              </Card>

              <Card p="md" radius="md" withBorder className="stat-card leave">
                <Stack spacing="xs" align="center">
                  <ThemeIcon size="lg" variant="light" color="yellow" radius="md">
                    <IconHelp size={24} />
                  </ThemeIcon>
                  <Text size="sm" color="dimmed" weight={500}>
                    Leave
                  </Text>
                  <Text size="xl" weight={700}>
                    {stats.leave}
                  </Text>
                </Stack>
              </Card>

              <Card p="md" radius="md" withBorder className="stat-card halfday">
                <Stack spacing="xs" align="center">
                  <ThemeIcon size="lg" variant="light" color="blue" radius="md">
                    <IconCheckCircle size={24} />
                  </ThemeIcon>
                  <Text size="sm" color="dimmed" weight={500}>
                    Half Day
                  </Text>
                  <Text size="xl" weight={700}>
                    {stats.halfDay}
                  </Text>
                </Stack>
              </Card>
            </SimpleGrid>
          </Grid.Col>
        </Grid>

        {/* Today's Attendance List */}
        {todayAttendance.length > 0 && (
          <Paper p="lg" radius="md" withBorder className="attendance-list">
            <Text weight={700} size="lg" mb="md">
              Today's Attendance ({dayjs().format('MMMM DD, YYYY')})
            </Text>
            <Table striped highlightOnHover>
              <thead>
                <tr>
                  <th>Doctor Name</th>
                  <th>Status</th>
                  <th>Time Marked</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {todayAttendance.map((record, idx) => (
                  <tr key={idx}>
                    <td>
                      <Group spacing="xs">
                        {getStatusIcon(record.status)}
                        <Text>{record.doctor_name}</Text>
                      </Group>
                    </td>
                    <td>
                      <Badge color={getStatusColor(record.status)} variant="light">
                        {record.status.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td>{dayjs(record.marked_at).format('HH:mm')}</td>
                    <td>{record.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Paper>
        )}

        {/* Attendance History */}
        {attendanceHistory.length > 0 && (
          <Paper p="lg" radius="md" withBorder className="history-card">
            <Text weight={700} size="lg" mb="md">
              Attendance History (Last 7 Days)
            </Text>
            <Timeline active={attendanceHistory.length} bulletSize={24} lineWidth={2}>
              {attendanceHistory.map((record, idx) => (
                <Timeline.Item
                  key={idx}
                  bullet={getStatusIcon(record.status)}
                  title={
                    <Group spacing="xs">
                      <Text weight={600}>{record.doctor_name}</Text>
                      <Badge color={getStatusColor(record.status)} size="sm" variant="light">
                        {record.status.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </Group>
                  }
                  subtitle={
                    <Text size="sm" mt={4} color="dimmed">
                      {dayjs(record.attendance_date).format('MMMM DD, YYYY')}
                      {record.remarks && ` - ${record.remarks}`}
                    </Text>
                  }
                />
              ))}
            </Timeline>
          </Paper>
        )}
      </Stack>
    </Container>
  );
};

export default DoctorAttendance;
