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
  Select,
  Tabs,
} from "@mantine/core";
import PHCNav from "../components/PHCNav";
import { getRequisitionsList, approveRequisition } from "../api";
import { useSelector } from "react-redux";

const RequisitionApproval = () => {
  const phcRole = useSelector((state) => state.user.phcRole);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionForm, setActionForm] = useState({
    action: "",
    notes: "",
  });
  const [activeFilter, setActiveFilter] = useState("pending");

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
          Only PHC staff can manage requisitions.
        </Alert>
      </div>
    );
  }

  const filteredRequisitions = requisitions.filter((r) => {
    if (activeFilter === "pending") return r.status === "pending";
    if (activeFilter === "approved") return r.status === "approved";
    if (activeFilter === "rejected") return r.status === "rejected";
    return true;
  });

  const handleApprove = (req) => {
    setSelectedRequisition(req);
    setActionForm({ action: "approve", notes: "" });
    setShowModal(true);
  };

  const handleReject = (req) => {
    setSelectedRequisition(req);
    setActionForm({ action: "reject", notes: "" });
    setShowModal(true);
  };

  const submitAction = async () => {
    if (!actionForm.notes.trim()) {
      alert("Please provide notes/reason");
      return;
    }

    try {
      await approveRequisition({
        requisition_id: selectedRequisition.id,
        action: actionForm.action,
        notes: actionForm.notes,
      });

      alert(`✅ Requisition ${actionForm.action === "approve" ? "approved" : "rejected"}`);
      setShowModal(false);
      fetchRequisitions();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      alert(`❌ Error: ${errorMsg}`);
    }
  };

  const getStatusColor = (status) => {
    if (status === "pending") return "yellow";
    if (status === "approved") return "green";
    if (status === "rejected") return "red";
    return "gray";
  };

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />

      <Title order={2} mb="md">
        Manage Requisitions
      </Title>
      <Text c="dimmed" mb="lg">
        Review and approve/reject inventory requisitions
      </Text>

      <Tabs value={activeFilter} onChange={setActiveFilter} mb="md">
        <Tabs.List>
          <Tabs.Tab value="pending" leftSection="⏳">
            Pending ({requisitions.filter((r) => r.status === "pending").length})
          </Tabs.Tab>
          <Tabs.Tab value="approved" leftSection="✅">
            Approved ({requisitions.filter((r) => r.status === "approved").length})
          </Tabs.Tab>
          <Tabs.Tab value="rejected" leftSection="❌">
            Rejected ({requisitions.filter((r) => r.status === "rejected").length})
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
                    Submitted by: {req.submitted_by} on {req.created_at}
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

                {req.notes && (
                  <div>
                    <Text size="sm" c="dimmed">
                      Notes:
                    </Text>
                    <Text size="sm">{req.notes}</Text>
                  </div>
                )}

                {req.items && (
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">
                      Items ({req.items.length}):
                    </Text>
                    <Table striped size="sm">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Medicine</Table.Th>
                          <Table.Th>Quantity</Table.Th>
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

              {req.status === "pending" && (
                <Group justify="flex-end">
                  <Button color="red" variant="light" onClick={() => handleReject(req)}>
                    Reject
                  </Button>
                  <Button color="green" onClick={() => handleApprove(req)}>
                    Approve
                  </Button>
                </Group>
              )}
            </Card>
          ))}
        </Stack>
      )}

      <Modal
        opened={showModal}
        onClose={() => setShowModal(false)}
        title={`${actionForm.action === "approve" ? "Approve" : "Reject"} Requisition`}
      >
        <Stack gap="md">
          <Alert color={actionForm.action === "approve" ? "green" : "red"} title="Action Confirmation">
            You are about to {actionForm.action} Requisition #{selectedRequisition?.id}
          </Alert>

          <Textarea
            label={actionForm.action === "approve" ? "Approval Notes" : "Rejection Reason *"}
            placeholder="Provide details about this action..."
            value={actionForm.notes}
            onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
            minRows={4}
            required
          />

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button color={actionForm.action === "approve" ? "green" : "red"} onClick={submitAction}>
              {actionForm.action === "approve" ? "Approve" : "Reject"} Requisition
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default RequisitionApproval;
