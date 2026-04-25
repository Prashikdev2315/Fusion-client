import React, { useEffect, useState } from 'react';
import {
  Alert, Button, Card, Group, Loader, Stack, 
  Table, Text, TextInput, Textarea, Title,
} from '@mantine/core';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import PHCNav from '../components/PHCNav';
import { downloadPdfReport } from '../utils/pdfExport';
import { getAmbulanceLogs, logEmergencyAmbulanceTrip } from '../api';

const AmbulanceLoggerUC11 = () => {
  const phcRole = useSelector((state) => state.user.phcRole);
  const selectedRole = useSelector((state) => state.user.role);
  const normalizedPhcRole = String(phcRole || '').toLowerCase();
  const normalizedRole = String(selectedRole || '').toLowerCase();
  const isProfessorView = normalizedRole === 'professor';
  const isAuditorView = /(auditor|audit|accounts)/.test(normalizedRole) || normalizedPhcRole === 'accounts';
  const isStaff = normalizedPhcRole === 'phc_staff' && !isProfessorView && !isAuditorView;
  
  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState({
    patient_name: '',
    pickup_location: '',
    destination: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    fetchLogs(false);
  }, []);
  
  const fetchLogs = async (showError = true) => {
    setLoading(true);
    try {
      const response = await getAmbulanceLogs({ limit: 100 });
      const logsData = response?.logs || [];
      setLogs(logsData);
    } catch (err) {
      if (showError) setError(err?.response?.data?.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateLog = async () => {
    if (!newLog.patient_name.trim() || !newLog.pickup_location.trim() || !newLog.destination.trim()) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await logEmergencyAmbulanceTrip({ ...newLog, status: 'requested' });
      setSuccess('✅ Log created!');
      setNewLog({ patient_name: '', pickup_location: '', destination: '', notes: '' });
      await fetchLogs();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadLogsAsPdf = () => {
    if (logs.length === 0) {
      setError('No logs to download');
      return;
    }

    downloadPdfReport({
      fileName: `ambulance_logs_${new Date().toISOString().split('T')[0]}.pdf`,
      title: 'Ambulance Usage Logs',
      subtitle: 'Downloaded from the PHC ambulance logging screen.',
      metadata: [
        ['Total Logs', logs.length],
      ],
      sections: [
        {
          title: 'Log Entries',
          headers: ['ID', 'Patient Name', 'Pickup Location', 'Destination', 'Status', 'Requested Date', 'Notes'],
          rows: logs.map((log) => [
            log.log_id,
            log.patient_name,
            log.pickup_location,
            log.destination,
            log.status,
            log.requested_at ? new Date(log.requested_at).toLocaleString() : '-',
            log.notes || '',
          ]),
          headColor: [37, 99, 235],
        },
      ],
    });
  };

  if (!isStaff) {
    return <Navigate to="/phc/ambulance" replace />;
  }
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '20px' }}>
      <PHCNav />
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Title order={2} mb="lg">Log Ambulance Usage</Title>
        
        {error && <Alert color="red" mb="lg" withCloseButton onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert color="green" mb="lg" withCloseButton onClose={() => setSuccess('')}>{success}</Alert>}
        
        <Card withBorder={false} p="lg" style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Stack gap="md">
            <Text fw={600} size="lg">Create New Ambulance Log Entry</Text>
            <TextInput label="Patient Name *" placeholder="Enter patient name" value={newLog.patient_name} onChange={(e) => setNewLog({ ...newLog, patient_name: e.target.value })} />
            <TextInput label="Pickup Location *" placeholder="e.g., Hospital Main Gate" value={newLog.pickup_location} onChange={(e) => setNewLog({ ...newLog, pickup_location: e.target.value })} />
            <TextInput label="Destination *" placeholder="e.g., City Medical Center" value={newLog.destination} onChange={(e) => setNewLog({ ...newLog, destination: e.target.value })} />
            <Textarea label="Notes" placeholder="Any additional information" value={newLog.notes} onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })} minRows={3} />
            <Button onClick={handleCreateLog} loading={loading} fullWidth>Create Log</Button>
          </Stack>
        </Card>

        <Card withBorder={false} p="lg" mt="lg" style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Stack gap="md">
            <Text fw={600} size="lg">View Logs</Text>
            {loading ? <Loader /> : logs.length === 0 ? <Text c="dimmed" ta="center" py="md">No logs found.</Text> : (
              <>
                <Group mb="md">
                    <Button onClick={downloadLogsAsPdf} variant="outline">📥 Download PDF</Button>
                </Group>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr><Table.Th>Patient</Table.Th><Table.Th>Pickup</Table.Th><Table.Th>Destination</Table.Th><Table.Th>Requested At</Table.Th></Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {logs.map((log) => (
                      <Table.Tr key={log.log_id}>
                        <Table.Td>{log.patient_name}</Table.Td>
                        <Table.Td>{log.pickup_location}</Table.Td>
                        <Table.Td>{log.destination}</Table.Td>
                        <Table.Td>{log.requested_at ? new Date(log.requested_at).toLocaleString() : '-'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </>
            )}
          </Stack>
        </Card>
      </div>
    </div>
  );
};

export default AmbulanceLoggerUC11;

