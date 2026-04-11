import React from 'react';
import { useAuth } from '../context/AuthContext';

const Students: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Students Management</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">Student management module coming soon...</p>
          <p className="text-gray-600 mt-2">You are logged in as: {user?.user_type}</p>
        </div>
      </div>
    </div>
  );
};

export default Students;