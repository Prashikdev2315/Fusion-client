import React from 'react';

const LoadingState = ({ text = 'Loading...' }) => {
  return <div style={{ padding: '12px' }}>{text}</div>;
};

export default LoadingState;