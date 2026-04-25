import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Button,
  Modal,
  Grid,
  Stack,
  Text,
  Card,
  Badge,
  Loader,
  Alert,
  Table,
  Group,
  Input,
  NumberInput,
  Select,
  Textarea,
  SimpleGrid,
  ActionIcon,
  ThemeIcon,
  Center,
  Timeline,
  Divider,
} from '@mantine/core';
import {
  IconClipboard,
  IconPlus,
  IconTrash,
  IconAlertCircle,
  IconCheck,
  IconHistory,
  IconSearch,
  IconFileText,
  IconCheckCircle,
  IconClock,
  IconX,
} from '@tabler/icons-react';
import axios from 'axios';
import dayjs from 'dayjs';
import './RequisitionForm.css';
import logger from '../../utils/logger';

/**
 * UC-10: Create Inventory Requisition Component (Complete Implementation)
 * Allows PHC staff to create requisitions for inventory items
 */
const RequisitionForm = () => {
  const [medicines, setMedicines] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal states
  const [formModal, setFormModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);

  // Form states
  const [requisitionItems, setRequisitionItems] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState('');
  const [requisitionReason, setRequisitionReason] = useState('');
  const [urgency, setUrgency] = useState('normal');

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    fulfilled: 0,
  });

  // Fetch data on mount
  useEffect(() => {
    fetchMedicines();
    fetchRequisitions();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/phc/staff/inventory/', {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setMedicines(response.data.data);
      }
    } catch (err) {
      logger.error('Failed to fetch medicines', err);
      setError('Failed to fetch medicines');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequisitions = async () => {
    try {
      const response = await axios.get('/phc/staff/requisitions/', {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setRequisitions(response.data.data);
        updateStats(response.data.data);
      }
    } catch (err) {
      logger.error('Failed to fetch requisitions', err);
    }
  };

  const updateStats = (requisitionsList) => {
    const stats = {
      total: requisitionsList.length,
      pending: requisitionsList.filter((r) => r.status === 'pending').length,
      approved: requisitionsList.filter((r) => r.status === 'approved').length,
      fulfilled: requisitionsList.filter((r) => r.status === 'fulfilled').length,
    };
    setStats(stats);
  };

  const handleAddItem = () => {
    if (!selectedMedicine || !selectedQuantity) {
      setError('Please select medicine and enter quantity');
      return;
    }

    const medicine = medicines.find((m) => m.id === parseInt(selectedMedicine));
    if (!medicine) {
      setError('Selected medicine not found');
      return;
    }

    // Check if already added
    if (requisitionItems.some((item) => item.medicine_id === medicine.id)) {
      setError('This medicine is already in the list');
      return;
    }

    const newItem = {
      medicine_id: medicine.id,
      medicine_name: medicine.name,
      quantity_requested: parseInt(selectedQuantity),
      current_stock: medicine.quantity,
      unit: medicine.unit,
    };

    setRequisitionItems([...requisitionItems, newItem]);
    setSelectedMedicine(null);
    setSelectedQuantity('');
    setError(null);
  };

  const handleRemoveItem = (medicineId) => {
    setRequisitionItems(requisitionItems.filter((item) => item.medicine_id !== medicineId));
  };

  const handleSubmitRequisition = async () => {
    if (requisitionItems.length === 0) {
      setError('Please add at least one medicine to the requisition');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await axios.post(
        '/phc/staff/requisition/create/',
        {
          items: requisitionItems,
          reason: requisitionReason,
          urgency: urgency,
        },
        {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setSuccess('Requisition created successfully!');
        setFormModal(false);
        setRequisitionItems([]);
        setRequisitionReason('');
        setUrgency('normal');
        fetchRequisitions();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.data.message || 'Failed to create requisition');
      }
    } catch (err) {
      logger.error('Failed to create requisition', err);
      setError(err.response?.data?.message || 'Error creating requisition. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewRequisition = (requisition) => {
    setSelectedRequisition(requisition);
    setViewModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <IconClock size={16} color="orange" />;
      case 'approved':
        return <IconCheck size={16} color="green" />;
      case 'fulfilled':
        return <IconCheckCircle size={16} color="blue" />;
      case 'rejected':
        return <IconX size={16} color="red" />;
      default:
        return <IconFileText size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'approved':
        return 'green';
      case 'fulfilled':
        return 'blue';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'red';
      case 'normal':
        return 'blue';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Container size="xl" py="xl" className="requisition-form">
      <Stack spacing="lg">
        {/* Header */}
        <div>
          <Group position="apart" align="center" mb="md">
            <div>
              <Text size="xl" weight={700}>
                Inventory Requisition
              </Text>
              <Text size="sm" color="dimmed">
                Create and manage inventory requisition requests
              </Text>
            </div>
            <Badge size="lg" variant="filled" leftSection={<IconClipboard size={14} />}>
              UC-10
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

        {/* Statistics */}
        <SimpleGrid cols={4} spacing="md" breakpoints={[{ maxWidth: 'sm', cols: 2 }]}>
          <Card p="md" radius="md" withBorder className="stat-card total">
            <Stack spacing="xs" align="center">
              <ThemeIcon size="lg" variant="light" color="blue" radius="md">
                <IconClipboard size={24} />
              </ThemeIcon>
              <Text size="sm" color="dimmed" weight={500}>
                Total
              </Text>
              <Text size="xl" weight={700}>
                {stats.total}
              </Text>
            </Stack>
          </Card>

          <Card p="md" radius="md" withBorder className="stat-card pending">
            <Stack spacing="xs" align="center">
              <ThemeIcon size="lg" variant="light" color="yellow" radius="md">
                <IconClock size={24} />
              </ThemeIcon>
              <Text size="sm" color="dimmed" weight={500}>
                Pending
              </Text>
              <Text size="xl" weight={700}>
                {stats.pending}
              </Text>
            </Stack>
          </Card>

          <Card p="md" radius="md" withBorder className="stat-card approved">
            <Stack spacing="xs" align="center">
              <ThemeIcon size="lg" variant="light" color="green" radius="md">
                <IconCheck size={24} />
              </ThemeIcon>
              <Text size="sm" color="dimmed" weight={500}>
                Approved
              </Text>
              <Text size="xl" weight={700}>
                {stats.approved}
              </Text>
            </Stack>
          </Card>

          <Card p="md" radius="md" withBorder className="stat-card fulfilled">
            <Stack spacing="xs" align="center">
              <ThemeIcon size="lg" variant="light" color="blue" radius="md">
                <IconCheckCircle size={24} />
              </ThemeIcon>
              <Text size="sm" color="dimmed" weight={500}>
                Fulfilled
              </Text>
              <Text size="xl" weight={700}>
                {stats.fulfilled}
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Create Button */}
        <Group spacing="md">
          <Button
            size="md"
            leftIcon={<IconPlus size={18} />}
            onClick={() => {
              setFormModal(true);
              setError(null);
            }}
          >
            New Requisition
          </Button>
        </Group>

        {/* Requisitions List */}
        {loading ? (
          <Center>
            <Loader />
          </Center>
        ) : (
          <Paper p="lg" radius="md" withBorder className="requisitions-list">
            <Text weight={700} size="lg" mb="md">
              All Requisitions
            </Text>
            {requisitions.length > 0 ? (
              <Table striped highlightOnHover>
                <thead>
                  <tr>
                    <th>Requisition ID</th>
                    <th>Items</th>
                    <th>Urgency</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requisitions.map((requisition) => (
                    <tr key={requisition.id}>
                      <td>
                        <Text weight={600}>REQ-{requisition.id}</Text>
                      </td>
                      <td>
                        <Text weight={600}>{requisition.items?.length || 0} items</Text>
                      </td>
                      <td>
                        <Badge color={getUrgencyColor(requisition.urgency)} variant="light">
                          {requisition.urgency?.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <Group spacing="xs">
                          {getStatusIcon(requisition.status)}
                          <Badge color={getStatusColor(requisition.status)} variant="light">
                            {requisition.status?.toUpperCase()}
                          </Badge>
                        </Group>
                      </td>
                      <td>{dayjs(requisition.created_at).format('MMM DD, HH:mm')}</td>
                      <td>
                        <ActionIcon
                          size="sm"
                          color="blue"
                          variant="light"
                          onClick={() => handleViewRequisition(requisition)}
                          title="View Details"
                        >
                          <IconFileText size={16} />
                        </ActionIcon>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <Center py="xl">
                <Text color="dimmed">No requisitions found</Text>
              </Center>
            )}
          </Paper>
        )}
      </Stack>

      {/* Create Requisition Modal */}
      <Modal
        opened={formModal}
        onClose={() => {
          setFormModal(false);
          setRequisitionItems([]);
          setRequisitionReason('');
          setUrgency('normal');
          setSelectedMedicine(null);
          setSelectedQuantity('');
          setError(null);
        }}
        title="New Requisition"
        size="lg"
        centered
      >
        <Stack spacing="md">
          {/* Item Picker */}
          <Paper p="md" radius="md" withBorder className="item-picker">
            <Text weight={600} mb="md">
              Add Items to Requisition
            </Text>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Select Medicine"
                  placeholder="Choose a medicine"
                  searchable
                  value={selectedMedicine}
                  onChange={setSelectedMedicine}
                  data={medicines.map((med) => ({
                    value: String(med.id),
                    label: `${med.name} (Stock: ${med.quantity} ${med.unit})`,
                  }))}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Quantity"
                  placeholder="Enter quantity"
                  value={selectedQuantity}
                  onChange={setSelectedQuantity}
                  min={1}
                />
              </Grid.Col>
            </Grid>
            <Button onClick={handleAddItem} mt="md" size="sm" leftIcon={<IconPlus size={14} />}>
              Add to List
            </Button>
          </Paper>

          {/* Requisition Items List */}
          {requisitionItems.length > 0 && (
            <Paper p="md" radius="md" withBorder className="items-summary">
              <Text weight={600} mb="md">
                Requisition Items ({requisitionItems.length})
              </Text>
              <Table size="sm" striped>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Current Stock</th>
                    <th>Quantity Requested</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requisitionItems.map((item) => (
                    <tr key={item.medicine_id}>
                      <td>{item.medicine_name}</td>
                      <td>
                        {item.current_stock} {item.unit}
                      </td>
                      <td>
                        <Text weight={600}>{item.quantity_requested}</Text>
                      </td>
                      <td>
                        <ActionIcon
                          size="sm"
                          color="red"
                          variant="light"
                          onClick={() => handleRemoveItem(item.medicine_id)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Paper>
          )}

          {/* Reason and Urgency */}
          <Textarea
            label="Reason for Requisition"
            placeholder="Explain why these medicines are needed"
            value={requisitionReason}
            onChange={(e) => setRequisitionReason(e.currentTarget.value)}
            minRows={3}
          />

          <Select
            label="Urgency Level"
            placeholder="Select urgency"
            value={urgency}
            onChange={setUrgency}
            data={[
              { value: 'low', label: 'Low' },
              { value: 'normal', label: 'Normal' },
              { value: 'high', label: 'High' },
            ]}
          />

          {/* Submit Button */}
          <Button onClick={handleSubmitRequisition} loading={submitting} fullWidth>
            Create Requisition
          </Button>
        </Stack>
      </Modal>

      {/* View Requisition Modal */}
      <Modal
        opened={viewModal}
        onClose={() => {
          setViewModal(false);
          setSelectedRequisition(null);
        }}
        title={`Requisition REQ-${selectedRequisition?.id}`}
        size="lg"
        centered
      >
        {selectedRequisition && (
          <Stack spacing="md">
            {/* Status and Info */}
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Stack spacing="xs">
                  <Text size="sm" color="dimmed" weight={500}>
                    Status
                  </Text>
                  <Group spacing="xs">
                    {getStatusIcon(selectedRequisition.status)}
                    <Badge color={getStatusColor(selectedRequisition.status)}>
                      {selectedRequisition.status?.toUpperCase()}
                    </Badge>
                  </Group>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Stack spacing="xs">
                  <Text size="sm" color="dimmed" weight={500}>
                    Urgency
                  </Text>
                  <Badge color={getUrgencyColor(selectedRequisition.urgency)}>
                    {selectedRequisition.urgency?.toUpperCase()}
                  </Badge>
                </Stack>
              </Grid.Col>
            </Grid>

            <Divider />

            {/* Items */}
            <div>
              <Text weight={600} mb="md">
                Items ({selectedRequisition.items?.length || 0})
              </Text>
              <Table size="sm" striped>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRequisition.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.medicine_name}</td>
                      <td>{item.quantity_requested}</td>
                      <td>{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Reason */}
            {selectedRequisition.reason && (
              <div>
                <Text weight={600} size="sm" mb="xs">
                  Reason
                </Text>
                <Text size="sm" color="dimmed">
                  {selectedRequisition.reason}
                </Text>
              </div>
            )}

            {/* Timeline */}
            {selectedRequisition.approval_timeline && (
              <div>
                <Text weight={600} size="sm" mb="md">
                  Approval Timeline
                </Text>
                <Timeline active={2} bulletSize={24} lineWidth={2}>
                  {selectedRequisition.approval_timeline.map((event, idx) => (
                    <Timeline.Item key={idx} title={event.action} subtitle={dayjs(event.timestamp).fromNow()}>
                      {event.remarks && <Text size="sm">{event.remarks}</Text>}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}

            {/* Created Date */}
            <Text size="sm" color="dimmed">
              Created: {dayjs(selectedRequisition.created_at).format('MMMM DD, YYYY HH:mm')}
            </Text>
          </Stack>
        )}
      </Modal>
    </Container>
  );
};

export default RequisitionForm;
