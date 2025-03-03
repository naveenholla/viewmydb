import React, { createContext, useState, useContext, useEffect } from 'react';
import initSqlJs from 'sql.js';

const DatabaseContext = createContext();

export const useDatabase = () => useContext(DatabaseContext);

export const DatabaseProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDbValid, setIsDbValid] = useState(false);

  // Initialize SQL.js and load the bundled database
  useEffect(() => {
    const initAndLoadDatabase = async () => {
      setLoading(true);
      setError(null);

      try {
        // Initialize SQL.js
        const SQL = await initSqlJs({
          locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`,
        });

        // Fetch the bundled database
        const response = await fetch('/market_data.db'); // Path relative to public/
        if (!response.ok) {
          throw new Error('Failed to fetch market_data.db');
        }
        const arrayBuffer = await response.arrayBuffer();

        // Load the database
        const database = new SQL.Database(new Uint8Array(arrayBuffer));
        const isValid = validateDatabaseStructure(database);

        if (isValid) {
          setDb(database);
          setIsDbValid(true);
        } else {
          database.close();
          // Error is already set in validateDatabaseStructure
        }
      } catch (err) {
        setError(`Failed to initialize database: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    initAndLoadDatabase();

    return () => {
      if (db) {
        db.close();
      }
    };
  }, []); // Empty dependency array since we only load once on mount

  const validateDatabaseStructure = (database) => {
    try {
      const ohlcvTableCheck = database.exec(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='ohlcv'"
      );
      if (!ohlcvTableCheck.length || !ohlcvTableCheck[0].values.length) {
        setError("Missing required 'ohlcv' table in the database.");
        return false;
      }

      const ohlcvColumnsCheck = database.exec("PRAGMA table_info(ohlcv)");
      const ohlcvColumns = ohlcvColumnsCheck[0].values.map(row => row[1]);
      const requiredColumns = ['timestamp', 'symbol', 'open', 'high', 'low', 'close', 'volume'];
      const missingOhlcvColumns = requiredColumns.filter(col => !ohlcvColumns.includes(col));

      if (missingOhlcvColumns.length > 0) {
        setError(`Missing required columns in 'ohlcv' table: ${missingOhlcvColumns.join(', ')}.`);
        return false;
      }

      const ohlcvCount = database.exec("SELECT COUNT(DISTINCT symbol) FROM ohlcv");
      if (ohlcvCount[0].values[0][0] === 0) {
        setError("The 'ohlcv' table is empty. Database must contain at least one symbol.");
        return false;
      }

      const sampleTimestamp = database.exec("SELECT timestamp FROM ohlcv LIMIT 1");
      if (sampleTimestamp[0].values.length > 0) {
        const timestampValue = sampleTimestamp[0].values[0][0];
        if (isNaN(Date.parse(timestampValue))) {
          setError("The 'timestamp' column contains unparseable TEXT values.");
          return false;
        }
      }

      return true;
    } catch (err) {
      setError('Error validating database structure: ' + err.message);
      return false;
    }
  };

  const executeQuery = (sql, params = []) => {
    if (!db) {
      setError('No database loaded');
      return null;
    }
    try {
      return db.exec(sql, params);
    } catch (err) {
      setError('Query error: ' + err.message);
      return null;
    }
  };

  const value = {
    db,
    loading,
    error,
    isDbValid,
    executeQuery,
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};