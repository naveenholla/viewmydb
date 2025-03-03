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
  const dataCache = useRef({});

  const fetchOHLCVData = useCallback((assetId) => {
    if (dataCache.current[assetId]) {
      console.log(`[Chart] Returning cached data for ${assetId}:`, dataCache.current[assetId]);
      return dataCache.current[assetId];
    }

    setLoading(true);
    setError(null);

    try {
      const query = `
        SELECT timestamp, open, high, low, close, volume 
        FROM ohlcv 
        WHERE symbol = '${assetId}' 
        ORDER BY timestamp ASC 
        LIMIT 500
      `;
      console.log(`[Chart] Executing query for ${assetId}:`, query);

      const result = executeQuery(query);
      console.log('[Chart] Raw query result:', result);

      if (!result || !result.length || !result[0].values.length) {
        console.warn(`[Chart] No data found for ${assetId}`);
        setError(`No OHLCV data available for ${assetId}`);
        setLoading(false);
        return [];
      }

      const processedData = result[0].values.map((row, index) => {
        const timestampText = row[0]; // e.g., "2018-03-07 03:45:00"
        const timestamp = Date.parse(timestampText);
        if (isNaN(timestamp)) {
          console.warn(`[Chart] Invalid timestamp at index ${index}: ${timestampText}`);
          throw new Error(`Invalid timestamp format: ${timestampText}`);
        }

        const item = {
          time: Math.floor(timestamp / 1000),
          open: parseFloat(row[1]),
          high: parseFloat(row[2]),
          low: parseFloat(row[3]),
          close: parseFloat(row[4]),
          volume: parseFloat(row[5]),
        };

        if ([item.open, item.high, item.low, item.close, item.volume].some(isNaN)) {
          console.warn(`[Chart] Invalid numeric data at index ${index}:`, row);
          throw new Error(`Invalid numeric data at index ${index}`);
        }
        return item;
      });

      console.log(`[Chart] Processed data for ${assetId}:`, processedData);
      dataCache.current[assetId] = processedData;
      return processedData;
    } catch (err) {
      setError(`Error fetching chart data: ${err.message}`);
      console.error('[Chart] Fetch error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [executeQuery]);

  useEffect(() => {
    if (!chartContainerRef.current) {
      console.log('[Chart] Container not ready');
      return;
    }

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }

    console.log('[Chart] Initializing chart');
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 600,
      layout: { backgroundColor: '#ffffff', textColor: '#333' }, // Updated per docs
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      timeScale: { timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;

    console.log('[Chart] Chart instance:', chartRef.current);
    console.log('[Chart] addCandlestickSeries available:', typeof chartRef.current.addCandlestickSeries);

    try {
      candlestickSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      volumeSeriesRef.current = chartRef.current.addHistogramSeries({
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '', // Separate scale for volume
      });

      console.log('[Chart] Series initialized:', {
        candlestick: candlestickSeriesRef.current,
        volume: volumeSeriesRef.current,
      });
    } catch (err) {
      console.error('[Chart] Series creation error:', err);
      setError(`Failed to create chart series: ${err.message}`);
      return;
    }

    if (selectedAsset) {
      console.log('[Chart] Updating chart for:', selectedAsset.id);
      const data = fetchOHLCVData(selectedAsset.id);

      if (data.length === 0) {
        console.warn('[Chart] No data to display for:', selectedAsset.id);
        candlestickSeriesRef.current.setData([]);
        volumeSeriesRef.current.setData([]);
      } else {
        console.log('[Chart] Setting candlestick data:', data);
        candlestickSeriesRef.current.setData(data);
        const volumeData = data.map((item) => ({
          time: item.time,
          value: item.volume,
          color: item.close >= item.open ? '#26a69a80' : '#ef535080',
        }));
        console.log('[Chart] Setting volume data:', volumeData);
        volumeSeriesRef.current.setData(volumeData);
        chartRef.current.timeScale().fitContent();
        console.log('[Chart] Chart updated for:', selectedAsset.id);
      }
    }

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
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
              {error && <div className="alert alert-danger mb-2">{error}</div>}
              <div ref={chartContainerRef} style={{ width: '100%', height: '600px' }} />
            </>
        ) : (
            <div className="alert alert-info">Select an asset from the watchlist to view its chart</div>
        )}
      </div>
  );
};

export default Chart;