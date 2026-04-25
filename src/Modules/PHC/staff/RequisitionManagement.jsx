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
  Textarea,
  MultiSelect,
  Tabs,
} from "@mantine/core";
import PHCNav from "../components/PHCNav";
import {
  getRequisitionsList,
  getInventoryList,
  createRequisition,
  approveRequisition,
  fulfillRequisition,
} from "../api";
import { useSelector } from "react-redux";

const RequisitionManagement = () => {
  const phcRole = useSelector((state) => state.user.phcRole);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openFulfillModal, setOpenFulfillModal] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [itemOptions, setItemOptions] = useState([]);
  const requiredSupplyOptions = [
    { value: "medicines", label: "Medicines" },
    { value: "bandages", label: "Bandages & Dressings" },
    { value: "syringes", label: "Syringes & Needles" },
    { value: "gloves", label: "Gloves" },
    { value: "masks", label: "Masks" },
    { value: "thermometers", label: "Thermometers" },
    { value: "oxygen", label: "Oxygen Cylinders" },
    { value: "iv_stands", label: "IV Stands" },
  ];

  const [createForm, setCreateForm] = useState({
    items: [],
    requested_supplies: [],
    medicine_quantities: {},
    supply_quantities: {},
    priority: "normal",
    reason: "",
    notes: "",
  });

  const [fulfillForm, setFulfillForm] = useState({
    delivery_date: "",
    notes: "",
    items: [],
  });

  useEffect(() => {
    if (phcRole === "phc_staff") {
      fetchRequisitions();
      fetchInventoryOptions();
    }
  }, [phcRole]);

  const fetchRequisitions = async () => {
    setLoading(true);
    try {
      const data = await getRequisitionsList();
      setRequisitions(data);
    } catch (error) {
      alert("Error fetching requisitions: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryOptions = async () => {
    try {
      const inventory = await getInventoryList();
      const options = (inventory || []).map((item) => ({
        value: String(item.medicine_id),
        label: `${item.medicine_name} (${item.stock_quantity ?? 0} in stock)`,
      }));
      setItemOptions(options);
    } catch (error) {
      setItemOptions([]);
    }
  };

  if (phcRole !== "phc_staff") {
    return (
      <div style={{ padding: 16 }}>
        <PHCNav />
        <Alert color="red" title="Access Denied">
          Only PHC staff can access requisitions.
        </Alert>
      </div>
    );
  }

  const isStaff = phcRole === "phc_staff";

  const handleOpenCreateModal = () => {
    setCreateForm({
      items: [],
      requested_supplies: [],
      medicine_quantities: {},
      supply_quantities: {},
      priority: "normal",
      reason: "",
      notes: "",
    });
    setOpenCreateModal(true);
  };

  const handleOpenFulfillModal = (requisition) => {
    setSelectedRequisition(requisition);
    // Initialize fulfillForm with items from requisition
    const itemsFulfillment = (requisition.items_list || []).map((item) => ({
      requisition_item_id: item.requisition_item_id,
      quantity_fulfilled: Number(item.quantity_requested || 0),
      medicine_name: item.medicine_name,
      quantity_requested: item.quantity_requested,
    }));
    setFulfillForm({
      delivery_date: "",
      notes: "",
      items: itemsFulfillment,
    });
    setOpenFulfillModal(true);
  };

  const getRequestedSuppliesFromReason = (reason) => {
    const marker = "| Required:";
    if (!reason || !reason.includes(marker)) {
      return "";
    }
    return reason.split(marker)[1]?.trim() || "";
  };

  const handleSubmitCreate = async () => {
    if ((createForm.items.length === 0 && createForm.requested_supplies.length === 0) || !createForm.reason) {
      alert("Please select required things or medicines, and enter reason");
      return;
    }

    try {
      const invalidSupplyQty = createForm.requested_supplies.some(
        (supply) => Number(createForm.supply_quantities?.[supply] || 0) <= 0
      );
      if (invalidSupplyQty) {
        alert("Please enter quantity greater than 0 for all required things");
        return;
      }

      const invalidMedicineQty = createForm.items.some(
        (medicineId) => Number(createForm.medicine_quantities?.[medicineId] || 0) <= 0
      );
      if (invalidMedicineQty) {
        alert("Please enter quantity greater than 0 for all selected medicines");
        return;
      }

      const mappedItems = createForm.items.map((medicineId) => ({
        medicine_id: Number(medicineId),
        quantity: Number(createForm.medicine_quantities?.[medicineId] || 1),
        priority: createForm.priority === "high" ? "urgent" : "normal",
      }));

      const mappedSupplies = createForm.requested_supplies.map((supply) => ({
        item: supply,
        quantity: Number(createForm.supply_quantities?.[supply] || 1),
      }));

      await createRequisition({
        items: mappedItems,
        requested_supplies: mappedSupplies,
        reason: createForm.reason,
        notes: createForm.notes,
      });
      alert("Requisition created successfully!");
      setOpenCreateModal(false);
      fetchRequisitions();
    } catch (error) {
      alert("Error creating requisition: " + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmitFulfill = async () => {
    if (!fulfillForm.delivery_date) {
      alert("Please select a delivery date");
      return;
    }

    // If medicine items exist, require at least one fulfilled quantity.
    const hasMedicineItems = (fulfillForm.items || []).length > 0;
    const hasValidItems = hasMedicineItems
      ? fulfillForm.items.some((item) => item.quantity_fulfilled > 0)
      : true;
    if (!hasValidItems) {
      alert("Please enter quantity received for at least one item");
      return;
    }

    try {
      await fulfillRequisition({
        requisition_id: selectedRequisition.requisition_id,
        items: fulfillForm.items.map((item) => ({
          requisition_item_id: item.requisition_item_id,
          quantity_fulfilled: item.quantity_fulfilled,
        })),
      });
      alert("Requisition fulfilled and inventory updated!");
      setOpenFulfillModal(false);
      fetchRequisitions();
      fetchInventoryOptions();
    } catch (error) {
      alert("Error fulfilling requisition: " + (error.response?.data?.message || error.message));
    }
  };

  const handleMarkNotDelivered = async (requisitionId) => {
    try {
      await approveRequisition({
        requisition_id: requisitionId,
        action: "reject",
      });
      alert("Requisition marked as not delivered");
      fetchRequisitions();
    } catch (error) {
      alert("Error marking not delivered: " + (error.response?.data?.message || error.message));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "yellow";
      case "approved":
        return "blue";
      case "fulfilled":
        return "green";
      case "rejected":
        return "red";
      default:
        return "gray";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "red";
      case "normal":
        return "blue";
      case "low":
        return "green";
      default:
        return "gray";
    }
  };

  const filterRequisitionsByStatus = (status) => {
    return requisitions.filter((req) => req.status === status);
  };

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />
      <Group justify="space-between" mb="md">
        <Title order={2}>Requisition Management</Title>
        <Group>
          <Button onClick={fetchRequisitions} loading={loading}>
            Refresh
          </Button>
          {isStaff && (
            <Button onClick={handleOpenCreateModal} color="green">
              New Requisition
            </Button>
          )}
        </Group>
      </Group>

      {loading ? (
        <Loader />
      ) : (
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="pending" badge={filterRequisitionsByStatus("pending").length}>
              Pending
            </Tabs.Tab>
            <Tabs.Tab value="approved" badge={filterRequisitionsByStatus("approved").length}>
              Approved
            </Tabs.Tab>
            <Tabs.Tab value="fulfilled" badge={filterRequisitionsByStatus("fulfilled").length}>
              Fulfilled
            </Tabs.Tab>
            <Tabs.Tab value="rejected" badge={filterRequisitionsByStatus("rejected").length}>
              Rejected
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value={activeTab} pt="md">
            <Card withBorder radius="md" p="lg">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Reason</Table.Th>
                    <Table.Th>Created On</Table.Th>
                    <Table.Th>Priority</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Items Count</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filterRequisitionsByStatus(activeTab).map((req) => (
                    <Table.Tr key={req.requisition_id}>
                      <Table.Td>{req.requisition_id}</Table.Td>
                      <Table.Td>{req.reason}</Table.Td>
                      <Table.Td>{req.created_date}</Table.Td>
                      <Table.Td>
                        <Badge color={getPriorityColor(req.priority)}>
                          {req.priority}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(req.status)}>
                          {req.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{req.items_count || 0}</Table.Td>
                      <Table.Td>
                        {isStaff && (req.status === "pending" || req.status === "submitted" || req.status === "approved") && (
                          <Group gap={6}>
                            <Button
                              size="xs"
                              color="green"
                              variant="light"
                              onClick={() => handleOpenFulfillModal(req)}
                            >
                              Mark Received
                            </Button>
                            <Button
                              size="xs"
                              color="red"
                              variant="light"
                              onClick={() => handleMarkNotDelivered(req.requisition_id)}
                            >
                              Not Delivered
                            </Button>
                          </Group>
                        )}
                        {["fulfilled", "rejected"].includes(req.status) && (
                          <Text size="xs" c="dimmed">
                            {req.status}
                          </Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          </Tabs.Panel>
        </Tabs>
      )}

      {/* Create Requisition Modal */}
      <Modal
        opened={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        title="Create New Requisition"
        centered
        size="lg"
      >
        <Stack gap="md">
          <MultiSelect
            label="Required Things"
            placeholder="Choose required items (bandages, medicines, etc.)"
            data={requiredSupplyOptions}
            value={createForm.requested_supplies}
            onChange={(value) => {
              const nextQuantities = { ...createForm.supply_quantities };
              value.forEach((key) => {
                if (!nextQuantities[key]) {
                  nextQuantities[key] = 1;
                }
              });
              Object.keys(nextQuantities).forEach((key) => {
                if (!value.includes(key)) {
                  delete nextQuantities[key];
                }
              });
              setCreateForm({
                ...createForm,
                requested_supplies: value,
                supply_quantities: nextQuantities,
              });
            }}
            required
            searchable
          />

          {createForm.requested_supplies.map((supplyKey) => {
            const option = requiredSupplyOptions.find((item) => item.value === supplyKey);
            return (
              <NumberInput
                key={supplyKey}
                label={`Quantity for ${option?.label || supplyKey}`}
                min={1}
                value={createForm.supply_quantities?.[supplyKey] || 1}
                onChange={(value) =>
                  setCreateForm({
                    ...createForm,
                    supply_quantities: {
                      ...createForm.supply_quantities,
                      [supplyKey]: Number(value || 1),
                    },
                  })
                }
                required
              />
            );
          })}

          <MultiSelect
            label="Select Specific Medicines (optional)"
            placeholder="Choose medicines from inventory"
            data={itemOptions}
            value={createForm.items}
            onChange={(value) => {
              const nextQuantities = { ...createForm.medicine_quantities };
              value.forEach((key) => {
                if (!nextQuantities[key]) {
                  nextQuantities[key] = 1;
                }
              });
              Object.keys(nextQuantities).forEach((key) => {
                if (!value.includes(key)) {
                  delete nextQuantities[key];
                }
              });
              setCreateForm({
                ...createForm,
                items: value,
                medicine_quantities: nextQuantities,
              });
            }}
            searchable
          />

          {createForm.items.map((medicineId) => {
            const option = itemOptions.find((item) => item.value === medicineId);
            return (
              <NumberInput
                key={medicineId}
                label={`Quantity for ${option?.label || medicineId}`}
                min={1}
                value={createForm.medicine_quantities?.[medicineId] || 1}
                onChange={(value) =>
                  setCreateForm({
                    ...createForm,
                    medicine_quantities: {
                      ...createForm.medicine_quantities,
                      [medicineId]: Number(value || 1),
                    },
                  })
                }
              />
            );
          })}

          <Select
            label="Priority"
            placeholder="Select priority"
            data={[
              { value: "low", label: "Low" },
              { value: "normal", label: "Normal" },
              { value: "high", label: "High" },
            ]}
            value={createForm.priority}
            onChange={(value) =>
              setCreateForm({ ...createForm, priority: value })
            }
            required
          />

          <TextInput
            label="Reason for Requisition"
            placeholder="Explain why these items are needed"
            value={createForm.reason}
            onChange={(e) =>
              setCreateForm({ ...createForm, reason: e.target.value })
            }
            required
          />

          <Textarea
            label="Notes (optional)"
            placeholder="Additional notes"
            value={createForm.notes}
            onChange={(e) =>
              setCreateForm({ ...createForm, notes: e.target.value })
            }
            minRows={2}
          />

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setOpenCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitCreate}>Create Requisition</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Fulfill Requisition Modal */}
      <Modal
        opened={openFulfillModal}
        onClose={() => setOpenFulfillModal(false)}
        title="Mark Requisition as Received"
        centered
        size="lg"
      >
        <Stack gap="md">
          <div>
            <Text size="sm" c="dimmed">
              Requisition ID
            </Text>
            <Text fw={500}>{selectedRequisition?.requisition_id}</Text>
          </div>

          <div>
            <Text size="sm" c="dimmed">
              Reason
            </Text>
            <Text fw={500}>{selectedRequisition?.reason}</Text>
          </div>

          {getRequestedSuppliesFromReason(selectedRequisition?.reason) && (
            <div>
              <Text size="sm" c="dimmed">
                Requested Supplies
              </Text>
              <Text fw={500}>{getRequestedSuppliesFromReason(selectedRequisition?.reason)}</Text>
            </div>
          )}

          <TextInput
            label="Expected Delivery Date"
            type="date"
            value={fulfillForm.delivery_date}
            onChange={(e) =>
              setFulfillForm({ ...fulfillForm, delivery_date: e.target.value })
            }
            required
          />

          <div>
            <Text size="sm" fw={600} mb="sm">
              Items Received
            </Text>
            <Stack gap="sm" style={{ maxHeight: "300px", overflowY: "auto" }}>
              {fulfillForm.items && fulfillForm.items.length > 0 ? (
                fulfillForm.items.map((item, index) => (
                  <div
                    key={item.requisition_item_id || `${item.medicine_name || "item"}-${index}`}
                    style={{
                      padding: "12px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <Group justify="space-between" mb="xs">
                      <div>
                        <Text size="sm" fw={500}>
                          {item.medicine_name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Requested: {item.quantity_requested} units
                        </Text>
                      </div>
                    </Group>
                    <NumberInput
                      label="Quantity Received"
                      placeholder="Enter received quantity"
                      value={item.quantity_fulfilled}
                      onChange={(value) => {
                        const updatedItems = [...fulfillForm.items];
                        updatedItems[index].quantity_fulfilled = value || 0;
                        setFulfillForm({ ...fulfillForm, items: updatedItems });
                      }}
                      min={0}
                      max={item.quantity_requested * 2}
                      required
                    />
                  </div>
                ))
              ) : (
                <Text c="dimmed" size="sm">
                  No medicine items in this requisition. You can still confirm receipt for requested supplies.
                </Text>
              )}
            </Stack>
          </div>

          <Textarea
            label="Additional Notes (optional)"
            placeholder="Add notes about delivery or any issues"
            value={fulfillForm.notes}
            onChange={(e) =>
              setFulfillForm({ ...fulfillForm, notes: e.target.value })
            }
            minRows={2}
          />

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setOpenFulfillModal(false)}>
              Cancel
            </Button>
            <Button color="green" onClick={handleSubmitFulfill}>
              Confirm Receipt & Update Inventory
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default RequisitionManagement;
