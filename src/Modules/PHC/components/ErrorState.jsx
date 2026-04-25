import React from 'react';

const ErrorState = ({ error }) => {
  return (
    <div style={{ padding: '12px', color: 'crimson' }}>
      {error || 'Something went wrong'}
    </div>
  );
};

export default ErrorState;