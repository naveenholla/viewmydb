import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { DatabaseProvider } from './contexts/DatabaseContext';
import DatabaseUploader from './components/DatabaseUploader';
import Watchlist from './components/Watchlist';
import Chart from './components/Chart';
import StatsPanel from './components/StatsPanel';

function App() {
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  return (
    <DatabaseProvider>
      <div className="App">
        <header className="bg-dark text-white p-3">
          <h1>ViewMyDB</h1>
          <p>SQLite Database Viewer with Chart Visualization</p>
        </header>
        <main className="container-fluid mt-3">
          <div className="row">
            <div className="col-md-3">
              <div className="card">
                <div className="card-header">
                  <h5>Watchlist</h5>
                </div>
                <div className="card-body">
                  <DatabaseUploader />
                  <Watchlist onSelectAsset={setSelectedAsset} selectedAsset={selectedAsset} />
                </div>
              </div>
            </div>
            <div className="col-md-9">
              <div className="card mb-3">
                <div className="card-header">
                  <h5>Chart {selectedAsset ? `- ${selectedAsset.name}` : ''}</h5>
                </div>
                <div className="card-body">
                  <Chart selectedAsset={selectedAsset} />
                </div>
              </div>
              <StatsPanel selectedAsset={selectedAsset} />
            </div>
          </div>
        </main>
      </div>
    </DatabaseProvider>
  );
}

export default App;