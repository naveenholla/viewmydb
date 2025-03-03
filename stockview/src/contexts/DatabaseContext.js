import React, { createContext, useState, useContext } from 'react';
import initSqlJs from 'sql.js';

// Create the context
const DatabaseContext = createContext();

// Custom hook to use the database context
export const useDatabase = () => useContext(DatabaseContext);

// Provider component
export const DatabaseProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDbValid, setIsDbValid] = useState(false);

  // Load the database when the component mounts
  React.useEffect(() => {
    const loadLocalDatabase = async () => {
      setLoading(true);
      try {
        const response = await fetch('/market_data.db');
        const arrayBuffer = await response.arrayBuffer();
        await loadDatabase(arrayBuffer);
      } catch (err) {
        setError('Failed to load local database: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadLocalDatabase();

    // Cleanup function
    return () => {
      if (db) {
        db.close();
      }
    };
  }, []);

  // Load the SQL.js library
  const initSql = async () => {
    try {
      return await initSqlJs({
        // Specify the path to the sql-wasm.wasm file
        // This path is relative to the public directory
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
      });
    } catch (err) {
      setError('Failed to initialize SQL.js: ' + err.message);
      return null;
    }
  };

  // Load a database from an ArrayBuffer
  const loadDatabase = async (arrayBuffer) => {
    setLoading(true);
    setError(null);
    setIsDbValid(false);
    
    try {
      // Check if the file is not empty
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        setError('The uploaded file is empty.');
        return;
      }
      
      const SQL = await initSql();
      if (!SQL) return;
      
      try {
        // Create a database from the file
        const database = new SQL.Database(new Uint8Array(arrayBuffer));
        
        // Validate the database structure
        const isValid = validateDatabaseStructure(database);
        
        if (isValid) {
          setDb(database);
          setIsDbValid(true);
        } else {
          database.close();
          // Error is already set in validateDatabaseStructure
        }
      } catch (dbErr) {
        setError('Invalid SQLite database file: ' + dbErr.message);
      }
    } catch (err) {
      setError('Failed to load database: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Validate that the database has the required tables and structure
  const validateDatabaseStructure = (database) => {
    try {
      // Check if 'ohlcv' table exists
      const ohlcvTableCheck = database.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='ohlcv'"
      );
      
      if (!ohlcvTableCheck.length || !ohlcvTableCheck[0].values.length) {
        setError("Missing required 'ohlcv' table in the database.");
        return false;
      }
      
      // Check if ohlcv table has the required columns
      const ohlcvColumnsCheck = database.exec(
        "PRAGMA table_info(ohlcv)"
      );
      
      const ohlcvColumns = ohlcvColumnsCheck[0].values.map(row => row[1]);
      const requiredColumns = ['symbol', 'index_id', 'timestamp', 'open', 'high', 'low', 'close', 'volume'];
      const missingOhlcvColumns = requiredColumns.filter(col => !ohlcvColumns.includes(col));
      
      if (missingOhlcvColumns.length > 0) {
        setError(`Missing required columns in 'ohlcv' table: ${missingOhlcvColumns.join(', ')}.`);
        return false;
      }
      
      // Verify that there's at least one record in the ohlcv table
      const ohlcvCount = database.exec("SELECT COUNT(DISTINCT symbol) FROM ohlcv");
      if (ohlcvCount[0].values[0][0] === 0) {
        setError("The 'ohlcv' table is empty. Database must contain at least one symbol.");
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Error validating database structure: ' + err.message);
      return false;
    }
  };

  // Close the database connection
  const closeDatabase = () => {
    if (db) {
      db.close();
      setDb(null);
      setIsDbValid(false);
    }
  };

  // Execute a SQL query
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
    loadDatabase,
    closeDatabase,
    executeQuery
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};