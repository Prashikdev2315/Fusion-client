import React, { useEffect, useState } from "react";
import { Alert, Card, Grid, Text, Button, Group, Title, Badge } from "@mantine/core";
import { Navigate, useNavigate } from "react-router-dom";
import PHCNav from "../components/PHCNav";
import { useSelector } from "react-redux";
import { getAmbulanceRequests } from "../api";

const staffFeatures = [
  {
    title: "Patient Management",
    description: "Search patients, view history, create visit records",
    path: "/phc/staff/patients",
    features: ["Search patients", "View medical history", "Create visits"],
  },
  {
    title: "Appointment Handling",
    description: "View scheduled appointments and manage patient visits",
    path: "/phc/staff/appointments",
    features: ["Scheduled appointments", "Mark completed", "Create prescriptions"],
  },
  {
    title: "Doctor Management",
    description: "Manage doctor schedules and mark attendance",
    path: "/phc/staff/doctors",
    features: ["Manage schedules", "Mark attendance", "View availability"],
  },
  {
    title: "Inventory Management",
    description: "Track medicine stock and manage inventory",
    path: "/phc/staff/inventory",
    features: ["View stock levels", "Add/deduct stock", "Low-stock alerts"],
  },
  {
    title: "Requisition Workflow",
    description: "Create and fulfill medicine requisitions",
    path: "/phc/staff/requisitions",
    features: ["Create requisitions", "Track status", "Fulfill orders"],
  },
  {
    title: "Requisition Approval",
    description: "Approve or reject pending medicine requisition requests",
    path: "/phc/staff/requisitions/approve",
    features: ["View pending requisitions", "Approve/Reject", "Add review notes"],
  },
  {
    title: "Ambulance Requests",
    description: "Review incoming ambulance requests and accept dispatches",
    path: "/phc/staff/ambulance",
    features: ["View pending requests", "Accept request", "Track in-transit"],
  },
  {
    title: "Announcements",
    description: "Broadcast messages to all PHC users",
    path: "/phc/staff/announcements",
    features: ["Create announcement", "View history", "Manage messages"],
  },
];


function StaffDashboard() {
  const navigate = useNavigate();
  const phcRole = useSelector((state) => state.user.phcRole);
  const selectedRole = useSelector((state) => state.user.role);
  const [pendingAmbulanceCount, setPendingAmbulanceCount] = useState(0);

  const normalizedRole = String(selectedRole || "").toLowerCase();
  const isAuditorView = /(auditor|audit|accounts)/.test(normalizedRole) || phcRole === "accounts";
  const canAccessStaffDashboard = phcRole === "phc_staff" && normalizedRole !== "professor" && !isAuditorView;


  useEffect(() => {
    if (!canAccessStaffDashboard) {
      return;
    }

    const fetchPendingAmbulance = async () => {
      try {
        const rows = await getAmbulanceRequests("requested");
        setPendingAmbulanceCount(Array.isArray(rows) ? rows.length : 0);
      } catch (_error) {
        setPendingAmbulanceCount(0);
      }
    };

    fetchPendingAmbulance();
    const interval = setInterval(fetchPendingAmbulance, 15000);
    return () => clearInterval(interval);
  }, [canAccessStaffDashboard]);

  if (!canAccessStaffDashboard) {
    return <Navigate to="/phc/staff/reimbursement" replace />;
  }

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />

      <div style={{ marginBottom: 24 }}>
        <Title order={2} mb="xs">
          PHC Staff Dashboard
        </Title>

      </div>

      {pendingAmbulanceCount > 0 ? (
        <Alert color="orange" mb="md" title="Ambulance Attention Needed">
          {pendingAmbulanceCount} ambulance request(s) are pending acceptance.
          <Button size="xs" ml="sm" onClick={() => navigate("/phc/staff/ambulance")}>Open Queue</Button>
        </Alert>
      ) : null}

      <Grid>
        {staffFeatures.map((feature) => (
          <Grid.Col key={feature.path} span={{ base: 12, md: 6, lg: 4 }}>
            <Card withBorder radius="md" p="lg" h="100%">
              <Group justify="space-between" mb="md">
                <div>
                  <Text fw={700} size="lg">
                    {feature.title}
                  </Text>
                </div>
              </Group>

              <Text c="dimmed" size="sm" mb="md">
                {feature.description}
              </Text>

              <div style={{ marginBottom: 12 }}>
                {feature.features.map((f) => (
                  <Badge key={f} variant="light" size="sm" style={{ marginRight: 4, marginBottom: 4 }}>
                    {f}
                  </Badge>
                ))}
              </div>

              <Group justify="flex-end">
                <Button size="xs" onClick={() => navigate(feature.path)}>
                  Access
                </Button>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </div>
  );
}

export default StaffDashboard;
