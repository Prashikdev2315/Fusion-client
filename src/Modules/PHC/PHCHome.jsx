import React, { useEffect, useState } from "react";
import { Card, Grid, Text, Button, Group, Title, Badge, Alert, Loader, Stack } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import PHCNav from "./components/PHCNav";
import { getAnnouncements } from "./api";
import { useSelector } from "react-redux";

const ANNOUNCEMENTS_SEEN_KEY = "phc_announcements_seen_at";

const cards = [
  {
    title: "Book Appointment",
    description: "View doctor availability and book consultation slots.",
    path: "/phc/appointments",
    features: ["Check doctor slots", "Book consultation", "Track bookings"],
  },
  {
    title: "Visit History",
    description: "Check consultation records and prescriptions.",
    path: "/phc/prescriptions",
    features: ["Past consultations", "Prescriptions", "Treatment timeline"],
  },
  {
    title: "Health Profile",
    description: "View patient health details and profile info.",
    path: "/phc/health-profile",
    features: ["Vitals overview", "Medical profile", "Health notes"],
  },
  {
    title: "Ambulance Requests",
    description: "Create and track emergency ambulance requests.",
    path: "/phc/ambulance",
    features: ["Raise request", "Track request", "Emergency support"],
    role: "phc_staff",
  },
];


function PHCHome() {
  const navigate = useNavigate();
  const phcRole = useSelector((state) => state.user.phcRole);
  const selectedRole = useSelector((state) => state.user.role);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState("");
  const [seenAtMs, setSeenAtMs] = useState(() => Number(localStorage.getItem(ANNOUNCEMENTS_SEEN_KEY) || 0));

  const normalizedRole = String(selectedRole || "").toLowerCase();
  const isProfessorView = normalizedRole === "professor";
  const isAuditorView = /(auditor|audit|accounts)/.test(normalizedRole);
  const effectiveRole = isProfessorView ? "professor" : phcRole;
  const isPatientDashboard = effectiveRole !== "phc_staff" && !isAuditorView;
  const visibleCards = cards.filter((card) => !card.role || card.role === effectiveRole);
  const unreadAnnouncements = announcements.filter(
    (row) => Date.parse(row.created_at || "") > seenAtMs,
  ).length;
  const readAnnouncementsCount = Math.max(announcements.length - unreadAnnouncements, 0);

  const markAnnouncementsRead = () => {
    const latestAnnouncementMs = announcements.length
      ? Math.max(...announcements.map((row) => Date.parse(row.created_at || "") || 0))
      : Date.now();
    localStorage.setItem(ANNOUNCEMENTS_SEEN_KEY, String(latestAnnouncementMs));
    setSeenAtMs(latestAnnouncementMs);
  };

  const removeReadAnnouncements = () => {
    setAnnouncements((prev) =>
      prev.filter((row) => Date.parse(row.created_at || "") > seenAtMs),
    );
  };

  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    setAnnouncementsError("");
    try {
      const data = await getAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error) {
      setAnnouncementsError(error?.response?.data?.message || "Unable to load announcements");
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  // Redirect to appropriate dashboard based on role
  useEffect(() => {
    if (isAuditorView) {
      navigate("/phc/staff/reimbursement", { replace: true });
    } else if (phcRole === "phc_staff" && !isProfessorView) {
      navigate("/phc/staff/dashboard", { replace: true });
    }
  }, [phcRole, isProfessorView, isAuditorView, navigate]);


  useEffect(() => {
    if (!isPatientDashboard) {
      return;
    }

    fetchAnnouncements();
  }, [isPatientDashboard]);

  return (
    <div style={{ padding: 16 }}>
      <PHCNav overviewUnreadCount={isPatientDashboard ? unreadAnnouncements : 0} />

      {isPatientDashboard ? (
        <div style={{ marginBottom: 24 }}>
          <Title order={2} mb="xs">
            PHC Dashboard
          </Title>
          
        </div>
      ) : null}

      {isPatientDashboard ? (
        <Card withBorder radius="md" p="lg" mb="lg">
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <Title order={4}>Announcements</Title>
              {unreadAnnouncements > 0 ? (
                <Badge size="sm" color="red" variant="filled">
                  {unreadAnnouncements} unread
                </Badge>
              ) : null}
            </Group>
            <Group gap="xs">
              <Button size="xs" variant="light" onClick={fetchAnnouncements} loading={announcementsLoading}>
                Refresh
              </Button>
              <Button
                size="xs"
                variant="subtle"
                onClick={markAnnouncementsRead}
                disabled={unreadAnnouncements === 0}
              >
                Mark all read
              </Button>
              <Button
                size="xs"
                variant="subtle"
                color="red"
                onClick={removeReadAnnouncements}
                disabled={readAnnouncementsCount === 0}
              >
                Remove read
              </Button>
            </Group>
          </Group>

          {announcementsLoading ? (
            <Loader size="sm" />
          ) : announcementsError ? (
            <Alert color="red" title="Could not load announcements">
              {announcementsError}
            </Alert>
          ) : announcements.length === 0 ? (
            <Text c="dimmed" size="sm">
              No announcements available right now.
            </Text>
          ) : (
            <Stack gap="sm">
              {announcements.slice(0, 4).map((announcement) => (
                <Card key={announcement.announcement_id} withBorder radius="md" p="sm" bg="gray.0">
                  <Group justify="space-between" mb={4}>
                    <Text fw={600} size="sm">{announcement.title}</Text>
                    <Badge size="xs" variant="light">PHC</Badge>
                  </Group>
                  <Text size="sm" c="dimmed" mb={6}>{announcement.content}</Text>
                  <Text size="xs" c="gray.6">
                    By {announcement.created_by} • {new Date(announcement.created_at).toLocaleString()}
                  </Text>
                </Card>
              ))}
            </Stack>
          )}
        </Card>
      ) : null}

      <Grid>
        {visibleCards.map((card) => (
          <Grid.Col key={card.path} span={{ base: 12, md: 6, lg: 4 }}>
            <Card withBorder radius="md" p="lg" h="100%">
              <Group justify="space-between" mb="md">
                <div>
                  <Text fw={700} size="lg">
                    {card.title}
                  </Text>
                </div>
              </Group>

              <Text c="dimmed" size="sm" mb="md">{card.description}</Text>

              {isPatientDashboard ? (
                <div style={{ marginBottom: 12 }}>
                  {(card.features || []).map((feature) => (
                    <Badge key={feature} variant="light" size="sm" style={{ marginRight: 4, marginBottom: 4 }}>
                      {feature}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <Group justify="flex-end">
                <Button size="xs" onClick={() => navigate(card.path)}>
                  {isPatientDashboard ? "Access" : "Open"}
                </Button>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </div>
  );
}

export default PHCHome;
