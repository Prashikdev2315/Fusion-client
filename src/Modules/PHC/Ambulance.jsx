import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Grid, Group, Loader, Select, Table, Text, TextInput, Title } from '@mantine/core';
import { useSelector } from 'react-redux';
import { createAmbulanceRequest, getAmbulanceRequests } from './api';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import PHCNav from './components/PHCNav';

const Ambulance = () => {
  const phcRole = useSelector((state) => state.user.phcRole);
  const selectedRole = useSelector((state) => state.user.role);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requests, setRequests] = useState([]);

  const [payload, setPayload] = useState({
    patient_id: '',
    patient_name: '',
    emergency_level: 'URGENT',
    pickup_location: '',
    destination: '',
    reason: '',
  });

  const normalizedPhcRole = String(phcRole || '').toLowerCase();
  const normalizedRole = String(selectedRole || '').toLowerCase();
  const isProfessorView = normalizedRole === 'professor';
  const isAuditorView = /(auditor|audit|accounts)/.test(normalizedRole) || normalizedPhcRole === 'accounts';
  const isStaff = normalizedPhcRole === 'phc_staff' && !isProfessorView && !isAuditorView;
  const roleResolved =
    (selectedRole !== undefined && selectedRole !== null) ||
    (phcRole !== undefined && phcRole !== null);

  const pendingCount = useMemo(
    () => requests.filter((request) => String(request.status || '') === 'requested').length,
    [requests]
  );

  const fetchRequests = async () => {
    setFetching(true);
    setError('');
    try {
      const data = await getAmbulanceRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Failed to load ambulance activity');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isStaff) {
      fetchRequests();
    } else {
      setRequests([]);
    }
  }, [isStaff]);

  const submitRequest = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await createAmbulanceRequest(payload);
      setSuccess('Ambulance request submitted successfully!');
      setPayload({
        patient_id: '',
        patient_name: '',
        emergency_level: 'URGENT',
        pickup_location: '',
        destination: '',
        reason: '',
      });
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Failed to create ambulance request');
    } finally {
      setLoading(false);
    }
  };

  if (!roleResolved) {
    return (
      <div style={{ padding: 16 }}>
        <PHCNav />
        <Loader />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div style={{ padding: 16 }}>
        <PHCNav />
        <Title order={2} mb="md">PHC - Ambulance Request</Title>

        <Card withBorder radius="md" p="md" mb="md">
          <Text fw={600} mb="xs">Request Ambulance</Text>
          <Text size="sm" c="dimmed" mb="md">
            Submit an ambulance request. PHC staff will review and process it.
          </Text>

          <form onSubmit={submitRequest}>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                <TextInput
                  placeholder="Patient ID (optional)"
                  value={payload.patient_id}
                  onChange={(e) => setPayload({ ...payload, patient_id: e.target.value })}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                <TextInput
                  placeholder="Patient Name (optional)"
                  value={payload.patient_name}
                  onChange={(e) => setPayload({ ...payload, patient_name: e.target.value })}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                <Select
                  value={payload.emergency_level}
                  onChange={(value) => setPayload({ ...payload, emergency_level: value || 'URGENT' })}
                  data={[
                    { value: 'CRITICAL', label: 'CRITICAL' },
                    { value: 'URGENT', label: 'URGENT' },
                    { value: 'ROUTINE', label: 'ROUTINE' },
                  ]}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                <TextInput
                  placeholder="Pickup Location"
                  value={payload.pickup_location}
                  onChange={(e) => setPayload({ ...payload, pickup_location: e.target.value })}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                <TextInput
                  placeholder="Destination"
                  value={payload.destination}
                  onChange={(e) => setPayload({ ...payload, destination: e.target.value })}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                <TextInput
                  placeholder="Reason"
                  value={payload.reason}
                  onChange={(e) => setPayload({ ...payload, reason: e.target.value })}
                  required
                />
              </Grid.Col>
            </Grid>
            <Button mt="md" type="submit" loading={loading}>Request Ambulance</Button>
          </form>
        </Card>

        {error && <ErrorState error={error} />}
        {success && (
          <Card withBorder radius="md" p="md" mb="md" style={{ backgroundColor: '#d3f9d8', borderColor: '#51cf66' }}>
            <Text c="green" fw={500}>{success}</Text>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />
      <Title order={2} mb="md">PHC - Ambulance</Title>

      <Card withBorder radius="md" p="md" mb="md">
        <Group justify="space-between" mb="xs">
          <div>
            <Text fw={600}>Ambulance Activity</Text>
            <Text size="sm" c="dimmed">Records visible to PHC staff only.</Text>
          </div>
          <Group gap="sm">
            <Badge color="orange" variant="light">Pending: {pendingCount}</Badge>
            <Button onClick={fetchRequests} loading={fetching} variant="light" size="sm">
              Refresh
            </Button>
          </Group>
        </Group>

        {fetching ? (
          <Loader />
        ) : requests.length === 0 ? (
          <Text c="dimmed">No ambulance activity recorded yet.</Text>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Patient</Table.Th>
                  <Table.Th>Pickup</Table.Th>
                  <Table.Th>Destination</Table.Th>
                  <Table.Th>Requested</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {requests.map((request) => (
                  <Table.Tr key={request.id}>
                    <Table.Td fw={500}>{request.id}</Table.Td>
                    <Table.Td>{request.patient_name}</Table.Td>
                    <Table.Td>{request.pickup_location || '-'}</Table.Td>
                    <Table.Td>{request.destination || '-'}</Table.Td>
                    <Table.Td>{request.requested_at ? new Date(request.requested_at).toLocaleString() : '-'}</Table.Td>
                    <Table.Td>
                      <Badge variant="light">{request.status || 'requested'}</Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        )}
      </Card>

      <Card withBorder radius="md" p="md" mb="md">
        <form onSubmit={submitRequest}>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <TextInput placeholder="Patient ID (optional)" value={payload.patient_id} onChange={(e) => setPayload({ ...payload, patient_id: e.target.value })} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <TextInput placeholder="Patient Name" value={payload.patient_name} onChange={(e) => setPayload({ ...payload, patient_name: e.target.value })} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <Select
                value={payload.emergency_level}
                onChange={(value) => setPayload({ ...payload, emergency_level: value || 'URGENT' })}
                data={[
                  { value: 'CRITICAL', label: 'CRITICAL' },
                  { value: 'URGENT', label: 'URGENT' },
                  { value: 'ROUTINE', label: 'ROUTINE' },
                ]}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <TextInput placeholder="Pickup Location" value={payload.pickup_location} onChange={(e) => setPayload({ ...payload, pickup_location: e.target.value })} required />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <TextInput placeholder="Destination" value={payload.destination} onChange={(e) => setPayload({ ...payload, destination: e.target.value })} required />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
              <TextInput placeholder="Reason" value={payload.reason} onChange={(e) => setPayload({ ...payload, reason: e.target.value })} required />
            </Grid.Col>
          </Grid>
          <Button mt="md" type="submit">Request Ambulance</Button>
        </form>
      </Card>

      {loading && <LoadingState />}
      {error && <ErrorState error={error} />}
      {success && (
        <Card withBorder radius="md" p="md" mb="md" style={{ backgroundColor: '#d3f9d8', borderColor: '#51cf66' }}>
          <Text c="green" fw={500}>{success}</Text>
        </Card>
      )}
    </div>
  );
};

export default Ambulance;