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
  Modal,
  Tabs,
  Timeline,
  ThemeIcon,
} from "@mantine/core";
import { IconCircleCheck, IconCircleDashed, IconAlertCircle } from "@tabler/icons-react";
import PHCNav from "../components/PHCNav";
import { getReimbursementClaimsForStaff, processReimbursement } from "../api";
import { useSelector } from "react-redux";

const ClaimApproval = () => {
  const phcRole = useSelector((state) => state.user.phcRole);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionForm, setActionForm] = useState({
    action: "",
    notes: "",
  });
  const [activeFilter, setActiveFilter] = useState("phc_review");
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await getReimbursementClaimsForStaff();
      setClaims(data);
    } catch (error) {
      alert("Error fetching claims: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (phcRole !== "phc_staff") {
    return (
      <div style={{ padding: 16 }}>
        <PHCNav />
        <Alert color="red" title="Access Denied">
          Only PHC staff can process reimbursement claims.
        </Alert>
      </div>
    );
  }

  const filteredClaims = claims.filter((c) => {
    if (activeTab === "pending") return c.status === activeFilter || c.current_stage === activeFilter;
    if (activeTab === "completed")
      return c.status === "approved" || c.status === "rejected" || c.status === "reimbursed";
    return true;
  });

  const handleAction = (claim, action) => {
    setSelectedClaim(claim);
    setActionForm({ action: action, notes: "" });
    setShowModal(true);
  };

  const submitAction = async () => {
    if (!actionForm.notes.trim() && actionForm.action !== "forward") {
      alert("Please provide notes/reason");
      return;
    }

    try {
      const selectedClaimId = selectedClaim?.claim_id ?? selectedClaim?.id;
      await processReimbursement({
        claim_id: selectedClaimId,
        action: actionForm.action,
        notes: actionForm.notes,
        stage: activeFilter,
      });

      alert(`✅ Claim ${actionForm.action === "forward" ? "forwarded" : actionForm.action}`);
      setShowModal(false);
      fetchClaims();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      alert(`❌ Error: ${errorMsg}`);
    }
  };

  const getStageColor = (stage) => {
    if (stage === "phc_review") return "blue";
    if (stage === "accounts_review") return "orange";
    if (stage === "sanction") return "purple";
    if (stage === "payment") return "green";
    return "gray";
  };

  const getClaimId = (claim) => claim?.claim_id ?? claim?.id;

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />

      <Title order={2} mb="md">
        Process Reimbursement Claims
      </Title>
      <Text c="dimmed" mb="lg">
        Review and approve medical bill reimbursement claims
      </Text>

      <Tabs value={activeTab} onChange={setActiveTab} mb="md">
        <Tabs.List>
          <Tabs.Tab value="pending" leftSection="⏳">
            Pending Review ({claims.filter((c) => c.status).length})
          </Tabs.Tab>
          <Tabs.Tab value="completed" leftSection="✅">
            Completed ({claims.filter((c) => c.status === "approved" || c.status === "rejected").length})
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Tabs value={activeFilter} onChange={setActiveFilter} mb="md">
        <Tabs.List>
          <Tabs.Tab value="phc_review" leftSection="🔍">
            PHC Review
          </Tabs.Tab>
          <Tabs.Tab value="accounts_review" leftSection="💰">
            Accounts Review
          </Tabs.Tab>
          <Tabs.Tab value="sanction" leftSection="📋">
            Sanction Authority
          </Tabs.Tab>
          <Tabs.Tab value="payment" leftSection="💳">
            Final Payment
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {filteredClaims.length === 0 ? (
        <Alert color="blue" title="No Claims">
          No claims to show in this stage.
        </Alert>
      ) : (
        <Stack gap="md">
          {filteredClaims.map((claim, index) => {
            const claimId = getClaimId(claim);
            const claimKey = claimId ?? `claim-${index}`;

            return (
            <Card key={claimKey} withBorder p="md">
              <Group justify="space-between" mb="md">
                <div>
                  <Text fw={500} size="lg">
                    Claim #{claimId}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Patient: {claim.patient_name} | Amount: ₹{claim.amount?.toFixed(2)}
                  </Text>
                </div>
                <Badge color={getStageColor(claim.current_stage)} size="lg">
                  {claim.current_stage?.replace(/_/g, " ").toUpperCase()}
                </Badge>
              </Group>

              <Stack gap="xs" mb="md">
                <div>
                  <Text size="sm" c="dimmed">
                    Medical Expense Date: {claim.expense_date}
                  </Text>
                </div>

                <div>
                  <Text size="sm" c="dimmed" mb={8}>
                    Claim Progress:
                  </Text>
                  <Timeline active={2} bulletSize={24} lineWidth={2}>
                    <Timeline.Item
                      bullet={<IconCircleDashed size={12} />}
                      title="Submitted"
                      color={claim.status === "submitted" ? "red" : "blue"}
                    >
                      <Text size="xs" c="dimmed">
                        {claim.submitted_date}
                      </Text>
                    </Timeline.Item>
                    <Timeline.Item
                      bullet={claim.current_stage === "phc_review" ? <IconCircleCheck size={12} /> : <IconCircleDashed size={12} />}
                      title="PHC Review"
                      color={claim.current_stage === "phc_review" || claim.status === "approved" ? "green" : "gray"}
                    >
                      <Text size="xs" c="dimmed">
                        {claim.phc_review_date || "Pending"}
                      </Text>
                    </Timeline.Item>
                    <Timeline.Item
                      bullet={claim.current_stage === "accounts_review" ? <IconCircleCheck size={12} /> : <IconCircleDashed size={12} />}
                      title="Accounts Review"
                      color={claim.current_stage === "accounts_review" || claim.status === "approved" ? "green" : "gray"}
                    >
                      <Text size="xs" c="dimmed">
                        {claim.accounts_review_date || "Pending"}
                      </Text>
                    </Timeline.Item>
                    <Timeline.Item
                      bullet={claim.current_stage === "payment" ? <IconCircleCheck size={12} /> : <IconCircleDashed size={12} />}
                      title="Final Payment"
                      color={claim.status === "reimbursed" ? "green" : "gray"}
                    >
                      <Text size="xs" c="dimmed">
                        {claim.payment_date || "Pending"}
                      </Text>
                    </Timeline.Item>
                  </Timeline>
                </div>

                <div>
                  <Text size="sm" c="dimmed">
                    Reason: {claim.reason}
                  </Text>
                </div>

                {claim.notes && (
                  <div>
                    <Text size="sm" c="dimmed">
                      Previous Notes: {claim.notes}
                    </Text>
                  </div>
                )}
              </Stack>

              {claim.current_stage === activeFilter && claim.status === "pending" && (
                <Group justify="flex-end">
                  <Button color="red" variant="light" onClick={() => handleAction(claim, "reject")}>
                    Reject Claim
                  </Button>
                  <Button color="green" onClick={() => handleAction(claim, "forward")}>
                    Forward to Next Stage
                  </Button>
                </Group>
              )}
            </Card>
            );
          })}
        </Stack>
      )}

      <Modal opened={showModal} onClose={() => setShowModal(false)} title="Process Claim">
        <Stack gap="md">
          <Alert
            color={actionForm.action === "reject" ? "red" : "green"}
            title={actionForm.action === "reject" ? "Rejection" : "Forward"}
          >
            {actionForm.action === "reject"
              ? `You are about to REJECT Claim #${selectedClaim?.claim_id ?? selectedClaim?.id}`
              : `You are about to FORWARD Claim #${selectedClaim?.claim_id ?? selectedClaim?.id} to next stage`}
          </Alert>

          <Textarea
            label={actionForm.action === "reject" ? "Rejection Reason *" : "Processing Notes"}
            placeholder={
              actionForm.action === "reject" ? "Explain why this claim is being rejected..." : "Add any notes for the next reviewer..."
            }
            value={actionForm.notes}
            onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
            minRows={4}
            required={actionForm.action === "reject"}
          />

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button color={actionForm.action === "reject" ? "red" : "green"} onClick={submitAction}>
              {actionForm.action === "reject" ? "Reject" : "Forward"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default ClaimApproval;
