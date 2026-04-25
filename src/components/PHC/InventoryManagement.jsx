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
  Progress,
  Tabs,
} from '@mantine/core';
import {
  IconPackage,
  IconPlus,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconCheck,
  IconMinus,
  IconBox,
  IconHistory,
  IconSearch,
} from '@tabler/icons-react';
import axios from 'axios';
import dayjs from 'dayjs';
import './InventoryManagement.css';
import logger from '../../utils/logger';

/**
 * UC-09: Manage Inventory Component (Complete Implementation)
 * Allows PHC staff to manage medicines, stock levels, and low-stock alerts
 */
const InventoryManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMedicines, setFilteredMedicines] = useState([]);

  // Modal states
  const [addMedicineModal, setAddMedicineModal] = useState(false);
  const [editMedicineModal, setEditMedicineModal] = useState(false);
  const [stockModal, setStockModal] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);

  // Form states
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [stockAction, setStockAction] = useState(null); // 'add' or 'deduct'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'tablet',
    threshold_quantity: 50,
    expiry_date: '',
  });
  const [stockData, setStockData] = useState({
    quantity: '',
    reason: '',
    notes: '',
  });

  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalMedicines: 0,
    lowStockCount: 0,
    totalUnits: 0,
  });

  // Fetch medicines on mount
  useEffect(() => {
    fetchMedicines();
    fetchLowStockAlerts();
  }, []);

  // Filter medicines when search query changes
  useEffect(() => {
    const filtered = medicines.filter((med) =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMedicines(filtered);
  }, [medicines, searchQuery]);

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
        updateStats(response.data.data);
      }
    } catch (err) {
      logger.error('Failed to fetch medicines', err);
      setError('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const response = await axios.get('/phc/staff/low-stock-alerts/', {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setLowStockAlerts(response.data.data);
      }
    } catch (err) {
      logger.error('Failed to fetch low stock alerts', err);
    }
  };

  const fetchTransactionHistory = async (medicineId) => {
    try {
      const response = await axios.get(`/phc/staff/inventory/${medicineId}/history/`, {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setTransactionHistory(response.data.data);
      }
    } catch (err) {
      logger.error('Failed to fetch transaction history', err);
    }
  };

  const updateStats = (medicinesList) => {
    const totalUnits = medicinesList.reduce((sum, med) => sum + (med.quantity || 0), 0);
    const lowStockCount = medicinesList.filter((med) => med.quantity < (med.threshold_quantity || 50)).length;

    setStats({
      totalMedicines: medicinesList.length,
      lowStockCount: lowStockCount,
      totalUnits: totalUnits,
    });
  };

  const handleAddMedicine = async () => {
    if (!formData.name || !formData.description) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(
        '/phc/staff/medicine/create/',
        formData,
        {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setSuccess('Medicine added successfully!');
        setAddMedicineModal(false);
        setFormData({ name: '', description: '', unit: 'tablet', threshold_quantity: 50, expiry_date: '' });
        fetchMedicines();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding medicine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMedicine = async () => {
    try {
      setSubmitting(true);
      const response = await axios.put(
        `/phc/staff/medicine/${editingMedicine.id}/`,
        formData,
        {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setSuccess('Medicine updated successfully!');
        setEditMedicineModal(false);
        setEditingMedicine(null);
        fetchMedicines();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating medicine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockAction = async () => {
    if (!stockData.quantity || !editingMedicine) {
      setError('Please enter quantity');
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = stockAction === 'add' ? 'add-stock' : 'deduct-stock';
      const response = await axios.post(
        `/phc/staff/medicine/${editingMedicine.id}/${endpoint}/`,
        {
          quantity: parseInt(stockData.quantity),
          reason: stockData.reason,
          notes: stockData.notes,
        },
        {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setSuccess(`Stock ${stockAction === 'add' ? 'added' : 'deducted'} successfully!`);
        setStockModal(false);
        setStockData({ quantity: '', reason: '', notes: '' });
        fetchMedicines();
        fetchLowStockAlerts();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMedicine = async (medicineId) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;

    try {
      const response = await axios.delete(`/phc/staff/medicine/${medicineId}/`, {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setSuccess('Medicine deleted successfully!');
        fetchMedicines();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting medicine');
    }
  };

  const openEditModal = (medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      description: medicine.description,
      unit: medicine.unit,
      threshold_quantity: medicine.threshold_quantity,
      expiry_date: medicine.expiry_date || '',
    });
    setEditMedicineModal(true);
  };

  const openStockModal = (medicine, action) => {
    setEditingMedicine(medicine);
    setStockAction(action);
    fetchTransactionHistory(medicine.id);
    setStockModal(true);
  };

  const getStockStatus = (quantity, threshold) => {
    if (quantity === 0) return { color: 'red', label: 'Out of Stock' };
    if (quantity < threshold) return { color: 'yellow', label: 'Low Stock' };
    return { color: 'green', label: 'In Stock' };
  };

  return (
    <Container size="xl" py="xl" className="inventory-manager">
      <Stack spacing="lg">
        {/* Header */}
        <div>
          <Group position="apart" align="center" mb="md">
            <div>
              <Text size="xl" weight={700}>
                Inventory Management
              </Text>
              <Text size="sm" color="dimmed">
                Manage medicines, track stock levels, and monitor inventory
              </Text>
            </div>
            <Badge size="lg" variant="filled" leftSection={<IconPackage size={14} />}>
              UC-09
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
        <SimpleGrid cols={3} spacing="md" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
          <Card p="md" radius="md" withBorder className="stat-card total">
            <Stack spacing="xs" align="center">
              <ThemeIcon size="lg" variant="light" color="blue" radius="md">
                <IconBox size={24} />
              </ThemeIcon>
              <Text size="sm" color="dimmed" weight={500}>
                Total Medicines
              </Text>
              <Text size="xl" weight={700}>
                {stats.totalMedicines}
              </Text>
            </Stack>
          </Card>

          <Card p="md" radius="md" withBorder className="stat-card units">
            <Stack spacing="xs" align="center">
              <ThemeIcon size="lg" variant="light" color="green" radius="md">
                <IconPackage size={24} />
              </ThemeIcon>
              <Text size="sm" color="dimmed" weight={500}>
                Total Units
              </Text>
              <Text size="xl" weight={700}>
                {stats.totalUnits}
              </Text>
            </Stack>
          </Card>

          <Card p="md" radius="md" withBorder className="stat-card lowstock">
            <Stack spacing="xs" align="center">
              <ThemeIcon size="lg" variant="light" color="red" radius="md">
                <IconAlertCircle size={24} />
              </ThemeIcon>
              <Text size="sm" color="dimmed" weight={500}>
                Low Stock
              </Text>
              <Text size="xl" weight={700}>
                {stats.lowStockCount}
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Tabs */}
        <Tabs defaultValue="medicines">
          <Tabs.List>
            <Tabs.Tab value="medicines" icon={<IconPackage size={14} />}>
              All Medicines
            </Tabs.Tab>
            <Tabs.Tab value="lowstock" icon={<IconAlertCircle size={14} />}>
              Low Stock Alerts ({stats.lowStockCount})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="medicines" pt="xl">
            <Stack spacing="md">
              {/* Search and Add Button */}
              <Group spacing="md">
                <Input
                  placeholder="Search medicines..."
                  icon={<IconSearch size={14} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  style={{ flex: 1 }}
                />
                <Button
                  leftIcon={<IconPlus size={18} />}
                  onClick={() => {
                    setFormData({ name: '', description: '', unit: 'tablet', threshold_quantity: 50, expiry_date: '' });
                    setAddMedicineModal(true);
                  }}
                >
                  Add Medicine
                </Button>
              </Group>

              {/* Medicines Table */}
              {loading ? (
                <Center>
                  <Loader />
                </Center>
              ) : (
                <Paper p="lg" radius="md" withBorder>
                  <Table striped highlightOnHover>
                    <thead>
                      <tr>
                        <th>Medicine Name</th>
                        <th>Unit</th>
                        <th>Stock</th>
                        <th>Threshold</th>
                        <th>Status</th>
                        <th>Expiry Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMedicines.map((medicine) => {
                        const status = getStockStatus(medicine.quantity, medicine.threshold_quantity);
                        return (
                          <tr key={medicine.id}>
                            <td>
                              <Stack spacing={0}>
                                <Text weight={600}>{medicine.name}</Text>
                                <Text size="sm" color="dimmed">
                                  {medicine.description}
                                </Text>
                              </Stack>
                            </td>
                            <td>{medicine.unit}</td>
                            <td>
                              <Text weight={600}>{medicine.quantity}</Text>
                            </td>
                            <td>{medicine.threshold_quantity}</td>
                            <td>
                              <Progress
                                value={(medicine.quantity / medicine.threshold_quantity) * 100}
                                color={status.color}
                                label={status.label}
                                size="md"
                              />
                            </td>
                            <td>
                              {medicine.expiry_date
                                ? dayjs(medicine.expiry_date).format('MMM DD, YYYY')
                                : '—'}
                            </td>
                            <td>
                              <Group spacing="xs">
                                <ActionIcon
                                  size="sm"
                                  color="green"
                                  variant="light"
                                  onClick={() => openStockModal(medicine, 'add')}
                                  title="Add Stock"
                                >
                                  <IconPlus size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  size="sm"
                                  color="orange"
                                  variant="light"
                                  onClick={() => openStockModal(medicine, 'deduct')}
                                  title="Deduct Stock"
                                >
                                  <IconMinus size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  size="sm"
                                  color="blue"
                                  variant="light"
                                  onClick={() => openEditModal(medicine)}
                                  title="Edit"
                                >
                                  <IconEdit size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  size="sm"
                                  color="red"
                                  variant="light"
                                  onClick={() => handleDeleteMedicine(medicine.id)}
                                  title="Delete"
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Paper>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="lowstock" pt="xl">
            {lowStockAlerts.length > 0 ? (
              <SimpleGrid cols={2} spacing="md" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
                {lowStockAlerts.map((alert, idx) => (
                  <Card key={alert.alert_id || `${alert.medicine_id || "alert"}-${idx}`} p="md" radius="md" withBorder className="alert-card">
                    <Stack spacing="sm">
                      <Group position="apart">
                        <Text weight={600}>{alert.medicine_name}</Text>
                        <Badge color="red" variant="light">
                          Low Stock
                        </Badge>
                      </Group>
                      <Text size="sm" color="dimmed">
                        Current: <Text weight={600}>{alert.current_stock}</Text> units | Threshold: {alert.threshold}
                      </Text>
                      <Text size="sm">Created: {dayjs(alert.created_at).fromNow()}</Text>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            ) : (
              <Paper p="lg" radius="md" withBorder ta="center">
                <Text color="dimmed">No low stock alerts</Text>
              </Paper>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Add Medicine Modal */}
      <Modal
        opened={addMedicineModal}
        onClose={() => setAddMedicineModal(false)}
        title="Add New Medicine"
        centered
      >
        <Stack spacing="md">
          <Input
            label="Medicine Name"
            placeholder="Enter medicine name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
            required
          />
          <Textarea
            label="Description"
            placeholder="Enter description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
            required
          />
          <Select
            label="Unit"
            placeholder="Select unit"
            value={formData.unit}
            onChange={(value) => setFormData({ ...formData, unit: value })}
            data={[
              { value: 'tablet', label: 'Tablet' },
              { value: 'capsule', label: 'Capsule' },
              { value: 'bottle', label: 'Bottle' },
              { value: 'vial', label: 'Vial' },
              { value: 'strip', label: 'Strip' },
            ]}
          />
          <NumberInput
            label="Low Stock Threshold"
            placeholder="Enter threshold"
            value={formData.threshold_quantity}
            onChange={(value) => setFormData({ ...formData, threshold_quantity: value })}
            min={1}
          />
          <Input
            label="Expiry Date"
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData({ ...formData, expiry_date: e.currentTarget.value })}
          />
          <Button onClick={handleAddMedicine} loading={submitting}>
            Add Medicine
          </Button>
        </Stack>
      </Modal>

      {/* Edit Medicine Modal */}
      <Modal
        opened={editMedicineModal}
        onClose={() => {
          setEditMedicineModal(false);
          setEditingMedicine(null);
        }}
        title="Edit Medicine"
        centered
      >
        <Stack spacing="md">
          <Input
            label="Medicine Name"
            placeholder="Enter medicine name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
          />
          <Textarea
            label="Description"
            placeholder="Enter description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
          />
          <Select
            label="Unit"
            placeholder="Select unit"
            value={formData.unit}
            onChange={(value) => setFormData({ ...formData, unit: value })}
            data={[
              { value: 'tablet', label: 'Tablet' },
              { value: 'capsule', label: 'Capsule' },
              { value: 'bottle', label: 'Bottle' },
              { value: 'vial', label: 'Vial' },
              { value: 'strip', label: 'Strip' },
            ]}
          />
          <NumberInput
            label="Low Stock Threshold"
            placeholder="Enter threshold"
            value={formData.threshold_quantity}
            onChange={(value) => setFormData({ ...formData, threshold_quantity: value })}
            min={1}
          />
          <Input
            label="Expiry Date"
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData({ ...formData, expiry_date: e.currentTarget.value })}
          />
          <Button onClick={handleEditMedicine} loading={submitting}>
            Update Medicine
          </Button>
        </Stack>
      </Modal>

      {/* Stock Modal */}
      <Modal
        opened={stockModal}
        onClose={() => {
          setStockModal(false);
          setEditingMedicine(null);
          setStockData({ quantity: '', reason: '', notes: '' });
        }}
        title={`${stockAction === 'add' ? 'Add' : 'Deduct'} Stock`}
        centered
      >
        <Stack spacing="md">
          <Text weight={600}>{editingMedicine?.name}</Text>
          <Text size="sm" color="dimmed">
            Current Stock: {editingMedicine?.quantity} {editingMedicine?.unit}
          </Text>

          <NumberInput
            label={`Quantity to ${stockAction === 'add' ? 'Add' : 'Deduct'}`}
            placeholder="Enter quantity"
            value={stockData.quantity}
            onChange={(value) => setStockData({ ...stockData, quantity: value })}
            min={1}
            required
          />

          <Select
            label="Reason"
            placeholder="Select reason"
            value={stockData.reason}
            onChange={(value) => setStockData({ ...stockData, reason: value })}
            data={
              stockAction === 'add'
                ? [
                    { value: 'purchase', label: 'New Purchase' },
                    { value: 'donation', label: 'Donation' },
                    { value: 'return', label: 'Return' },
                  ]
                : [
                    { value: 'usage', label: 'Patient Usage' },
                    { value: 'disposal', label: 'Disposal' },
                    { value: 'expiry', label: 'Expired' },
                    { value: 'damage', label: 'Damaged' },
                  ]
            }
            required
          />

          <Textarea
            label="Notes"
            placeholder="Add any additional notes"
            value={stockData.notes}
            onChange={(e) => setStockData({ ...stockData, notes: e.currentTarget.value })}
            minRows={2}
          />

          {transactionHistory.length > 0 && (
            <div>
              <Text weight={600} size="sm" mb="xs">
                Recent Transactions
              </Text>
              <Stack spacing="xs">
                {transactionHistory.slice(0, 3).map((trans, idx) => (
                  <Text key={trans.id || `${trans.timestamp || "tx"}-${idx}`} size="xs" color="dimmed">
                    {dayjs(trans.timestamp).format('MMM DD HH:mm')} - {trans.type}: {trans.quantity} {editingMedicine?.unit}
                  </Text>
                ))}
              </Stack>
            </div>
          )}

          <Button onClick={handleStockAction} loading={submitting}>
            {stockAction === 'add' ? 'Add Stock' : 'Deduct Stock'}
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
};

export default InventoryManagement;
