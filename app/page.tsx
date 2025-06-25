'use client';

import { useState } from 'react';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Teams File Organizer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Organize and manage your Microsoft Teams files efficiently
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Connect to Microsoft Teams to start organizing your files.
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Connection Status
                </h3>
                <p className="text-blue-700 dark:text-blue-200">
                  {isConnected ? 'Connected to Microsoft Teams' : 'Not connected'}
                </p>
              </div>

              <button
                onClick={() => setIsConnected(!isConnected)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isConnected ? 'Disconnect' : 'Connect to Teams'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}