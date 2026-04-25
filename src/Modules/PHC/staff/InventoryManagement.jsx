import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Text,
  Title,
  Stack,
  Group,
  Badge,
  Alert,
  Loader,
  Grid,
  Textarea,
} from "@mantine/core";
import PHCNav from "../components/PHCNav";
import {
  getInventoryList,
  manageInventory,
  getLowStockAlerts,
  acknowledgeLowStockAlert,
  createMedicine,
} from "../api";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import logger from "../../../utils/logger";

const InventoryManagement = () => {
  const phcRole = useSelector((state) => state.user.phcRole);
  const selectedRole = useSelector((state) => state.user.role);
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAddMedicineModal, setOpenAddMedicineModal] = useState(false);
  const [openAdjustModal, setOpenAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [addMedicineForm, setAddMedicineForm] = useState({
    medicine_name: "",
    brand_name: "",
    manufacturer_name: "",
    constituents: "",
    pack_size_label: "",
    initial_stock: 0,
    reorder_threshold: 10,
  });

  const [adjustForm, setAdjustForm] = useState({
    action: "add",
    quantity: 0,
    reason: "",
    notes: "",
  });

  useEffect(() => {
    if (phcRole === "phc_staff") {
      fetchInventory();
      fetchLowStockAlerts();
    }
  }, [phcRole]);

  const normalizedRole = String(selectedRole || "").toLowerCase();
  const isProfessorView = normalizedRole === "professor";
  const canManageInventory = phcRole === "phc_staff" && !isProfessorView;

  useEffect(() => {
    if (!canManageInventory) {
      navigate("/phc", { replace: true });
    }
  }, [canManageInventory, navigate]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await getInventoryList();
      setInventory(data);
    } catch (error) {
      alert("Error fetching inventory: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const data = await getLowStockAlerts();
      setLowStockAlerts(data);
    } catch (error) {
      logger.error("Failed to fetch low stock alerts", error);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await acknowledgeLowStockAlert({ alert_id: alertId });
      await fetchLowStockAlerts();
    } catch (error) {
      alert("Error acknowledging alert: " + (error.response?.data?.message || error.message));
    }
  };

  if (!canManageInventory) {
    return (
      <div style={{ padding: 16 }}>
        <PHCNav />
        <Alert color="red" title="Access Denied">
          Inventory management is only available for PHC staff (compounder role).
        </Alert>
      </div>
    );
  }

  const handleOpenAdjustModal = (item) => {
    setSelectedItem(item);
    setAdjustForm({ action: "add", quantity: 0, reason: "", notes: "" });
    setOpenAdjustModal(true);
  };

  const handleOpenAddMedicineModal = () => {
    setAddMedicineForm({
      medicine_name: "",
      brand_name: "",
      manufacturer_name: "",
      constituents: "",
      pack_size_label: "",
      initial_stock: 0,
      reorder_threshold: 10,
    });
    setOpenAddMedicineModal(true);
  };

  const handleSubmitAddMedicine = async () => {
    if (!addMedicineForm.medicine_name?.trim()) {
      alert("Medicine name is required");
      return;
    }

    try {
      await createMedicine(addMedicineForm);
      alert("Medicine added successfully!");
      setOpenAddMedicineModal(false);
      fetchInventory();
      fetchLowStockAlerts();
    } catch (error) {
      alert("Error adding medicine: " + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmitAdjustment = async () => {
    if (adjustForm.quantity <= 0 || !adjustForm.reason) {
      alert("Please fill all required fields");
      return;
    }

    try {
      // Convert action to quantity_change (positive for add, negative for deduct)
      const quantity_change = adjustForm.action === "add" 
        ? adjustForm.quantity 
        : -adjustForm.quantity;

      await manageInventory({
        medicine_id: selectedItem.medicine_id,
        quantity_change: quantity_change,
        reason: adjustForm.reason,
      });
      alert("Inventory adjusted successfully!");
      setOpenAdjustModal(false);
      fetchInventory();
      fetchLowStockAlerts();
    } catch (error) {
      alert("Error adjusting inventory: " + (error.response?.data?.message || error.message));
    }
  };

  const getStockStatusColor = (current, minimum) => {
    const percentage = (current / minimum) * 100;
    if (percentage < 50) return "red";
    if (percentage < 100) return "yellow";
    return "green";
  };

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />
      <Group justify="space-between" mb="md">
        <Title order={2}>Inventory Management</Title>
        <Group>
          <Button onClick={fetchInventory} loading={loading}>
            Refresh
          </Button>
          <Button color="green" onClick={handleOpenAddMedicineModal}>
            Add Medicine
          </Button>
        </Group>
      </Group>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <Alert color="orange" title="Low Stock Alerts" mb="md">
          <Stack gap="xs">
            {lowStockAlerts.map((alert) => (
              <Group key={alert.alert_id} justify="space-between" align="center">
                <Text size="sm" fw={500}>
                  {alert.medicine_name}: {alert.current_stock}/{alert.threshold} units
                </Text>
                <Button size="xs" variant="light" color="orange" onClick={() => handleAcknowledgeAlert(alert.alert_id)}>
                  Acknowledge
                </Button>
              </Group>
            ))}
          </Stack>
        </Alert>
      )}

      {loading ? (
        <Loader />
      ) : (
        <Card withBorder radius="md" p="lg">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item Name</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Current Stock</Table.Th>
                <Table.Th>Minimum Level</Table.Th>
                <Table.Th>Unit</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {inventory.map((item) => (
                <Table.Tr key={item.medicine_id}>
                  <Table.Td>{item.medicine_name}</Table.Td>
                  <Table.Td>Medicine</Table.Td>
                  <Table.Td fw={500}>{item.stock_quantity}</Table.Td>
                  <Table.Td>{item.reorder_threshold}</Table.Td>
                  <Table.Td>Units</Table.Td>
                  <Table.Td>
                    <Badge
                      color={item.is_low_stock ? "red" : "green"}
                      variant="light"
                    >
                      {item.is_low_stock ? "Low" : "Adequate"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => handleOpenAdjustModal(item)}
                    >
                      Adjust
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
              {inventory.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text size="sm" c="dimmed" ta="center">
                      No medicines in inventory. Click "Add Medicine" to create one.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* Add Medicine Modal */}
      <Modal
        opened={openAddMedicineModal}
        onClose={() => setOpenAddMedicineModal(false)}
        title="Add New Medicine"
        centered
        size="lg"
      >
        <Stack gap="md">
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Medicine Name"
                placeholder="Paracetamol"
                value={addMedicineForm.medicine_name}
                onChange={(e) =>
                  setAddMedicineForm({ ...addMedicineForm, medicine_name: e.target.value })
                }
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Brand Name"
                placeholder="Crocin"
                value={addMedicineForm.brand_name}
                onChange={(e) =>
                  setAddMedicineForm({ ...addMedicineForm, brand_name: e.target.value })
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label="Initial Stock"
                value={addMedicineForm.initial_stock}
                min={0}
                onChange={(value) =>
                  setAddMedicineForm({ ...addMedicineForm, initial_stock: value || 0 })
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label="Reorder Threshold"
                value={addMedicineForm.reorder_threshold}
                min={0}
                onChange={(value) =>
                  setAddMedicineForm({ ...addMedicineForm, reorder_threshold: value || 0 })
                }
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Manufacturer"
            placeholder="Sun Pharma"
            value={addMedicineForm.manufacturer_name}
            onChange={(e) =>
              setAddMedicineForm({ ...addMedicineForm, manufacturer_name: e.target.value })
            }
          />

          <TextInput
            label="Pack Size"
            placeholder="Strip of 10"
            value={addMedicineForm.pack_size_label}
            onChange={(e) =>
              setAddMedicineForm({ ...addMedicineForm, pack_size_label: e.target.value })
            }
          />

          <Textarea
            label="Constituents"
            placeholder="Paracetamol 650mg"
            value={addMedicineForm.constituents}
            onChange={(e) =>
              setAddMedicineForm({ ...addMedicineForm, constituents: e.target.value })
            }
            minRows={2}
          />

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setOpenAddMedicineModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAddMedicine}>Save Medicine</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Adjust Modal */}
      <Modal
        opened={openAdjustModal}
        onClose={() => setOpenAdjustModal(false)}
        title={`Adjust Stock: ${selectedItem?.medicine_name}`}
        centered
      >
        <Stack gap="md">
          <Group grow>
            <div>
              <Text size="sm" c="dimmed">
                Current Stock
              </Text>
              <Text fw={700}>{selectedItem?.stock_quantity} units</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Minimum Level
              </Text>
              <Text fw={700}>{selectedItem?.reorder_threshold} units</Text>
            </div>
          </Group>

          <Select
            label="Action"
            placeholder="Select action"
            data={[
              { value: "add", label: "Add Stock" },
              { value: "remove", label: "Remove Stock" },
            ]}
            value={adjustForm.action}
            onChange={(value) =>
              setAdjustForm({ ...adjustForm, action: value })
            }
            required
          />

          <NumberInput
            label="Quantity"
            placeholder="Enter quantity"
            value={adjustForm.quantity}
            onChange={(value) =>
              setAdjustForm({ ...adjustForm, quantity: value || 0 })
            }
            min={1}
            required
          />

          <Select
            label="Reason"
            placeholder="Select reason"
            data={[
              "Procurement",
              "Consumption",
              "Wastage",
              "Damage",
              "Expiry",
              "Inventory Correction",
              "Return to Vendor",
            ]}
            value={adjustForm.reason}
            onChange={(value) =>
              setAdjustForm({ ...adjustForm, reason: value })
            }
            required
          />

          <Textarea
            label="Notes (optional)"
            placeholder="Additional notes"
            value={adjustForm.notes}
            onChange={(e) =>
              setAdjustForm({ ...adjustForm, notes: e.target.value })
            }
            minRows={2}
          />

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setOpenAdjustModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAdjustment}>Confirm Adjustment</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default InventoryManagement;
