import React, { useState } from "react";
import {
  Card,
  Button,
  Stack,
  Title,
  Alert,
  Textarea,
  Select,
  NumberInput,
  Group,
  Text,
  Modal,
  Table,
  Badge,
} from "@mantine/core";
import PHCNav from "../components/PHCNav";
import { getAvailableMedicines, createRequisition } from "../api";
import { useSelector } from "react-redux";
import logger from "../../../utils/logger";

const CreateRequisition = () => {
  const phcRole = useSelector((state) => state.user.phcRole);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requisitionForm, setRequisitionForm] = useState({
    reason: "",
    notes: "",
  });
  const [items, setItems] = useState([]);
  const [itemInput, setItemInput] = useState({
    medicine_id: "",
    quantity: 1,
    priority: "normal",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  React.useEffect(() => {
    if (phcRole !== "phc_staff") {
      return;
    }
    fetchMedicines();
  }, [phcRole]);

  const fetchMedicines = async () => {
    try {
      const data = await getAvailableMedicines();
      setMedicines(data);
    } catch (error) {
      alert("Error fetching medicines: " + error.message);
    }
  };

  if (phcRole !== "phc_staff") {
    return (
      <div style={{ padding: 16 }}>
        <PHCNav />
        <Alert color="red" title="Access Denied">
          Only PHC staff can create requisitions.
        </Alert>
      </div>
    );
  }

  const handleAddItem = () => {
    if (!itemInput.medicine_id) {
      alert("Please select a medicine");
      return;
    }
    if (itemInput.quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    const medicine = medicines.find((m) => String(m.id) === String(itemInput.medicine_id));
    if (!medicine) {
      alert("Medicine not found");
      return;
    }

    setItems([
      ...items,
      {
        medicine_id: itemInput.medicine_id,
        medicine_name: medicine.medicine_name,
        quantity: itemInput.quantity,
        priority: itemInput.priority,
      },
    ]);

    setItemInput({ medicine_id: "", quantity: 1, priority: "normal" });
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!requisitionForm.reason || requisitionForm.reason.trim().length === 0) {
      alert("❌ Reason for requisition is required");
      return;
    }

    if (items.length === 0) {
      alert("❌ Please add at least one medicine to requisition");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        items_data: items.map((item) => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          priority: item.priority,
        })),
        reason: requisitionForm.reason,
        notes: requisitionForm.notes,
      };

      const result = await createRequisition(payload);
      logger.info("Requisition created successfully");

      setSuccessData(result);
      setShowSuccess(true);

      // Reset form
      setRequisitionForm({ reason: "", notes: "" });
      setItems([]);
      setItemInput({ medicine_id: "", quantity: 1, priority: "normal" });
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />

      <Title order={2} mb="md">
        Create Inventory Requisition
      </Title>
      <Text c="dimmed" mb="lg">
        Submit formal request for purchasing supplies
      </Text>

      <Card withBorder radius="md" p="lg">
        <Stack gap="md">
          <Alert color="blue" title="New Requisition">
            Create a formal request for inventory items. This will be sent to the Approving Authority for approval.
          </Alert>

          <Select
            label="Select Medicine to Add *"
            placeholder="Choose a medicine..."
            data={medicines?.map((m) => ({
              value: String(m.id),
              label: `${m.medicine_name} (Current Stock: ${m.quantity})`,
            }))}
            value={itemInput.medicine_id}
            onChange={(value) => setItemInput({ ...itemInput, medicine_id: value })}
            searchable
            required
          />

          <Group grow>
            <NumberInput
              label="Quantity Needed *"
              placeholder="Enter quantity"
              value={itemInput.quantity}
              onChange={(value) => setItemInput({ ...itemInput, quantity: value || 1 })}
              min={1}
              max={1000}
              required
            />

            <Select
              label="Priority"
              placeholder="Select priority"
              data={[
                { value: "low", label: "Low" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "High" },
                { value: "urgent", label: "Urgent" },
              ]}
              value={itemInput.priority}
              onChange={(value) => setItemInput({ ...itemInput, priority: value })}
            />

            <Button onClick={handleAddItem} mt="auto">
              Add Item
            </Button>
          </Group>

          {items.length > 0 && (
            <Card withBorder p="md" bg="gray.0">
              <Text fw={500} mb="xs">
                Items to Requisition ({items.length})
              </Text>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Medicine</Table.Th>
                    <Table.Th>Quantity</Table.Th>
                    <Table.Th>Priority</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {items.map((item, index) => (
                    <Table.Tr key={`${item.medicine_id || "medicine"}-${item.priority || "normal"}-${index}`}>
                      <Table.Td>{item.medicine_name}</Table.Td>
                      <Table.Td>{item.quantity}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            item.priority === "urgent"
                              ? "red"
                              : item.priority === "high"
                              ? "orange"
                              : "gray"
                          }
                        >
                          {item.priority.toUpperCase()}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          color="red"
                          variant="light"
                          onClick={() => handleRemoveItem(index)}
                        >
                          Remove
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          )}

          <Textarea
            label="Reason for Requisition *"
            placeholder="Explain why these items are needed (e.g., 'Stock running low', 'New outbreak preparation', etc.)"
            value={requisitionForm.reason}
            onChange={(e) => setRequisitionForm({ ...requisitionForm, reason: e.target.value })}
            minRows={3}
            required
          />

          <Textarea
            label="Additional Notes"
            placeholder="Any special requirements, supplier preferences, delivery deadline, etc."
            value={requisitionForm.notes}
            onChange={(e) => setRequisitionForm({ ...requisitionForm, notes: e.target.value })}
            minRows={2}
          />

          <Group justify="flex-end">
            <Button variant="light">Cancel</Button>
            <Button onClick={handleSubmit} loading={loading} disabled={items.length === 0}>
              Submit Requisition
            </Button>
          </Group>
        </Stack>
      </Card>

      <Modal opened={showSuccess} onClose={() => setShowSuccess(false)} title="✅ Requisition Submitted">
        <Stack gap="md">
          <Alert color="green" title="Success">
            Your requisition has been submitted successfully for approval.
          </Alert>

          {successData && (
            <div style={{ backgroundColor: "#f8f9fa", padding: 12, borderRadius: 6 }}>
              <Text size="sm">
                <strong>Requisition ID:</strong> {successData.requisition_id}
              </Text>
              <Text size="sm">
                <strong>Status:</strong> PENDING
              </Text>
              <Text size="sm">
                <strong>Submitted:</strong> {new Date().toLocaleString()}
              </Text>
              <Text size="sm">
                <strong>Items:</strong> {successData.items_count || items.length}
              </Text>
            </div>
          )}

          <Text size="sm" c="dimmed">
            The Approving Authority will review your requisition and notify you of the status. You can track this in the
            Requisitions List.
          </Text>

          <Button onClick={() => setShowSuccess(false)} fullWidth>
            Done
          </Button>
        </Stack>
      </Modal>
    </div>
  );
};

export default CreateRequisition;
