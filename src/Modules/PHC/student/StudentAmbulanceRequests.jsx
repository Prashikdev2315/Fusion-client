import React from 'react';
import { Alert, Loader, Title } from '@mantine/core';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import PHCNav from '../components/PHCNav';

const StudentAmbulanceRequests = () => {
  const userRole = useSelector((state) => state.user.role);
  const isStaff = String(useSelector((state) => state.user.phcRole || '')).toLowerCase() === 'phc_staff';
  const roleResolved = userRole !== undefined && userRole !== null;

  if (!roleResolved) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '20px' }}>
        <PHCNav />
        <Loader />
      </div>
    );
  }

  if (isStaff) {
    return <Navigate to="/phc/ambulance" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '20px' }}>
      <PHCNav />
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Title order={2} mb="md">Ambulance Access Restricted</Title>
        <Alert color="blue" title="PHC Staff Only">
          Ambulance requests are handled by PHC staff. Please contact PHC for assistance.
        </Alert>
      </div>
    </div>
  );
};

export default StudentAmbulanceRequests;
