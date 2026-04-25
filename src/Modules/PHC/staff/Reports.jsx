import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useSelector } from "react-redux";
import PHCNav from "../components/PHCNav";
import { getSystemReport } from "../api";
import { downloadPdfReport } from "../utils/pdfExport";

const REPORT_OPTIONS = [
  { value: "reimbursement", label: "Reimbursement" },
  { value: "inventory", label: "Inventory" },
  { value: "appointments", label: "Appointments" },
  { value: "requisition", label: "Requisition" },
];

const ALLOWED_REPORT_TYPES = REPORT_OPTIONS.map((option) => option.value);

function Reports() {
  const phcRole = useSelector((state) => state.user.phcRole);
  const [reportType, setReportType] = useState("reimbursement");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  const rowColumns = useMemo(() => {
    const rows = report?.rows || [];
    return rows.length ? Object.keys(rows[0]) : [];
  }, [report]);

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    const safeReportType = ALLOWED_REPORT_TYPES.includes(reportType) ? reportType : "reimbursement";
    if (safeReportType !== reportType) {
      setReportType(safeReportType);
    }

    try {
      const data = await getSystemReport({
        report_type: safeReportType,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      setReport(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = async () => {
    setError("");
    const safeReportType = ALLOWED_REPORT_TYPES.includes(reportType) ? reportType : "reimbursement";
    if (safeReportType !== reportType) {
      setReportType(safeReportType);
    }

    try {
      const data = report || await getSystemReport({
        report_type: safeReportType,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });

      downloadPdfReport({
        fileName: `phc_${safeReportType}_report.pdf`,
        title: "PHC System Report",
        subtitle: `${safeReportType.toUpperCase()} report generated for the selected date range.`,
        metadata: [
          ["Report Type", safeReportType],
          ["From Date", fromDate || "-"],
          ["To Date", toDate || "-"],
          ["Generated Rows", (data.rows || []).length],
        ],
        sections: [
          {
            title: "Summary Metrics",
            headers: ["Metric", "Value"],
            rows: Object.entries(data.summary || {}).map(([key, value]) => [
              key,
              typeof value === "object" ? JSON.stringify(value) : String(value),
            ]),
            headColor: [37, 99, 235],
          },
          {
            title: "Report Rows",
            headers: rowColumns.length ? rowColumns : ["No Data"],
            rows: (data.rows || []).map((row) => (rowColumns.length ? rowColumns.map((col) => row[col] ?? "") : ["No rows available"])),
            headColor: [30, 41, 59],
          },
        ],
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to export PDF");
    }
  };

  if (phcRole !== "phc_staff") {
    return (
      <div style={{ padding: 16 }}>
        <PHCNav />
        <Alert color="red" title="Access Denied">
          Reports are available only for PHC staff.
        </Alert>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />
      <Title order={2} mb="md">System Reports</Title>

      <Card withBorder radius="md" p="md" mb="md">
        <Stack>
          <Group grow>
            <Select
              label="Report Type"
              data={REPORT_OPTIONS}
              value={reportType}
              onChange={(value) => {
                const next = value || "reimbursement";
                setReportType(ALLOWED_REPORT_TYPES.includes(next) ? next : "reimbursement");
              }}
            />
            <TextInput
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <TextInput
              label="To Date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </Group>
          <Group>
            <Button onClick={fetchReport} loading={loading}>Generate</Button>
            <Button variant="light" onClick={exportPdf}>Export PDF</Button>
          </Group>
          <Text size="sm" c="dimmed">
            If dates are empty, backend defaults to the last 30 days.
          </Text>
        </Stack>
      </Card>

      {error ? <Alert color="red" mb="md">{error}</Alert> : null}

      {report ? (
        <Stack>
          <Card withBorder radius="md" p="md">
            <Text fw={700} mb="xs">Summary</Text>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
              {Object.entries(report.summary || {}).map(([key, value]) => (
                <Card key={key} withBorder radius="md" p="sm" bg="gray.0">
                  <Text size="xs" c="dimmed">{key}</Text>
                  <Text fw={700}>{typeof value === "object" ? JSON.stringify(value) : String(value)}</Text>
                </Card>
              ))}
            </SimpleGrid>
          </Card>

          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Text fw={700}>Rows</Text>
              <Text size="sm" c="dimmed">{(report.rows || []).length} records</Text>
            </Group>
            {(report.rows || []).length === 0 ? (
              <Text c="dimmed">No data available for selected filters.</Text>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    {rowColumns.map((col) => (
                      <Table.Th key={col}>{col}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {report.rows.map((row, idx) => (
                    <Table.Tr key={idx}>
                      {rowColumns.map((col) => (
                        <Table.Td key={`${idx}-${col}`}>{String(row[col] ?? "")}</Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Stack>
      ) : null}
    </div>
  );
}

export default Reports;
