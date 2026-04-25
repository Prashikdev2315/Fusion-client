import React from 'react';
import { Badge, Table, Text } from '@mantine/core';

const statusColorMap = {
  booked: 'blue',
  completed: 'green',
  cancelled: 'red',
};

const AppointmentsTable = ({ data = [] }) => {
  if (!data.length) return <Text c="dimmed">No appointments found.</Text>;

  return (
    <Table striped highlightOnHover withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>ID</Table.Th>
          <Table.Th>Patient</Table.Th>
          <Table.Th>Doctor</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Date</Table.Th>
          <Table.Th>Time</Table.Th>
          <Table.Th>Status</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {data.map((row) => (
          <Table.Tr key={row.id}>
            <Table.Td>{row.id}</Table.Td>
            <Table.Td>{row.patient}</Table.Td>
            <Table.Td>{row.doctor || '-'}</Table.Td>
            <Table.Td>{row.appointment_type}</Table.Td>
            <Table.Td>{row.appointment_date}</Table.Td>
            <Table.Td>{row.appointment_time}</Table.Td>
            <Table.Td>
              <Badge variant="light" color={statusColorMap[row.status] || 'gray'}>
                {row.status}
              </Badge>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};

export default React.memo(AppointmentsTable);