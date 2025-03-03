import React, { useEffect, useState, useRef } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const StatsPanel = ({ selectedAsset }) => {
  const { executeQuery } = useDatabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    priceChange: null,
    priceChangePercent: null,
    highestPrice: null,
    lowestPrice: null,
    averageVolume: null,
    totalVolume: null,
    dataPoints: 0,
    firstDate: null,
    lastDate: null
  });
  
  // Cache for storing fetched stats to avoid redundant queries
  const statsCache = useRef({});

  useEffect(() => {
    if (!selectedAsset) {
      // Reset stats when no asset is selected
      setStats({
        priceChange: null,
        priceChangePercent: null,
        highestPrice: null,
        lowestPrice: null,
        averageVolume: null,
        totalVolume: null,
        dataPoints: 0,
        firstDate: null,
        lastDate: null
      });
      setError(null);
      return;
    }

    // Check if we have cached stats for this asset
    if (statsCache.current[selectedAsset.id]) {
      setStats(statsCache.current[selectedAsset.id]);
      return;
    }

    // Fetch OHLCV data for the selected asset
    const fetchAssetStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const optimizedQuery = `
      WITH asset_data AS (
        SELECT 
          MIN(timestamp) as first_timestamp,
          MAX(timestamp) as last_timestamp,
          MIN(low) as lowest_price,
          MAX(high) as highest_price,
          AVG(volume) as avg_volume,
          SUM(volume) as total_volume,
          COUNT(*) as data_points
        FROM ohlcv 
        WHERE symbol = '${selectedAsset.id}'
      )
      SELECT 
        first_timestamp, last_timestamp, lowest_price, highest_price,
        avg_volume, total_volume, data_points,
        (SELECT close FROM ohlcv WHERE symbol = '${selectedAsset.id}' ORDER BY timestamp ASC LIMIT 1) as first_price,
        (SELECT close FROM ohlcv WHERE symbol = '${selectedAsset.id}' ORDER BY timestamp DESC LIMIT 1) as last_price
      FROM asset_data
    `;

        const result = executeQuery(optimizedQuery);
        if (!result || !result.length || !result[0].values.length) {
          setError('No data available for this asset');
          setLoading(false);
          return;
        }

        const data = result[0].values[0];
        const firstTimestamp = Date.parse(data[0]); // Parse TEXT to milliseconds
        const lastTimestamp = Date.parse(data[1]);
        if (isNaN(firstTimestamp) || isNaN(lastTimestamp)) {
          throw new Error('Invalid timestamp format in database');
        }

        const firstDate = new Date(firstTimestamp);
        const lastDate = new Date(lastTimestamp);
        const firstPrice = data[7];
        const lastPrice = data[8];
        const priceChange = lastPrice - firstPrice;
        const priceChangePercent = firstPrice !== 0 ? (priceChange / firstPrice) * 100 : 0;

        const statsData = {
          priceChange,
          priceChangePercent,
          lowestPrice: data[2],
          highestPrice: data[3],
          averageVolume: data[4],
          totalVolume: data[5],
          dataPoints: data[6],
          firstDate: firstDate.toLocaleDateString(),
          lastDate: lastDate.toLocaleDateString(),
        };

        statsCache.current[selectedAsset.id] = statsData;
        setStats(statsData);
      } catch (err) {
        setError(`Error fetching statistics: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAssetStats();
  }, [selectedAsset, executeQuery]);

  // Format numbers for display
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
  };

  // Format large numbers (like volume) with K, M, B suffixes
  const formatLargeNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return (num / 1000).toFixed(2) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(2) + 'M';
    return (num / 1000000000).toFixed(2) + 'B';
  };

  return (
    <div className="stats-panel">
      {selectedAsset ? (
        <div className="card">
          <div className="card-body">
            <h6 className="card-title">Statistics</h6>
            
            {loading && (
              <div className="text-center mb-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 small">Loading statistics...</p>
              </div>
            )}
            
            {error && (
              <div className="alert alert-danger mb-3 small">
                {error}
              </div>
            )}
            
            {!loading && !error && (
              <>
                <div className="row">
                  <div className="col-6">
                    <div className="mb-3">
                      <small className="text-muted">Price Change</small>
                      <div className={`fw-bold ${stats.priceChange > 0 ? 'text-success' : stats.priceChange < 0 ? 'text-danger' : ''}`}>
                        {stats.priceChange !== null ? (stats.priceChange > 0 ? '+' : '') + formatNumber(stats.priceChange) : 'N/A'}
                        {stats.priceChangePercent !== null ? ` (${(stats.priceChangePercent > 0 ? '+' : '')}${formatNumber(stats.priceChangePercent)}%)` : ''}
                      </div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">Highest Price</small>
                      <div className="fw-bold">{formatNumber(stats.highestPrice)}</div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">Lowest Price</small>
                      <div className="fw-bold">{formatNumber(stats.lowestPrice)}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mb-3">
                      <small className="text-muted">Avg Volume</small>
                      <div className="fw-bold">{formatLargeNumber(stats.averageVolume)}</div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">Total Volume</small>
                      <div className="fw-bold">{formatLargeNumber(stats.totalVolume)}</div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">Data Range</small>
                      <div className="fw-bold small">
                        {stats.firstDate} - {stats.lastDate}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-muted small text-center mt-2">
                  Based on {formatNumber(stats.dataPoints, 0)} data points
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="alert alert-info">
          Select an asset to view statistics
        </div>
      )}
    </div>
  );
};

export default StatsPanel;