import React, { useState } from 'react';
import { getHealthProfile } from './api';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import PHCNav from './components/PHCNav';
import { Button, Card, Group, Stack, Text, TextInput, Title } from '@mantine/core';

const HealthProfile = () => {
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    if (!username) return;
    setLoading(true);
    setError('');
    setProfile(null);
    try {
      const data = await getHealthProfile(username);
      setProfile(data);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <PHCNav />
      <Title order={2} mb="md">PHC - Health Profile</Title>
      <Card withBorder radius="md" p="md" mb="md">
        <Group>
          <TextInput
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <Button onClick={handleFetch}>Fetch</Button>
        </Group>
      </Card>

      {loading && <LoadingState />}
      {error && <ErrorState error={error} />}
      {profile ? (
        <Card withBorder radius="md" p="md">
          <Stack gap="xs">
            {Object.keys(profile).map((key) => (
              <Group key={key} justify="space-between">
                <Text fw={600}>{key}</Text>
                <Text c="dimmed">{typeof profile[key] === 'object' ? JSON.stringify(profile[key]) : String(profile[key])}</Text>
              </Group>
            ))}
          </Stack>
        </Card>
      ) : null}
    </div>
  );
};

export default HealthProfile;