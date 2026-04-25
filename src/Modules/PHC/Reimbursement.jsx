import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Grid, Group, NumberInput, Progress, Stack, Text, TextInput, Textarea, Title } from "@mantine/core";
import { applyReimbursement, getReimbursementStatus } from "./api";
import PHCNav from "./components/PHCNav";
import { useSelector } from "react-redux";

function Reimbursement() {
  const phcRole = useSelector((state) => state.user.phcRole);
  const selectedRole = useSelector((state) => state.user.role);
  const normalizedRole = String(selectedRole || "").toLowerCase();
  const effectiveRole = normalizedRole === "professor" ? "professor" : phcRole;
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [claims, setClaims] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const claimStats = (() => {
    const total = claims.length;
    const pending = claims.filter((row) => ["submitted", "pending", "in_review"].includes(String(row.status || ""))).length;
    const approved = claims.filter((row) => String(row.status || "") === "approved").length;
    const rejected = claims.filter((row) => String(row.status || "") === "rejected").length;
    const processed = approved + rejected;

    return {
      total,
      pending,
      approved,
      rejected,
      processed,
      progress: total > 0 ? (processed / total) * 100 : 0,
    };
  })();

  const loadStatus = async () => {
    setError("");
    try {
      const data = await getReimbursementStatus();
      setClaims(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch reimbursement status");
    }
  };

  useEffect(() => {
    if (effectiveRole === "professor") {
      loadStatus();
    }
  }, [effectiveRole]);

  const submitClaim = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (!documents.length) {
        setError("Please attach at least one supporting document.");
        return;
      }

      if (!expenseDate) {
        setError("Please select the expense date.");
        return;
      }

      await applyReimbursement({ amount, reason, expense_date: expenseDate, documents });
      setMessage("Reimbursement claim submitted successfully");
      setAmount(0);
      setReason("");
      setExpenseDate("");
      setDocuments([]);
      await loadStatus();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to submit claim");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />
      <Title order={2} mb="xs">Reimbursement</Title>
      <Text c="dimmed" mb="md">Professor-only reimbursement flow.</Text>

      {effectiveRole !== "professor" ? (
        <Alert color="red" title="Access denied">
          Reimbursement is available only for professor role.
        </Alert>
      ) : (
        <Stack>
          <Card withBorder radius="md" p="md">
            <form onSubmit={submitClaim}>
              <Stack>
                <NumberInput label="Amount" value={amount} min={1} onChange={setAmount} required />
                <TextInput
                  label="Expense Date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
                <Textarea label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
                <div>
                  <Text size="sm" mb={6}>Supporting Documents (required)</Text>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(event) => setDocuments(Array.from(event.target.files || []))}
                  />
                  <Text size="xs" c="dimmed" mt={4}>
                    Allowed: PDF, PNG, JPG, DOC, DOCX. Max 10MB each. Submit within 30 days of the expense date.
                  </Text>
                </div>
                <Group justify="flex-end">
                  <Button type="submit">Apply Reimbursement</Button>
                </Group>
              </Stack>
            </form>
          </Card>

          {message ? <Alert color="green">{message}</Alert> : null}
          {error ? <Alert color="red">{error}</Alert> : null}

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder radius="md" p="md" bg="blue.0">
                <Text size="xs" fw={700} c="blue.7">TOTAL CLAIMS</Text>
                <Text size="xl" fw={700}>{claimStats.total}</Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder radius="md" p="md" bg="yellow.0">
                <Text size="xs" fw={700} c="yellow.7">PENDING</Text>
                <Text size="xl" fw={700}>{claimStats.pending}</Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder radius="md" p="md" bg="green.0">
                <Text size="xs" fw={700} c="green.7">APPROVED</Text>
                <Text size="xl" fw={700}>{claimStats.approved}</Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder radius="md" p="md" bg="red.0">
                <Text size="xs" fw={700} c="red.7">REJECTED</Text>
                <Text size="xl" fw={700}>{claimStats.rejected}</Text>
              </Card>
            </Grid.Col>
          </Grid>

          {claimStats.total > 0 ? (
            <Card withBorder radius="md" p="lg">
              <Group justify="space-between" mb="xs">
                <Text fw={600}>Processing Progress</Text>
                <Text size="sm" c="dimmed">
                  {claimStats.processed} of {claimStats.total} processed
                </Text>
              </Group>
              <Progress value={claimStats.progress} color="blue" radius="md" />
            </Card>
          ) : null}

          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="sm">
              <Text fw={700}>Claim Status</Text>
              <Button size="xs" variant="light" onClick={loadStatus}>Refresh</Button>
            </Group>
            <pre style={{ margin: 0 }}>{JSON.stringify(claims, null, 2)}</pre>
          </Card>
        </Stack>
      )}
    </div>
  );
}

export default Reimbursement;
