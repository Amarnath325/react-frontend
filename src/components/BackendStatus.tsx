import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface BackendResponse {
  message: string;
  status: string;
}

const BackendStatus: React.FC = () => {
  const [status, setStatus] = useState<string>('Checking...');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      const response = await api.get<BackendResponse>('/test');
      setStatus(response.data.message);
    } catch (error) {
      setStatus('Backend not connected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 p-4 bg-gray-100 rounded-lg">
      <h3 className="font-semibold mb-2">Backend Status:</h3>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <p className={status.includes('connected') ? 'text-green-600' : 'text-red-600'}>
          {status}
        </p>
      )}
    </div>
  );
};

export default BackendStatus;