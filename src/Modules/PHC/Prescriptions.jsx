import React, { useEffect, useMemo, useState } from 'react';
import { getPrescriptions } from './api';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import PHCNav from './components/PHCNav';
import { Alert, Badge, Button, Card, Group, Stack, Table, Text, Title } from '@mantine/core';
import { useSelector } from 'react-redux';
import { downloadPdfReport } from './utils/pdfExport';

const parsePrescriptionPayload = (value) => {
  if (!value) {
    return {
      diagnosisDetails: '-',
      specialInstructions: '-',
      medicines: [],
      recommendedTests: '-',
      followUpSuggestions: '-',
    };
  }

  if (typeof value === 'object') {
    return {
      diagnosisDetails: value.diagnosis_details || value.diagnosis || '-',
      specialInstructions: value.special_instructions || '-',
      medicines: Array.isArray(value.medicines) ? value.medicines : [],
      recommendedTests: value.recommended_tests || '-',
      followUpSuggestions: value.follow_up_suggestions || '-',
    };
  }

  const rawText = String(value).trim();
  try {
    const parsed = JSON.parse(rawText);
    return {
      diagnosisDetails: parsed.diagnosis_details || parsed.diagnosis || '-',
      specialInstructions: parsed.special_instructions || '-',
      medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
      recommendedTests: parsed.recommended_tests || '-',
      followUpSuggestions: parsed.follow_up_suggestions || '-',
    };
  } catch (e) {
    return {
      diagnosisDetails: rawText || '-',
      specialInstructions: '-',
      medicines: [],
      recommendedTests: '-',
      followUpSuggestions: '-',
    };
  }
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const Prescriptions = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadingAll, setDownloadingAll] = useState(false);

  const selectedRole = useSelector((state) => state.user.role);
  const normalizedRole = String(selectedRole || '').toLowerCase();
  const canViewPrescriptions = normalizedRole === 'student' || normalizedRole === 'professor';

  const normalizedItems = useMemo(
    () =>
      (Array.isArray(items) ? items : []).map((item) => ({
        id: item.visit_id || item.id,
        appointmentId: item.appointment_id,
        doctorName: item.doctor_name || item.doctor || item.doctor_id,
        createdAt: item.created_at,
        diagnosis: item.diagnosis,
        ...parsePrescriptionPayload(item.prescription),
      })),
    [items],
  );

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPrescriptions();
      setItems(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetch();
  }, []);

  const handleDownloadSingle = (record) => {
    downloadPdfReport({
      fileName: `prescription_${record.id || 'record'}.pdf`,
      title: 'PHC Prescription',
      subtitle: `Prescription #${record.id || 'record'} generated from the PHC record system.`,
      metadata: [
        ['Prescription ID', record.id || '-'],
        ['Appointment ID', record.appointmentId || '-'],
        ['Doctor', record.doctorName || '-'],
        ['Issued At', formatDate(record.createdAt)],
        ['Diagnosis', record.diagnosis || '-'],
        ['Diagnosis / Details', record.diagnosisDetails],
        ['Special Instructions', record.specialInstructions],
        ['Recommended Tests', record.recommendedTests],
        ['Follow-up Suggestions', record.followUpSuggestions],
      ],
      sections: [
        {
          title: 'Medicines',
          headers: ['Medicine', 'Dosage', 'Frequency', 'Duration'],
          rows: record.medicines.length
            ? record.medicines.map((medicine) => [
              medicine.name || medicine.medicine || '-',
              medicine.dosage || '-',
              medicine.frequency || '-',
              medicine.duration || '-',
            ])
            : [['No structured medicine list attached.', '-', '-', '-']],
          headColor: [37, 99, 235],
        },
      ],
    });
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    setError('');
    try {
      downloadPdfReport({
        fileName: `medical_records_${new Date().toISOString().split('T')[0]}.pdf`,
        title: 'PHC Medical Records',
        subtitle: 'Compiled prescription records exported from the PHC module.',
        metadata: [
          ['Total Prescriptions', normalizedItems.length],
        ],
        sections: [
          {
            title: 'Prescription List',
            headers: ['Prescription ID', 'Doctor', 'Issued', 'Diagnosis', 'Medicines', 'Tests', 'Follow-up'],
            rows: normalizedItems.map((item) => [
              item.id || '-',
              item.doctorName || '-',
              formatDate(item.createdAt),
              item.diagnosis || '-',
              item.medicines.length
                ? item.medicines.map((medicine) => medicine.name || medicine.medicine || '-').join('; ')
                : '-',
              item.recommendedTests,
              item.followUpSuggestions,
            ]),
            headColor: [37, 99, 235],
          },
        ],
      });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to download prescriptions');
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />
      <Title order={2} mb="md">PHC - Prescriptions</Title>

      {!canViewPrescriptions ? (
        <Alert color="red" title="Access denied" mb="md">
          Prescription view is available only for student and professor roles.
        </Alert>
      ) : null}

      <Group mb="md">
        <Button variant="light" onClick={handleFetch}>Refresh</Button>
        <Button
          variant="outline"
          onClick={handleDownloadAll}
          loading={downloadingAll}
          disabled={!canViewPrescriptions}
        >
          Download All Prescriptions as PDF
        </Button>
      </Group>

      {canViewPrescriptions ? (
        <Text c="dimmed" mb="md">Total Prescriptions: {normalizedItems.length}</Text>
      ) : null}

      {loading && <LoadingState />}
      {error && <ErrorState error={error} />}
      {!loading && !error && canViewPrescriptions ? (
        <Stack>
          {normalizedItems.length === 0 ? (
            <Card withBorder radius="md" p="md">
              <Text c="dimmed">No prescription records available yet.</Text>
            </Card>
          ) : (
            normalizedItems.map((item) => (
              <Card key={item.id} withBorder radius="md" p="md">
                <Group justify="space-between" mb="xs">
                  <Text fw={700}>Prescription #{item.id}</Text>
                  <Badge variant="light">ISSUED</Badge>
                </Group>

                <Group justify="space-between" mb="sm">
                  <Text size="sm"><strong>Doctor:</strong> {item.doctorName || '-'}</Text>
                  <Text size="sm"><strong>Issued:</strong> {formatDate(item.createdAt)}</Text>
                </Group>

                <Text size="sm" mb="xs"><strong>Prescription Date:</strong> {formatDate(item.createdAt)}</Text>
                <Text size="sm" mb="xs"><strong>Diagnosis:</strong> {item.diagnosis || '-'}</Text>
                <Text size="sm" mb="xs"><strong>Diagnosis / Details:</strong> {item.diagnosisDetails}</Text>
                <Text size="sm" mb="xs"><strong>Special Instructions:</strong> {item.specialInstructions}</Text>

                <Text fw={600} mt="sm" mb="xs">Prescribed Medicines ({item.medicines.length})</Text>
                {item.medicines.length > 0 ? (
                  <Table withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Medicine</Table.Th>
                        <Table.Th>Dosage</Table.Th>
                        <Table.Th>Frequency</Table.Th>
                        <Table.Th>Duration</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {item.medicines.map((medicine, idx) => (
                        <Table.Tr key={`${item.id}-medicine-${idx}`}>
                          <Table.Td>{medicine.name || medicine.medicine || '-'}</Table.Td>
                          <Table.Td>{medicine.dosage || '-'}</Table.Td>
                          <Table.Td>{medicine.frequency || '-'}</Table.Td>
                          <Table.Td>{medicine.duration || '-'}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                ) : (
                  <Text size="sm" c="dimmed">No structured medicine list attached.</Text>
                )}

                <Text size="sm" mt="sm" mb="xs"><strong>Recommended Tests:</strong> {item.recommendedTests}</Text>
                <Text size="sm" mb="sm"><strong>Follow-up Suggestions:</strong> {item.followUpSuggestions}</Text>

                <Group justify="flex-end">
                  <Button size="xs" variant="light" onClick={() => handleDownloadSingle(item)}>
                    Download PDF
                  </Button>
                </Group>
              </Card>
            ))
          )}
        </Stack>
      ) : null}
    </div>
  );
};

export default Prescriptions;