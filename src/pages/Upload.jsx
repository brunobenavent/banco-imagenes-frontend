// src/pages/Upload.jsx
import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Upload as UploadIcon, FileImage, AlertCircle, CheckCircle, Loader, X, Image as ImageIcon } from 'lucide-react';
import './Upload.css';

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  // Handle file selection
  const handleFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter(file => {
      // Accept more image types
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        setError(` ${file.name} no es una imagen`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} es demasiado grande (máx 10MB)`);
        return false;
      }
      return true;
    });

    // Max 10 files
    if (files.length + validFiles.length > 10) {
      setError('Máximo 10 imágenes permitidas');
      return;
    }

    // Add files with preview URLs
    const filesWithPreviews = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
      articleCode: '',
      status: 'pending', // pending, validated, uploading, uploaded, error
      error: null,
      uploadedData: null
    }));

    setFiles(prev => [...prev, ...filesWithPreviews]);
    setError(null);
    setMessage(null);
  };

  // Remove file
  const removeFile = (id) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  // Handle drag and drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [files]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the dropzone entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  // Validate article code (6 digits)
  const validateCode = (code) => {
    return /^\d{6}$/.test(code);
  };

  // Update article code for a file
  const updateCode = (id, code) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        return {
          ...f,
          articleCode: code,
          status: validateCode(code) ? 'validated' : 'pending',
          error: validateCode(code) ? null : 'Debe ser 6 dígitos'
        };
      }
      return f;
    }));
  };

  // Upload single image
  const uploadSingleImage = async (fileData) => {
    const { id, file, articleCode } = fileData;
    
    try {
      setUploadProgress(prev => ({ ...prev, [id]: 0 }));
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('code', articleCode);  // Send code in form data

      const response = await axios.post('/api/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadProgress(prev => ({ ...prev, [id]: 100 }));
      
      return { id, success: true, data: response.data.image };
    } catch (err) {
      return { 
        id, 
        success: false, 
        error: err.response?.data?.message || 'Error al subir' 
      };
    }
  };

  // Upload all validated images
  const uploadAll = async () => {
    const validatedFiles = files.filter(f => f.status === 'validated');
    
    if (validatedFiles.length === 0) {
      setError('No hay imágenes validadas para subir');
      return;
    }

    setUploading(true);
    setError(null);
    
    let successCount = 0;
    let errorCount = 0;

    for (const fileData of validatedFiles) {
      // Mark as uploading
      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'uploading' } : f
      ));

      const result = await uploadSingleImage(fileData);

      if (result.success) {
        setFiles(prev => prev.map(f => 
          f.id === result.id ? { 
            ...f, 
            status: 'uploaded',
            uploadedData: result.data
          } : f
        ));
        successCount++;
      } else {
        setFiles(prev => prev.map(f => 
          f.id === result.id ? { 
            ...f, 
            status: 'error',
            error: result.error
          } : f
        ));
        errorCount++;
      }
    }

    setUploading(false);
    
    if (successCount > 0) {
      setMessage(`${successCount} imagen${successCount > 1 ? 'es' : ''} subid${successCount > 1 ? 'as' : 'a'} exitosamente`);
    }
    if (errorCount > 0) {
      setError(`${errorCount} error${errorCount > 1 ? 's' : ''} al subir`);
    }
  };

  const formatSize = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

  return (
    <div className="upload-page">
      <div className="upload-header">
        <h1>Subir Imágenes</h1>
        <p>Sube imágenes de artículos (máximo 10)</p>
      </div>

      {error && (
        <div className="upload-message error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {message && (
        <div className="upload-message success">
          <CheckCircle size={18} />
          {message.text || message}
        </div>
      )}

      {/* Drop zone - only show when no files */}
      {files.length === 0 && (
        <div 
          className={`dropzone ${isDragging ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            hidden
          />

          <div className="dropzone-content">
            <UploadIcon size={48} />
            <h3>Arrastra imágenes aquí o haz clic para seleccionar</h3>
            <p>JPG o PNG, máximo 10MB cada una</p>
          </div>
        </div>
      )}

      {/* Add more files button - show when there are already files */}
      {files.length > 0 && files.length < 10 && (
        <button 
          className="btn btn-secondary add-more-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon size={18} />
          Añadir más imágenes ({files.length}/10)
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            hidden
          />
        </button>
      )}

      {/* Upload all button */}
      {files.length > 0 && (
        <button 
          className="btn btn-primary upload-all-btn"
          onClick={uploadAll}
          disabled={uploading || files.filter(f => f.status === 'validated').length === 0}
        >
          {uploading ? <Loader className="spinner" size={18} /> : <UploadIcon size={18} />}
          Subir todas las imágenes ({files.filter(f => f.status === 'validated').length} validadas)
        </button>
      )}

      {/* File list with skeletons */}
      {files.length > 0 && (
        <div className="file-list">
          {files.map((file, index) => (
            <div key={file.id} className={`file-item ${file.status}`}>
              {/* Preview with skeleton */}
              <div className="file-preview">
                {file.preview ? (
                  <img src={file.preview} alt={file.name} />
                ) : (
                  <div className="skeleton-preview" />
                )}
                
                {file.status === 'uploading' && (
                  <div className="upload-progress">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${uploadProgress[file.id] || 0}%` }}
                    />
                  </div>
                )}
                
                {file.status === 'uploaded' && (
                  <div className="upload-success">
                    <CheckCircle size={24} />
                  </div>
                )}
                
                {file.status === 'error' && (
                  <div className="upload-error">
                    <AlertCircle size={24} />
                  </div>
                )}
              </div>

              {/* File info and input */}
              <div className="file-details">
                <div className="file-name">{file.name}</div>
                <div className="file-size">{formatSize(file.size)}</div>
                
                {file.status !== 'uploaded' && file.status !== 'uploading' && (
                  <div className="file-input-group">
                    <input
                      type="text"
                      placeholder="Código (6 dígitos)"
                      value={file.articleCode}
                      onChange={(e) => updateCode(file.id, e.target.value)}
                      maxLength={6}
                      className={validateCode(file.articleCode) ? 'valid' : ''}
                    />
                    <button
                      className="upload-single-btn"
                      onClick={() => uploadSingleImage(file).then(result => {
                        if (result.success) {
                          setFiles(prev => prev.map(f => 
                            f.id === result.id ? { 
                              ...f, 
                              status: 'uploaded',
                              uploadedData: result.data
                            } : f
                          ));
                          setMessage('Imagen subida exitosamente');
                        } else {
                          setFiles(prev => prev.map(f => 
                            f.id === result.id ? { 
                              ...f, 
                              status: 'error',
                              error: result.error
                            } : f
                          ));
                          setError(result.error);
                        }
                      })}
                      disabled={!validateCode(file.articleCode) || file.status === 'uploading'}
                    >
                      <UploadIcon size={16} />
                    </button>
                  </div>
                )}

                {file.error && (
                  <div className="file-error">{file.error}</div>
                )}

                {file.uploadedData && (
                  <div className="file-success">
                    Subido como {file.uploadedData.filename}
                  </div>
                )}
              </div>

              {/* Remove button */}
              <button 
                className="remove-file-btn"
                onClick={() => removeFile(file.id)}
                disabled={file.status === 'uploading'}
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
