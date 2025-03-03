import React, { useRef, useState } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const DatabaseUploader = () => {
  const fileInputRef = useRef(null);
  const { loadDatabase, loading, error, isDbValid, closeDatabase } = useDatabase();
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState(null);

  const validateFileType = (file) => {
    // Check if the file has a valid extension
    const validExtensions = ['.db', '.sqlite', '.sqlite3'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      return `Invalid file type. Please upload a SQLite database file (${validExtensions.join(', ')}).`;
    }
    
    // Check file size (optional, can be adjusted based on requirements)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return `File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`;
    }
    
    return null;
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setFileError(null);
    
    // Validate file before processing
    const validationError = validateFileType(file);
    if (validationError) {
      setFileError(validationError);
      return;
    }
    
    // Close any existing database connection
    closeDatabase();
    
    // Read the file as ArrayBuffer
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;
      await loadDatabase(arrayBuffer);
    };
    reader.onerror = (e) => {
      setFileError(`Error reading file: ${e.target.error.message || 'Unknown error'}`); 
    };
    reader.readAsArrayBuffer(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="database-uploader mb-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".db,.sqlite,.sqlite3"
        style={{ display: 'none' }}
      />
      <div className="d-grid gap-2">
        <button
          className="btn btn-primary"
          onClick={handleButtonClick}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Loading...
            </>
          ) : (
            'Upload SQLite Database'
          )}
        </button>
      </div>
      
      {fileName && (
        <div className="mt-2 text-muted small">
          Selected file: {fileName}
        </div>
      )}
      
      {fileError && (
        <div className="alert alert-danger mt-3" role="alert">
          {fileError}
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}
      
      {isDbValid && (
        <div className="alert alert-success mt-3" role="alert">
          Database loaded successfully!
        </div>
      )}
    </div>
  );
};

export default DatabaseUploader;