import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import { useDatabase } from '../contexts/DatabaseContext';

const Chart = ({ selectedAsset }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const { executeQuery } = useDatabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache for storing fetched data to avoid redundant queries
  const dataCache = useRef({});

  // Function to fetch OHLCV data for the selected asset with limit
  const fetchOHLCVData = useCallback((assetId) => {
    // Check if we have cached data for this asset
    if (dataCache.current[assetId]) {
      return dataCache.current[assetId];
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Optimize query by using a single query with proper indexing
      const query = `
        SELECT timestamp, open, high, low, close, volume 
        FROM ohlcv 
        WHERE symbol = '${assetId}' 
        ORDER BY timestamp DESC
        LIMIT 500
      `;

      const result = executeQuery(query);
      if (!result || !result.length) {
        setLoading(false);
        return [];
      }

      // Process the data and sort it back to ascending order
      const processedData = result[0].values.map(row => ({
        time: Math.floor(row[0] / 1000), // Convert milliseconds to seconds and ensure integer
        open: parseFloat(row[1]),
        high: parseFloat(row[2]),
        low: parseFloat(row[3]),
        close: parseFloat(row[4]),
        volume: parseFloat(row[5])
      })).sort((a, b) => a.time - b.time);
      
      // Cache the result
      dataCache.current[assetId] = processedData;
      
      return processedData;
    } catch (err) {
      setError(`Error fetching chart data: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [executeQuery]);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Clean up any existing chart before creating a new one
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }

    // Initialize the chart
    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 600,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create candlestick series
    candlestickSeriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Create volume series
    volumeSeriesRef.current = chartRef.current.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Set to empty string to create a new scale
    });

    // Handle window resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        volumeSeriesRef.current = null;
      }
    };
  }, []);

  // Update chart data when selected asset changes
  useEffect(() => {
    if (!selectedAsset || !candlestickSeriesRef.current || !volumeSeriesRef.current) return;

    const updateChartData = () => {
      const data = fetchOHLCVData(selectedAsset.id);
      if (data.length > 0) {
        // Log data to help debug
        console.log('Chart data:', data);
        
        candlestickSeriesRef.current.setData(data);
        
        // Prepare volume data with colors based on price movement
        const volumeData = data.map((item) => ({
          time: item.time,
          value: item.volume,
          color: item.close >= item.open ? '#26a69a80' : '#ef535080',
        }));
        
        volumeSeriesRef.current.setData(volumeData);
        
        // Fit content to ensure all data is visible
        chartRef.current.timeScale().fitContent();
      } else {
        console.log('No chart data available for', selectedAsset.id);
      }
    };
    
    updateChartData();
  }, [selectedAsset, fetchOHLCVData]);

  return (
    <div className="chart-container">
      {selectedAsset ? (
        <>
          {loading && (
            <div className="text-center mb-2">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading chart data...</p>
            </div>
          )}
          
          {error && (
            <div className="alert alert-danger mb-2">
              {error}
            </div>
          )}
          
          <div ref={chartContainerRef} style={{ width: '100%', height: '600px' }} />
        </>
      ) : (
        <div className="alert alert-info">
          Select an asset from the watchlist to view its chart
        </div>
      )}
    </div>
  );
};

export default Chart;