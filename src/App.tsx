import React from 'react';
import BackendStatus from './components/BackendStatus';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
            🎉 React + Laravel Setup
          </h1>
          <p className="text-gray-600 text-center">
            Frontend: React + TypeScript + Tailwind
          </p>
          <p className="text-gray-600 text-center mb-6">
            Backend: Laravel API
          </p>
          <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200">
            Connect to Backend
          </button>
          <BackendStatus />
        </div>
      </div>
    </div>
  );
}

export default App;