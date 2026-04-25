import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Stack,
  Title,
  Alert,
  Textarea,
  Badge,
  Group,
  Text,
  Table,
  Modal,
  NumberInput,
  Tabs,
} from "@mantine/core";
import PHCNav from "../components/PHCNav";
import { getRequisitionsList, fulfillRequisition } from "../api";
import { useSelector } from "react-redux";

const RequisitionFulfillment = () => {
  const phcRole = useSelector((state) => state.user.phcRole);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [fulfillmentForm, setFulfillmentForm] = useState({});
  const [activeFilter, setActiveFilter] = useState("approved");

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    setLoading(true);
    try {
      const data = await getRequisitionsList();
      setRequisitions(data);
    } catch (error) {
      alert("Error fetching requisitions: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (phcRole !== "phc_staff") {
    return (
      <div style={{ padding: 16 }}>
        <PHCNav />
        <Alert color="red" title="Access Denied">
          Only PHC staff can mark requisitions as fulfilled.
        </Alert>
      </div>
    );
  }

  const filteredRequisitions = requisitions.filter((r) => {
    if (activeFilter === "approved") return r.status === "approved";
    if (activeFilter === "fulfilled") return r.status === "fulfilled";
    return true;
  });

  const handleFulfill = (req) => {
    setSelectedRequisition(req);
    const form = {};
    req.items.forEach((item) => {
      form[item.id] = item.quantity;
    });
    setFulfillmentForm(form);
    setShowModal(true);
  };

  const submitFulfillment = async () => {
    const itemsFulfillment = selectedRequisition.items.map((item) => ({
      item_id: item.id,
      quantity_received: fulfillmentForm[item.id] || 0,
    }));

    try {
      await fulfillRequisition({
        requisition_id: selectedRequisition.id,
        items_fulfillment: itemsFulfillment,
      });

      alert("✅ Requisition marked as fulfilled");
      setShowModal(false);
      fetchRequisitions();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      alert(`❌ Error: ${errorMsg}`);
    }
  };

  const getStatusColor = (status) => {
    if (status === "pending") return "yellow";
    if (status === "approved") return "blue";
    if (status === "fulfilled") return "green";
    if (status === "rejected") return "red";
    return "gray";
  };

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />

      <Title order={2} mb="md">
        Confirm Requisition Fulfillment
      </Title>
      <Text c="dimmed" mb="lg">
        Verify delivery and mark requisitions as received/fulfilled
      </Text>

      <Tabs value={activeFilter} onChange={setActiveFilter} mb="md">
        <Tabs.List>
          <Tabs.Tab value="approved" leftSection="📦">
            Ready for Delivery ({requisitions.filter((r) => r.status === "approved").length})
          </Tabs.Tab>
          <Tabs.Tab value="fulfilled" leftSection="✅">
            Fulfilled ({requisitions.filter((r) => r.status === "fulfilled").length})
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {filteredRequisitions.length === 0 ? (
        <Alert color="blue" title="No Requisitions">
          No {activeFilter} requisitions to show.
        </Alert>
      ) : (
        <Stack gap="md">
          {filteredRequisitions.map((req) => (
            <Card key={req.id} withBorder p="md">
              <Group justify="space-between" mb="md">
                <div>
                  <Text fw={500} size="lg">
                    Requisition #{req.id}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Submitted by: {req.submitted_by} | Approved: {req.approved_date || "Pending"}
                  </Text>
                </div>
                <Badge color={getStatusColor(req.status)} size="lg">
                  {req.status.toUpperCase()}
                </Badge>
              </Group>

              <Stack gap="xs" mb="md">
                <div>
                  <Text size="sm" c="dimmed">
                    Reason:
                  </Text>
                  <Text size="sm">{req.reason}</Text>
                </div>

                {req.items && (
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">
                      Ordered Items ({req.items.length}):
                    </Text>
                    <Table striped size="sm">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Medicine</Table.Th>
                          <Table.Th>Quantity Ordered</Table.Th>
                          <Table.Th>Priority</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {req.items.map((item, idx) => (
                          <Table.Tr key={idx}>
                            <Table.Td>{item.medicine_name}</Table.Td>
                            <Table.Td>{item.quantity}</Table.Td>
                            <Table.Td>
                              <Badge size="sm" color={item.priority === "urgent" ? "red" : "gray"}>
                                {item.priority.toUpperCase()}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </div>
                )}
              </Stack>

              {req.status === "approved" && (
                <Group justify="flex-end">
                  <Button onClick={() => handleFulfill(req)}>Verify & Mark Fulfilled</Button>
                </Group>
              )}
            </Card>
          ))}
        </Stack>
      )}

      <Modal opened={showModal} onClose={() => setShowModal(false)} title="Confirm Delivery">
        <Stack gap="md">
          <Alert color="blue" title="Delivery Verification">
            Verify the quantities received for Requisition #{selectedRequisition?.id}
          </Alert>

          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {selectedRequisition?.items?.map((item) => (
              <div key={item.id} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #dee2e6" }}>
                <Text size="sm" fw={500} mb={4}>
                  {item.medicine_name}
                </Text>
                <Text size="xs" c="dimmed" mb={8}>
                  Ordered: {item.quantity} units
                </Text>
                <NumberInput
                  label="Quantity Received"
                  placeholder="Enter received quantity"
                  value={fulfillmentForm[item.id] || 0}
                  onChange={(value) => setFulfillmentForm({ ...fulfillmentForm, [item.id]: value })}
                  min={0}
                  max={item.quantity + 10}
                />
              </div>
            ))}
          </div>

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={submitFulfillment} color="green">
              Confirm & Mark Fulfilled
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default RequisitionFulfillment;
