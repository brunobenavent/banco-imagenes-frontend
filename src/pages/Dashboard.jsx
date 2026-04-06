// src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Search, Download, Image as ImageIcon, ChevronLeft, ChevronRight, Trash2, Eye, X, Filter, Flower, ArrowUpDown, Grid, List, Edit2, RefreshCw, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ familia: '', maceta: '', altura: '' });
  const [filterOptions, setFilterOptions] = useState({ familias: [], macetas: [], alturas: [] });
  const [page, setPage] = useState(1);
  const [limit] = useState(48);
  const [sortBy, setSortBy] = useState('newest');
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deletingImage, setDeletingImage] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  // State for editing article code
  const [editingCode, setEditingCode] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [refreshingDantia, setRefreshingDantia] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isMountedRef = useRef(true);
  const { user, isEditor } = useAuth();
  const { addToast } = useToast();

  const scrollPositionRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    fetchFilters();
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchImages = async () => {
    if (!isMountedRef.current) return;
    setLoading(true);
    try {
      const response = await axios.get('/api/images', {
        params: { page, limit, search, familia: filters.familia, maceta: filters.maceta, altura: filters.altura, sortBy }
      });
      if (!isMountedRef.current) return;
      const data = response.data;
      setImages(Array.isArray(data.images) ? data.images : []);
      setTotal(data.pagination?.total || 0);
      setPages(data.pagination?.pages || 0);
    } catch (error) {
      console.error('Error fetching images:', error);
      if (isMountedRef.current) setImages([]);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const response = await axios.get('/api/images/filters');
      if (isMountedRef.current) setFilterOptions(response.data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  // Fetch cuando cambia página, límite o filtros o sort
  useEffect(() => {
    fetchImages();
  }, [page, limit, filters.familia, filters.maceta, filters.altura, search, sortBy]);

  // Cuando cambia búsqueda o filtro, ir a página 1
  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ familia: '', maceta: '', altura: '' });
    setSearch('');
    setPage(1);
  };

  // Navegación de páginas
  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= pages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const downloadImage = async (imageId, size) => {
    const response = await axios.get(`/api/images/${imageId}/download/${size}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `image-${imageId}-${size}.jpg`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const openLightbox = (image) => {
    scrollPositionRef.current = window.scrollY;
    setImageLoading(true);
    setSelectedImage(image);
  };

  const handleDeleteClick = (image) => {
    scrollPositionRef.current = window.scrollY;
    setDeleteModal(image);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    
    const imageIdToDelete = deleteModal._id;
    
    // Show spinner first
    setDeletingImage(imageIdToDelete);
    setDeleteModal(null);
    setSelectedImage(null);
    
    try {
      // Wait a moment to show spinner
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then delete from backend
      await axios.delete(`/api/images/${imageIdToDelete}`);
      addToast('Imagen eliminada correctamente', 'success');
      
      // Remove from local state
      setImages(prev => prev.filter(img => img._id !== imageIdToDelete));
      setTotal(prev => Math.max(0, prev - 1));
      
      setDeletingImage(null);
    } catch (error) {
      setDeletingImage(null);
      addToast('Error al eliminar la imagen', 'error');
    }
  };

  // Handle edit article code
  const startEditCode = (image) => {
    setEditingCode(image._id);
    setEditingValue(image.articleCode);
  };

  const cancelEditCode = () => {
    setEditingCode(null);
    setEditingValue('');
  };

  const saveEditCode = async (imageId) => {
    const image = images.find(img => img._id === imageId);
    if (!image || editingValue === image.articleCode) {
      cancelEditCode();
      return;
    }

    try {
      // Save the new code
      await axios.put(`/api/images/${imageId}`, {
        articleCode: editingValue
      });
      
      // Automatically refresh Dantia info with new code
      const dantiaResponse = await axios.post(`/api/images/refresh-dantia/${imageId}`);
      
      addToast('Código e info de Dantia actualizados', 'success');
      
      // Update local state directly without re-fetching
      setImages(prev => prev.map(img => {
        if (img._id === imageId) {
          return {
            ...img,
            articleCode: editingValue,
            suffix: img.suffix, // Keep same suffix or could get from response
            dantiaInfo: dantiaResponse.data.image.dantiaInfo
          };
        }
        return img;
      }));
      
      cancelEditCode();
    } catch (error) {
      addToast(error.response?.data?.message || 'Error al actualizar el código', 'error');
    }
  };

  // Handle refresh Dantia info
  const refreshDantiaInfo = async (imageId) => {
    setRefreshingDantia(imageId);
    try {
      const response = await axios.post(`/api/images/refresh-dantia/${imageId}`);
      addToast('Info de Dantia actualizada', 'success');
      
      // Update local state directly without re-fetching
      setImages(prev => prev.map(img => {
        if (img._id === imageId) {
          return {
            ...img,
            dantiaInfo: response.data.image.dantiaInfo
          };
        }
        return img;
      }));
    } catch (error) {
      addToast(error.response?.data?.message || 'Error al actualizar info de Dantia', 'error');
    } finally {
      setRefreshingDantia(null);
    }
  };

  // Generar páginas visibles
  const getVisiblePages = () => {
    const visible = [];
    const maxVisible = 7;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(pages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) visible.push(i);
    return visible;
  };

  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Catálogo de Imágenes</h1>
          <p className="dashboard-subtitle">Explora y descarga las imágenes de los artículos</p>
        </div>
        <div className="header-actions">
          <div className="view-mode-toggle">
            <button 
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista de cuadrícula"
            >
              <Grid size={18} />
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista de lista"
            >
              <List size={18} />
            </button>
          </div>
          <div className="search-form">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar por código o nombre..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
              {search && (
                <button type="button" className="search-clear-btn" onClick={() => { setSearch(''); setPage(1); }}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <button className="filters-toggle" onClick={() => setFiltersOpen(!filtersOpen)}>
        <Filter size={16} />
        <span>Filtros</span>
        {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      <div className={`filters-bar ${filtersOpen ? 'open' : ''}`}>
        <div className="filter-group">
          <Filter size={16} className="filter-icon" />
          <select value={filters.familia} onChange={(e) => handleFilterChange('familia', e.target.value)} className="filter-select">
            <option value="">Todas las familias</option>
            {filterOptions.familias.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={filters.maceta} onChange={(e) => handleFilterChange('maceta', e.target.value)} className="filter-select">
            <option value="">Todas las macetas</option>
            {filterOptions.macetas.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filters.altura} onChange={(e) => handleFilterChange('altura', e.target.value)} className="filter-select">
            <option value="">Todas las alturas</option>
            {filterOptions.alturas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className="filter-select sort-select">
            <option value="newest">Más recientes</option>
            <option value="code">Por código</option>
            <option value="name">Por nombre</option>
          </select>
          <button onClick={clearFilters} className="btn btn-sm btn-ghost clear-filters-btn">
            <RotateCcw size={14} />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="image-grid">
          {[...Array(Math.min(limit, 20))].map((_, i) => (
            <div key={i} className="image-card skeleton">
              <div className="image-preview skeleton-preview" />
              <div className="image-info">
                <div className="skeleton-line" style={{ width: '60%', height: '14px' }} />
                <div className="skeleton-line" style={{ width: '40%', height: '12px', marginTop: '8px' }} />
                <div className="skeleton-line" style={{ width: '100%', height: '32px', marginTop: '12px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="dashboard-empty">
          <ImageIcon size={48} />
          <h3>No se encontraron resultados</h3>
          <p>Intenta con otros términos de búsqueda</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="image-list">
          {images.map((image) => (
            <div key={image._id} className={`list-item ${deletingImage === image._id ? 'deleting' : ''}`} onClick={() => openLightbox(image)}>
              <div className="list-thumb">
                {deletingImage === image._id ? (
                  <div className="list-deleting-spinner">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <img src={image.sizes.small} alt={image.articleCode} />
                )}
              </div>
              <div className="list-details" onClick={(e) => e.stopPropagation()}>
                <div className="list-filename">
                  {editingCode === image._id ? (
                    <div className="code-edit-container" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEditCode(image._id)}
                        className="code-edit-input"
                        autoFocus
                      />
                      <button
                        className="code-edit-save"
                        onClick={(e) => { e.stopPropagation(); saveEditCode(image._id); }}
                        title="Guardar"
                      >
                        <RefreshCw size={12} />
                      </button>
                      <button
                        className="code-edit-cancel"
                        onClick={(e) => { e.stopPropagation(); cancelEditCode(); }}
                        title="Cancelar"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <strong onClick={(e) => e.stopPropagation()}>{image.articleCode}</strong>-{String(image.suffix).padStart(3, '0')}.jpg
                      {isEditor && (
                        <button
                          className="code-edit-btn"
                          onClick={(e) => { e.stopPropagation(); startEditCode(image); }}
                          title="Editar código"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                      {isEditor && (
                        <button
                          className="code-refresh-btn"
                          onClick={(e) => { e.stopPropagation(); refreshDantiaInfo(image._id); }}
                          disabled={refreshingDantia === image._id}
                          title="Actualizar info de Dantia"
                        >
                          <RefreshCw size={12} className={refreshingDantia === image._id ? 'spinning' : ''} />
                        </button>
                      )}
                    </>
                  )}
                </div>
                {image.dantiaInfo && (
                  <div className="list-info">{image.dantiaInfo.DescripcionArticulo}</div>
                )}
              </div>
              <div className="list-meta">
                {image.dantiaInfo && (
                  <>
                    <span className="meta-item"><Flower size={12} />{image.dantiaInfo._Maceta || '-'}</span>
                    <span className="meta-item"><ArrowUpDown size={12} />{image.dantiaInfo._Altura || '-'}</span>
                  </>
                )}
              </div>
              <div className="list-actions">
                <button className="download-btn size-s" onClick={(e) => { e.stopPropagation(); downloadImage(image._id, 'small'); }} title="Pequeño"><Download size={14} /><span>S</span></button>
                <button className="download-btn size-m" onClick={(e) => { e.stopPropagation(); downloadImage(image._id, 'medium'); }} title="Mediano"><Download size={14} /><span>M</span></button>
                <button className="download-btn size-l" onClick={(e) => { e.stopPropagation(); downloadImage(image._id, 'real'); }} title="Real"><Download size={14} /><span>L</span></button>
                {isEditor && (
                  <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteClick(image); }} title="Eliminar"><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="image-grid">
          {images.map((image, index) => (
            <div key={image._id} className={`image-card ${deletingImage === image._id ? 'deleting' : ''}`}>
              <div className="image-preview" onClick={() => openLightbox(image)}>
                {deletingImage === image._id ? (
                  <div className="image-deleting-spinner">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <>
                    <img src={image.sizes.medium} alt={image.articleCode} />
                    <div className="image-overlay">
                      <span className="image-code">{image.articleCode}</span>
                      <span className="image-suffix">-{String(image.suffix).padStart(3, '0')}</span>
                    </div>
                    {isEditor && (
                      <button className="delete-corner-btn" onClick={(e) => { e.stopPropagation(); handleDeleteClick(image); }} title="Eliminar imagen">
                        <Trash2 size={14} />
                      </button>
                    )}
                    <div className="image-zoom-hint"><Eye size={16} /></div>
                  </>
                )}
              </div>
              <div className="image-info">
                <div className="image-filename">
                  {editingCode === image._id ? (
                    <div className="code-edit-container">
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEditCode(image._id)}
                        className="code-edit-input"
                        autoFocus
                      />
                      <button
                        className="code-edit-save"
                        onClick={() => saveEditCode(image._id)}
                        title="Guardar"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        className="code-edit-cancel"
                        onClick={cancelEditCode}
                        title="Cancelar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <strong>{image.articleCode}</strong>-{String(image.suffix).padStart(3, '0')}.jpg
                      {isEditor && (
                        <button
                          className="code-edit-btn"
                          onClick={(e) => { e.stopPropagation(); startEditCode(image); }}
                          title="Editar código"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                      {isEditor && (
                        <button
                          className="code-refresh-btn"
                          onClick={(e) => { e.stopPropagation(); refreshDantiaInfo(image._id); }}
                          disabled={refreshingDantia === image._id}
                          title="Actualizar info de Dantia"
                        >
                          <RefreshCw size={12} className={refreshingDantia === image._id ? 'spinning' : ''} />
                        </button>
                      )}
                    </>
                  )}
                </div>
                {image.dantiaInfo && (
                  <div className="article-info">
                    <span className="article-name">{image.dantiaInfo.DescripcionArticulo}</span>
                    <span className="article-family">{image.dantiaInfo.Descripcion}</span>
                  </div>
                )}
                {image.dantiaInfo && (
                  <>
                    <div className="image-meta">
                      <span className="meta-item"><Flower size={12} className="meta-icon" />{image.dantiaInfo._Maceta || '-'}</span>
                      <span className="meta-item"><ArrowUpDown size={12} className="meta-icon" />{image.dantiaInfo._Altura || '-'}</span>
                    </div>
                    <div className="image-downloads">
                      <button className="download-btn" onClick={() => downloadImage(image._id, 'small')} title="Descargar pequeño"><Download size={14} /><span>Pequeño</span></button>
                      <button className="download-btn" onClick={() => downloadImage(image._id, 'medium')} title="Descargar mediano"><Download size={16} /><span>Mediano</span></button>
                      <button className="download-btn" onClick={() => downloadImage(image._id, 'real')} title="Descargar real"><Download size={18} /><span>Real</span></button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {!loading && pages > 1 && (
        <div className="pagination-bar">
          <span className="pagination-info">{startItem}-{endItem} de {total}</span>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={() => goToPage(page - 1)} disabled={page === 1}><ChevronLeft size={18} /></button>
            {getVisiblePages().map(p => (
              <button key={p} className="pagination-btn" onClick={() => goToPage(p)}>{p}</button>
            ))}
            <button className="pagination-btn" onClick={() => goToPage(page + 1)} disabled={page === pages}><ChevronRight size={18} /></button>
          </div>
        </div>
      )}

      {/* Modal lightbox */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedImage(null)}><X size={24} /></button>
            {imageLoading && <div className="modal-spinner"><ImageIcon size={48} /></div>}
            <img 
              src={selectedImage.sizes?.real || selectedImage.cloudinaryUrl} 
              alt={selectedImage.articleCode}
              className="modal-full-image"
              style={{ display: imageLoading ? 'none' : 'block' }}
              onLoad={() => setImageLoading(false)}
            />
            <div className="modal-info">
              <h3>{selectedImage.articleCode}-{String(selectedImage.suffix).padStart(3, '0')}</h3>
              {selectedImage.dantiaInfo && (
                <p>{selectedImage.dantiaInfo.DescripcionArticulo}</p>
              )}
              <div className="modal-downloads">
                <button onClick={() => downloadImage(selectedImage._id, 'small')}>Pequeño</button>
                <button onClick={() => downloadImage(selectedImage._id, 'medium')}>Mediano</button>
                <button onClick={() => downloadImage(selectedImage._id, 'real')}>Real</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="delete-modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="delete-modal-content" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <Trash2 size={32} />
            </div>
            <h3>¿Eliminar imagen?</h3>
            <p>¿Estás seguro de que quieres eliminar la imagen <strong>{deleteModal.articleCode}-{String(deleteModal.suffix).padStart(3, '0')}</strong>?</p>
            <p className="delete-modal-warning">Esta acción no se puede deshacer.</p>
            <div className="delete-modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteModal(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
