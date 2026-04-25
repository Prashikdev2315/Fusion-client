import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Modal,
  TextInput,
  Text,
  Title,
  Stack,
  Group,
  Badge,
  Alert,
  Loader,
  Textarea,
  Grid,
  Avatar,
  Timeline,
  ActionIcon,
} from "@mantine/core";
import { IconTrash, IconEdit, IconClock } from "@tabler/icons-react";
import PHCNav from "../components/PHCNav";
import {
  getAnnouncements,
  createAnnouncement,
} from "../api";
import { useSelector } from "react-redux";

const AnnouncementBoard = () => {
  const phcRole = useSelector((state) => state.user.phcRole);
  const user = useSelector((state) => state.user);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    content: "",
    priority: "normal",
    target_audience: "all",
  });

  useEffect(() => {
    if (phcRole === "phc_staff") {
      fetchAnnouncements();
    }
  }, [phcRole]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      alert("Error fetching announcements: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (phcRole !== "phc_staff") {
    return (
      <div style={{ padding: 16 }}>
        <PHCNav />
        <Alert color="red" title="Access Denied">
          Only PHC staff can manage announcements.
        </Alert>
      </div>
    );
  }

  const handleOpenCreateModal = () => {
    setCreateForm({
      title: "",
      content: "",
      priority: "normal",
      target_audience: "all",
    });
    setOpenCreateModal(true);
  };

  const handleSubmitCreate = async () => {
    if (!createForm.title || !createForm.content) {
      alert("Please fill title and content");
      return;
    }

    try {
      await createAnnouncement({
        ...createForm,
        posted_by: user.id,
      });
      alert("Announcement posted successfully!");
      setOpenCreateModal(false);
      fetchAnnouncements();
    } catch (error) {
      alert("Error posting announcement: " + (error.response?.data?.message || error.message));
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

  const getAudienceLabel = (audience) => {
    const labels = {
      all: "All Staff",
      doctors: "Doctors",
      nurses: "Nurses",
      admin: "Administrators",
      patients: "Patients",
    };
    return labels[audience] || audience;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />
      <Group justify="space-between" mb="md">
        <Title order={2}> Announcement Board</Title>
        <Group>
          <Button onClick={fetchAnnouncements} loading={loading}>
            Refresh
          </Button>
          <Button onClick={handleOpenCreateModal} color="green">
            New Announcement
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Loader />
      ) : announcements.length > 0 ? (
        <Stack gap="md">
          {announcements.map((announcement) => (
            <Card
              key={announcement.announcement_id}
              withBorder
              radius="md"
              p="lg"
              style={{
                borderLeft: `4px solid ${
                  announcement.priority === "high"
                    ? "#fa5252"
                    : announcement.priority === "normal"
                      ? "#4c6ef5"
                      : "#51cf66"
                }`,
              }}
            >
              <Group justify="space-between" mb="sm">
                <div>
                  <Group gap="sm" mb="xs">
                    <Avatar size="md" radius="md">
                      {announcement.created_by
                        ?.charAt(0)
                        .toUpperCase()}
                    </Avatar>
                    <div>
                      <Text fw={500}>{announcement.created_by}</Text>
                      <Group gap="xs" mt={4}>
                        <Badge size="sm" variant="light">
                          {getAudienceLabel(announcement.target_audience || "all")}
                        </Badge>
                        <Group gap={4}>
                          <IconClock size={14} />
                          <Text size="xs" c="dimmed">
                            {formatDate(announcement.created_at)}
                          </Text>
                        </Group>
                      </Group>
                    </div>
                  </Group>
                </div>
                <Badge color={getPriorityColor(announcement.priority || "normal")}>
                  {announcement.priority || "normal"}
                </Badge>
              </Group>

              <Title order={4} mb="xs">
                {announcement.title}
              </Title>
              <Text size="sm" c="dark" mb="md">
                {announcement.content}
              </Text>

              {announcement.attachment && (
                <Group>
                  <Button size="xs" variant="light">
                    📎 Attachment
                  </Button>
                </Group>
              )}
            </Card>
          ))}
        </Stack>
      ) : (
        <Alert color="gray" title="No Announcements">
          There are no announcements yet. Create one to get started!
        </Alert>
      )}

      {/* Create Announcement Modal */}
      <Modal
        opened={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        title="Create New Announcement"
        centered
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="Announcement title"
            value={createForm.title}
            onChange={(e) =>
              setCreateForm({ ...createForm, title: e.target.value })
            }
            required
          />

          <Textarea
            label="Content"
            placeholder="Enter announcement content"
            value={createForm.content}
            onChange={(e) =>
              setCreateForm({ ...createForm, content: e.target.value })
            }
            minRows={4}
            required
          />

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <label htmlFor="priority" style={{ display: "block", marginBottom: 8 }}>
                <Text size="sm" fw={500}>
                  Priority
                </Text>
              </label>
              <select
                id="priority"
                value={createForm.priority}
                onChange={(e) =>
                  setCreateForm({ ...createForm, priority: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: 8,
                  border: "1px solid #ced4da",
                  borderRadius: 4,
                  fontFamily: "inherit",
                }}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <label htmlFor="audience" style={{ display: "block", marginBottom: 8 }}>
                <Text size="sm" fw={500}>
                  Target Audience
                </Text>
              </label>
              <select
                id="audience"
                value={createForm.target_audience}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    target_audience: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: 8,
                  border: "1px solid #ced4da",
                  borderRadius: 4,
                  fontFamily: "inherit",
                }}
              >
                <option value="all">All Staff</option>
                <option value="doctors">Doctors</option>
                <option value="nurses">Nurses</option>
                <option value="admin">Administrators</option>
                <option value="patients">Patients</option>
              </select>
            </Grid.Col>
          </Grid>

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setOpenCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitCreate}>Post Announcement</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default AnnouncementBoard;
