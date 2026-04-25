import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Modal,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useSelector } from "react-redux";

import PHCNav from "../components/PHCNav";
import {
  getAuditorPendingClaims,
  processAuditorPayment,
  updateAuditorClaimStatus,
  verifyAuditorClaim,
} from "../api";

const VERIFICATION_STATUSES = ["pending_accounts_verification", "submitted"];
const PAYMENT_STATUSES = ["approved", "authority_approved", "auditor_payment_pending"];

function ReimbursementProcessing() {
  const phcRole = useSelector((state) => state.user.phcRole);
  const selectedRole = useSelector((state) => state.user.role);

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [openModal, setOpenModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [notes, setNotes] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const normalizedRole = String(selectedRole || "").toLowerCase();
  const normalizedPhcRole = String(phcRole || "").toLowerCase();
  const isAuditor =
    (normalizedPhcRole === "phc_staff" || normalizedPhcRole === "accounts") &&
    (/(auditor|audit|accounts)/.test(normalizedRole) || normalizedPhcRole === "accounts");
  const isCompounder = normalizedPhcRole === "phc_staff" && !isAuditor;

  const verificationClaims = useMemo(
    () => claims.filter((claim) => VERIFICATION_STATUSES.includes(claim.status)),
    [claims],
  );
  const paymentClaims = useMemo(
    () => claims.filter((claim) => PAYMENT_STATUSES.includes(claim.status)),
    [claims],
  );
  const allClaims = useMemo(() => claims, [claims]);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await getAuditorPendingClaims();
      setClaims(Array.isArray(data) ? data : []);
    } catch (error) {
      alert("Failed to fetch reimbursement claims: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuditor || isCompounder) {
      fetchClaims();
    }
  }, [isAuditor, isCompounder]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending_accounts_verification":
      case "submitted":
        return "yellow";
      case "authority_approval_pending":
        return "blue";
      case "approved":
      case "authority_approved":
      case "auditor_payment_pending":
        return "teal";
      case "reimbursed":
        return "green";
      case "rejected":
        return "red";
      default:
        return "gray";
    }
  };

  const openClaimModal = (claim) => {
    setSelectedClaim(claim);
    setNotes("");
    setPaymentReference("");
    setOpenModal(true);
  };

  const executeAction = async (action) => {
    if (!selectedClaim) {
      return;
    }

    setSubmitting(true);
    try {
      if (action === "verify") {
        await verifyAuditorClaim({ claim_id: selectedClaim.claim_id, notes });
      } else if (action === "process_payment") {
        await processAuditorPayment({
          claim_id: selectedClaim.claim_id,
          notes,
          payment_reference: paymentReference,
        });
      } else if (action === "forward_to_professor") {
        // BR-08: Forward to professor for high-value claims
        await updateAuditorClaimStatus({
          claim_id: selectedClaim.claim_id,
          action: "forward_to_professor",
          notes,
        });
      } else if (action === "forward_to_accounts") {
        // BR-08: Skip professor, send directly to accounts
        await updateAuditorClaimStatus({
          claim_id: selectedClaim.claim_id,
          action: "forward_to_accounts",
          notes,
        });
      } else {
        await updateAuditorClaimStatus({
          claim_id: selectedClaim.claim_id,
          action,
          notes,
        });
      }

      setOpenModal(false);
      await fetchClaims();
    } catch (error) {
      alert("Action failed: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const renderRows = (rows, mode) => {
    if (!rows.length) {
      return (
        <Table.Tr>
          <Table.Td colSpan={7}>
            <Text c="dimmed" ta="center">No claims available for this stage.</Text>
          </Table.Td>
        </Table.Tr>
      );
    }

    return rows.map((claim) => (
      <Table.Tr key={claim.claim_id}>
        <Table.Td>{claim.claim_id}</Table.Td>
        <Table.Td>{claim.user_name}</Table.Td>
        <Table.Td>Rs. {claim.amount}</Table.Td>
        <Table.Td>{claim.reason}</Table.Td>
        <Table.Td>
          <Badge color={getStatusColor(claim.status)}>{claim.status}</Badge>
        </Table.Td>
        <Table.Td>{new Date(claim.created_at).toLocaleString()}</Table.Td>
        <Table.Td>
          {isCompounder && VERIFICATION_STATUSES.includes(claim.status) ? (
            <Button size="xs" variant="light" onClick={() => openClaimModal(claim)}>
              Check
            </Button>
          ) : isAuditor && (VERIFICATION_STATUSES.includes(claim.status) || PAYMENT_STATUSES.includes(claim.status)) ? (
            <Button size="xs" variant="light" onClick={() => openClaimModal(claim)}>
              {PAYMENT_STATUSES.includes(claim.status) || mode === "payment" ? "Process Payment" : "Review"}
            </Button>
          ) : (
            <Text size="xs" c="dimmed">No action</Text>
          )}
        </Table.Td>
      </Table.Tr>
    ));
  };

  if (!isAuditor && !isCompounder) {
    return (
      <div style={{ padding: 16 }}>
        <PHCNav />
        <Alert color="red" title="Access Denied">
          This screen is restricted to Accounts/Audit (Auditor) and PHC Staff (Compounder) users.
        </Alert>
      </div>
    );
  }

  const inBasicValidationStage = selectedClaim && (VERIFICATION_STATUSES.includes(selectedClaim.status) || selectedClaim.status === "submitted");
  const inVerificationStage = selectedClaim && VERIFICATION_STATUSES.includes(selectedClaim.status);

  const pageTitle = isCompounder ? "Reimbursement Processing - Validity Check" : "Auditor Reimbursement Processing";

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />
      <Title order={2} mb="md">{pageTitle}</Title>

      <Grid mb="md">
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder radius="md" p="md" bg="yellow.0">
            <Text size="xs" fw={700} c="yellow.8">{isCompounder ? "PENDING VALIDATION" : "AUDITOR VERIFICATION"}</Text>
            <Text size="xl" fw={700}>{verificationClaims.length}</Text>
          </Card>
        </Grid.Col>
        {!isCompounder && (
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Card withBorder radius="md" p="md" bg="teal.0">
              <Text size="xs" fw={700} c="teal.8">READY FOR PAYMENT</Text>
              <Text size="xl" fw={700}>{paymentClaims.length}</Text>
            </Card>
          </Grid.Col>
        )}
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder radius="md" p="md" bg="blue.0">
            <Text size="xs" fw={700} c="blue.8">TOTAL CLAIMS</Text>
            <Text size="xl" fw={700}>{allClaims.length}</Text>
          </Card>
        </Grid.Col>
      </Grid>

      {loading ? (
        <Loader />
      ) : (
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="all" badge={allClaims.length}>All Claims</Tabs.Tab>
            <Tabs.Tab value="verification" badge={verificationClaims.length}>{isCompounder ? "Pending Validation" : "Verification Stage"}</Tabs.Tab>
            {!isCompounder && <Tabs.Tab value="payment" badge={paymentClaims.length}>Payment Stage</Tabs.Tab>}
          </Tabs.List>

          <Tabs.Panel value="all" pt="md">
            <Card withBorder radius="md" p="lg">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Claim ID</Table.Th>
                    <Table.Th>Employee</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Reason</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Submitted</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{renderRows(allClaims, "all")}</Table.Tbody>
              </Table>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="verification" pt="md">
            <Card withBorder radius="md" p="lg">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Claim ID</Table.Th>
                    <Table.Th>Employee</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Reason</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Submitted</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{renderRows(verificationClaims, "verification")}</Table.Tbody>
              </Table>
            </Card>
          </Tabs.Panel>

          {!isCompounder && (
            <Tabs.Panel value="payment" pt="md">
              <Card withBorder radius="md" p="lg">
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Claim ID</Table.Th>
                      <Table.Th>Employee</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th>Reason</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Submitted</Table.Th>
                      <Table.Th>Action</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>{renderRows(paymentClaims, "payment")}</Table.Tbody>
                </Table>
              </Card>
            </Tabs.Panel>
          )}
        </Tabs>
      )}

      <Modal
        opened={openModal}
        onClose={() => setOpenModal(false)}
        title={isCompounder ? "Check Claim Validity" : inVerificationStage ? "Verify Claim" : "Process Payment"}
        centered
        size="lg"
      >
        {selectedClaim && (
          <Stack gap="md">
            <Group grow>
              <div>
                <Text size="sm" c="dimmed">Claim ID</Text>
                <Text fw={600}>{selectedClaim.claim_id}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Employee</Text>
                <Text fw={600}>{selectedClaim.user_name}</Text>
              </div>
            </Group>

            <Group grow>
              <div>
                <Text size="sm" c="dimmed">Claim Amount</Text>
                <Text fw={600}>Rs. {selectedClaim.amount}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Current Status</Text>
                <Badge color={getStatusColor(selectedClaim.status)}>{selectedClaim.status}</Badge>
              </div>
            </Group>

            <div>
              <Text size="sm" c="dimmed">Claim Reason / Details</Text>
              <Text fw={500}>{selectedClaim.reason}</Text>
            </div>

            <div>
              <Text size="sm" c="dimmed" mb={6}>Supporting Documents</Text>
              {Array.isArray(selectedClaim.documents) && selectedClaim.documents.length ? (
                <Stack gap={6}>
                  {selectedClaim.documents.map((doc) => (
                    <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer">
                      {doc.name}
                    </a>
                  ))}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed">No documents attached.</Text>
              )}
            </div>

            <Textarea
              label={isCompounder ? "Validity Check Notes" : "Audit Notes"}
              placeholder={isCompounder ? "Add notes from basic validity check" : "Add verification/payment notes"}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              minRows={3}
            />

            {!isCompounder && !inVerificationStage && (
              <TextInput
                label="Payment Reference"
                placeholder="Transaction ID or voucher number"
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
              />
            )}

            <Group justify="flex-end">
              <Button variant="light" onClick={() => setOpenModal(false)} disabled={submitting}>
                Cancel
              </Button>

              {isCompounder ? (
                <>
                  <Button color="red" onClick={() => executeAction("reject")} loading={submitting}>
                    Reject
                  </Button>
                  <Button color="orange" onClick={() => executeAction("forward_to_professor")} loading={submitting}>
                    📋 Forward to Professor
                  </Button>
                  <Button color="blue" onClick={() => executeAction("forward_to_accounts")} loading={submitting}>
                    ✓ Forward to Accounts (Skip Prof)
                  </Button>
                </>
              ) : inVerificationStage ? (
                <>
                  <Button variant="default" onClick={() => executeAction("verify")} loading={submitting}>
                    Mark Verified
                  </Button>
                  <Button color="red" onClick={() => executeAction("reject")} loading={submitting}>
                    Reject
                  </Button>
                  <Button color="blue" onClick={() => executeAction("forward")} loading={submitting}>
                    Forward to Authority
                  </Button>
                </>
              ) : (
                <Button color="green" onClick={() => executeAction("process_payment")} loading={submitting}>
                  Process Payment
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}

export default ReimbursementProcessing;
