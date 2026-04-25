import React, { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Group, Loader, Stack, Table, Text, Title } from "@mantine/core";
import PHCNav from "../components/PHCNav";
import { getAmbulanceRequests, updateAmbulanceRequestStatus } from "../api";
import { useSelector } from "react-redux";

const AmbulanceLogger = () => {
  const phcRole = useSelector((state) => state.user.phcRole);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [lastPendingCount, setLastPendingCount] = useState(0);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAmbulanceRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch ambulance requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phcRole !== "phc_staff") {
      return;
    }

    fetchRequests();
    const interval = setInterval(fetchRequests, 15000);
    return () => clearInterval(interval);
  }, [phcRole]);

  const pendingCount = useMemo(
    () => requests.filter((r) => String(r.status || "") === "requested").length,
    [requests],
  );

  useEffect(() => {
    if (pendingCount > lastPendingCount) {
      setInfo(`New ambulance request received (${pendingCount} pending)`);
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          // Browser-level signal for staff when a new request arrives.
          new Notification("New Ambulance Request", {
            body: `${pendingCount} request(s) awaiting acceptance`,
          });
        } else if (Notification.permission === "default") {
          Notification.requestPermission();
        }
      }
    }
    setLastPendingCount(pendingCount);
  }, [pendingCount, lastPendingCount]);

  const handleAccept = async (requestId) => {
    setActingId(requestId);
    setError("");
    setInfo("");
    try {
      await updateAmbulanceRequestStatus({
        request_id: requestId,
        status: "in_transit",
        notes: "Accepted by PHC staff",
      });
      setInfo("Ambulance request accepted successfully");
      await fetchRequests();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to accept request");
    } finally {
      setActingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "requested":
        return "orange";
      case "in_transit":
        return "blue";
      case "arrived":
        return "teal";
      case "completed":
        return "green";
      case "cancelled":
        return "gray";
      default:
        return "gray";
    }
  };

  if (phcRole !== "phc_staff") {
    return (
      <div style={{ padding: 16 }}>
        <PHCNav />
        <Alert color="red" title="Access Denied">
          Only PHC staff can manage ambulance requests.
        </Alert>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />

      <Group justify="space-between" mb="md">
        <Title order={2}>Ambulance Requests</Title>
        <Button onClick={fetchRequests} loading={loading}>
          Refresh
        </Button>
      </Group>

      <Group mb="md" gap="sm">
        <Card withBorder radius="md" p="md" w={220}>
          <Text size="xs" fw={700} c="orange.7">PENDING</Text>
          <Text size="xl" fw={700}>{pendingCount}</Text>
        </Card>
        <Card withBorder radius="md" p="md" w={220}>
          <Text size="xs" fw={700} c="blue.7">IN TRANSIT</Text>
          <Text size="xl" fw={700}>{requests.filter((r) => r.status === "in_transit").length}</Text>
        </Card>
      </Group>

      {info ? (
        <Alert color="blue" mb="md">{info}</Alert>
      ) : null}
      {error ? (
        <Alert color="red" mb="md">{error}</Alert>
      ) : null}

      {loading ? (
        <Loader />
      ) : (
        <Card withBorder radius="md" p="lg">
          {requests.length === 0 ? (
            <Text c="dimmed">No ambulance requests yet.</Text>
          ) : (
            <Stack gap="sm">
              <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Patient</Table.Th>
                    <Table.Th>Pickup</Table.Th>
                    <Table.Th>Destination</Table.Th>
                    <Table.Th>Requested</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {requests.map((row) => (
                    <Table.Tr key={row.id}>
                      <Table.Td>{row.id}</Table.Td>
                      <Table.Td>{row.patient_name}</Table.Td>
                      <Table.Td>{row.pickup_location || "-"}</Table.Td>
                      <Table.Td>{row.destination || "-"}</Table.Td>
                      <Table.Td>{row.requested_at ? new Date(row.requested_at).toLocaleString() : "-"}</Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(row.status)} variant="light">
                          {row.status || "requested"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {row.status === "requested" ? (
                          <Button
                            size="xs"
                            onClick={() => handleAccept(row.id)}
                            loading={actingId === row.id}
                          >
                            Accept
                          </Button>
                        ) : (
                          <Text size="xs" c="dimmed">No action</Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          )}
        </Card>
      )}
    </div>
  );
};

export default AmbulanceLogger;
