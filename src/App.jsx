import React from 'react';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';

// If using the hook from Step 4:
import { useBluetoothData } from './hooks/useFirebaseData';

function App() {
  const { data, loading, error } = useBluetoothData();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <PrivateRoute>
      <Dashboard data={data} />;
    </PrivateRoute>
  )
}

export default App;