import React, { useState, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const Watchlist = ({ onSelectAsset, selectedAsset }) => {
  const { executeQuery, isDbValid } = useDatabase();
  const [assets, setAssets] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  // We no longer need local state for selectedAsset as it's now passed as a prop
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load assets from the database when it's valid
  useEffect(() => {
    if (isDbValid) {
      fetchAssets();
    } else {
      setAssets([]);
    }
  }, [isDbValid]);

  // Load watchlist from local storage on component mount
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('watchlist');
    if (savedWatchlist) {
      try {
        setWatchlist(JSON.parse(savedWatchlist));
      } catch (error) {
        console.error('Error parsing watchlist from localStorage:', error);
        localStorage.removeItem('watchlist');
      }
    }
  }, []);

  // Save watchlist to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Fetch all assets from the database
  const fetchAssets = () => {
    const result = executeQuery('SELECT DISTINCT symbol FROM ohlcv ORDER BY symbol');
    if (result && result.length > 0) {
      const assetList = result[0].values.map(row => ({
        id: row[0],
        name: row[0]
      }));
      setAssets(assetList);
    }
  };

  // Add an asset to the watchlist
  const addToWatchlist = (asset) => {
    if (!watchlist.some(item => item.id === asset.id)) {
      setWatchlist([...watchlist, asset]);
    }
    setShowAddModal(false);
  };

  // Remove an asset from the watchlist
  const removeFromWatchlist = (assetId) => {
    setWatchlist(watchlist.filter(asset => asset.id !== assetId));
    if (selectedAsset && selectedAsset.id === assetId) {
      onSelectAsset(null);
    }
  };

  // Select an asset to view its chart
  const selectAsset = (asset) => {
    onSelectAsset(asset);
  };

  // Filter assets not in watchlist for the add modal
  const availableAssets = assets.filter(
    asset => !watchlist.some(item => item.id === asset.id)
  );

  // Filter available assets by search term
  const filteredAvailableAssets = availableAssets.filter(
    asset => asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="watchlist-container">
      {/* Watchlist display */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">My Watchlist</h6>
        <button 
          className="btn btn-sm btn-outline-primary" 
          onClick={() => setShowAddModal(true)}
          disabled={!isDbValid || availableAssets.length === 0}
        >
          Add Asset
        </button>
      </div>

      {watchlist.length > 0 ? (
        <ul className="list-group">
          {watchlist.map(asset => (
            <li 
              key={asset.id} 
              className={`list-group-item d-flex justify-content-between align-items-center ${selectedAsset && selectedAsset.id === asset.id ? 'active' : ''}`}
              onClick={() => selectAsset(asset)}
            >
              <span>{asset.name}</span>
              <button 
                className="btn btn-sm btn-outline-danger" 
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromWatchlist(asset.id);
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="alert alert-info">
          {isDbValid ? 'No assets in watchlist. Add some!' : 'Upload a database to view assets'}
        </div>
      )}

      {/* Modal for adding assets */}
      {showAddModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add to Watchlist</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {filteredAvailableAssets.length > 0 ? (
                  <ul className="list-group">
                    {filteredAvailableAssets.map(asset => (
                      <li 
                        key={asset.id} 
                        className="list-group-item d-flex justify-content-between align-items-center"
                        onClick={() => addToWatchlist(asset)}
                        style={{ cursor: 'pointer' }}
                      >
                        {asset.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center">No assets available to add</p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;