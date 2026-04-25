import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PHCNav from '../components/PHCNav';
import {
  Container,
  Table,
  Button,
  Group,
  Card,
  Select,
  TextInput,
  Badge,
  Loader,
  Alert,
  Stack,
  Text,
  Title,
  Grid,
} from '@mantine/core';
import { Calendar, Download } from '@phosphor-icons/react';
import { downloadPdfReport } from '../utils/pdfExport';
import { host } from '../../../routes/globalRoutes';

const AuditorActionHistory = () => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    action: 'all',
    start_date: '',
    end_date: '',
  });
  const [stats, setStats] = useState({
    total_actions: 0,
    approved_count: 0,
    rejected_count: 0,
  });

  const fetchActionHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.action && filters.action !== 'all') {
        params.append('action', filters.action);
      }
      if (filters.start_date) {
        params.append('start_date', filters.start_date);
      }
      if (filters.end_date) {
        params.append('end_date', filters.end_date);
      }
      params.append('limit', '100');
      
      const response = await axios.get(
        `${host}/healthcenter/phc/auditor/action-history/?${params}`,
        { headers: { Authorization: `Token ${token}` } }
      );
      
      if (response.data?.success) {
        setActions(response.data.data.actions || []);
        setStats({
          total_actions: response.data.data.total_actions,
          approved_count: response.data.data.approved_count,
          rejected_count: response.data.data.rejected_count,
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch action history');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchActionHistory();
  }, [fetchActionHistory]);

  const downloadPdf = () => {
    if (actions.length === 0) {
      alert('No data to download');
      return;
    }

    downloadPdfReport({
      fileName: `auditor_action_history_${new Date().toISOString().split('T')[0]}.pdf`,
      title: 'Auditor Action History',
      subtitle: 'Audit trail for reimbursement and related PHC actions.',
      metadata: [
        ['Total Actions', stats.total_actions],
        ['Approved', stats.approved_count],
        ['Rejected', stats.rejected_count],
      ],
      sections: [
        {
          title: 'Action Log',
          headers: ['Log ID', 'Action', 'Timestamp', 'Claim ID', 'Amount', 'Reason', 'Applicant', 'Status'],
          rows: actions.map((action) => [
            action.log_id,
            action.action,
            action.timestamp,
            action.claim_id || 'N/A',
            action.claim_amount || 'N/A',
            action.claim_reason || 'N/A',
            action.claim_user || 'N/A',
            action.claim_status || 'N/A',
          ]),
          headColor: [37, 99, 235],
        },
      ],
    });
  };

  const getActionBadge = (action) => {
    if (action.includes('approved')) return { label: 'Approved', color: 'green' };
    if (action.includes('rejected')) return { label: 'Rejected', color: 'red' };
    if (action.includes('forward')) return { label: 'Forwarded', color: 'blue' };
    return { label: action, color: 'gray' };
  };

  return (
    <Container size="lg" py="md">
      <PHCNav />
      <Title order={2} mb="lg">Auditor Action History</Title>

      {/* Statistics Cards */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder p="md" radius="md">
            <Text size="sm" fw={500} c="dimmed">Total Actions</Text>
            <Text size="xl" fw={700}>{stats.total_actions}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder p="md" radius="md" style={{ borderLeft: '4px solid green' }}>
            <Text size="sm" fw={500} c="dimmed">Approved</Text>
            <Text size="xl" fw={700} c="green">{stats.approved_count}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder p="md" radius="md" style={{ borderLeft: '4px solid red' }}>
            <Text size="sm" fw={500} c="dimmed">Rejected</Text>
            <Text size="xl" fw={700} c="red">{stats.rejected_count}</Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Filters */}
      <Card withBorder p="md" mb="lg">
        <Stack gap="sm">
          <Title order={4}>Filter Actions</Title>
          <Group grow>
            <Select
              label="Action Type"
              placeholder="Select action"
              value={filters.action}
              onChange={(value) => setFilters({ ...filters, action: value || 'all' })}
              data={[
                { value: 'all', label: 'All Actions' },
                { value: 'approved', label: 'Approved Only' },
                { value: 'rejected', label: 'Rejected Only' },
                { value: 'forwarded', label: 'Forwarded Only' },
              ]}
            />
            <TextInput
              label="Start Date"
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
            <TextInput
              label="End Date"
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </Group>
          <Group>
            <Button onClick={fetchActionHistory}>Apply Filters</Button>
            <Button variant="light" onClick={() => {
              setFilters({ action: 'all', start_date: '', end_date: '' });
            }}>Reset</Button>
            <Button
              leftSection={<Download size={16} />}
              variant="outline"
              onClick={downloadPdf}
            >
              Download PDF
            </Button>
          </Group>
        </Stack>
      </Card>

      {/* Error Alert */}
      {error && <Alert color="red" mb="md">{error}</Alert>}

      {/* Loading State */}
      {loading && (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      )}

      {/* Actions Table */}
      {!loading && actions.length > 0 && (
        <Card withBorder overflow="hidden">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Log ID</Table.Th>
                <Table.Th>Action</Table.Th>
                <Table.Th>Timestamp</Table.Th>
                <Table.Th>Claim ID</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Applicant</Table.Th>
                <Table.Th>Reason</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {actions.map((action) => {
                const badgeInfo = getActionBadge(action.action);
                return (
                  <Table.Tr key={action.log_id}>
                    <Table.Td>{action.log_id}</Table.Td>
                    <Table.Td>
                      <Badge color={badgeInfo.color} size="sm">
                        {badgeInfo.label}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{new Date(action.timestamp).toLocaleDateString()}</Table.Td>
                    <Table.Td>{action.claim_id || 'N/A'}</Table.Td>
                    <Table.Td>₹{parseFloat(action.claim_amount || 0).toFixed(2)}</Table.Td>
                    <Table.Td>{action.claim_user || 'N/A'}</Table.Td>
                    <Table.Td size="sm">{action.claim_reason?.substring(0, 30) || 'N/A'}...</Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light">{action.claim_status || 'N/A'}</Badge>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* Empty State */}
      {!loading && actions.length === 0 && !error && (
        <Card withBorder p="lg" ta="center">
          <Text c="dimmed">No actions found matching the filters</Text>
        </Card>
      )}
    </Container>
  );
};

export default AuditorActionHistory;
