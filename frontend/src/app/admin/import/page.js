'use client';
import { useState, useRef, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.name.endsWith('.xlsx') || dropped.name.endsWith('.xls'))) {
      setFile(dropped);
      setResult(null);
      setError('');
    } else {
      setError('Please drop a valid Excel file (.xlsx or .xls)');
    }
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError('');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/api/v1/import/products/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/api/v1/import/products/template/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to download template');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product_import_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a4731 0%, #2d6a4f 100%)',
        padding: '32px 40px',
        color: 'white',
      }}>
        <a href="/admin/products" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          ← Back to Products
        </a>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>📊 Import Products from Excel</h1>
        <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: 15 }}>
          Bulk import or update products using an Excel spreadsheet
        </p>
      </div>

      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        
        {/* Step 1: Download Template */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 28,
          marginBottom: 24,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1px solid #d1fae5',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#2d6a4f', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 16, flexShrink: 0
            }}>1</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a4731' }}>Download Template</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Get the Excel template with correct column format</p>
            </div>
          </div>

          <div style={{
            background: '#f0fdf4',
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
            fontSize: 13,
            color: '#374151',
          }}>
            <strong style={{ display: 'block', marginBottom: 8, color: '#1a4731' }}>📋 Required columns:</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
              {[
                ['name', '✅ Required'],
                ['price', '✅ Required'],
                ['description', '⬜ Optional'],
                ['mrp', '⬜ Optional'],
                ['stock', '⬜ Optional (default: 0)'],
                ['tax_percentage', '⬜ Optional (default: 0)'],
                ['category', '⬜ Optional (auto-created)'],
                ['unit', '⬜ Optional (auto-created)'],
              ].map(([col, note]) => (
                <div key={col} style={{ display: 'flex', gap: 6 }}>
                  <code style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}>{col}</code>
                  <span style={{ color: '#6b7280', fontSize: 12 }}>{note}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleDownloadTemplate}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#2d6a4f', color: 'white',
              border: 'none', borderRadius: 10,
              padding: '12px 20px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#1a4731'}
            onMouseOut={e => e.currentTarget.style.background = '#2d6a4f'}
          >
            ⬇️ Download Excel Template
          </button>
        </div>

        {/* Step 2: Upload File */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 28,
          marginBottom: 24,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1px solid #d1fae5',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#2d6a4f', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 16, flexShrink: 0
            }}>2</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a4731' }}>Upload Your File</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Drag & drop or click to select your Excel file</p>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#2d6a4f' : file ? '#86efac' : '#d1d5db'}`,
              borderRadius: 12,
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? '#f0fdf4' : file ? '#f0fdf4' : '#fafafa',
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {file ? (
              <div>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📗</div>
                <p style={{ margin: 0, fontWeight: 600, color: '#1a4731', fontSize: 16 }}>{file.name}</p>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
                  {(file.size / 1024).toFixed(1)} KB · Click to change
                </p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📤</div>
                <p style={{ margin: 0, fontWeight: 600, color: '#374151', fontSize: 16 }}>
                  {dragging ? 'Drop it here!' : 'Drop Excel file here'}
                </p>
                <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 13 }}>or click to browse · .xlsx, .xls supported</p>
              </div>
            )}
          </div>

          {file && (
            <button
              onClick={handleImport}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', marginTop: 16,
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #2d6a4f, #40916c)',
                color: 'white', border: 'none', borderRadius: 10,
                padding: '14px 20px', fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(45,106,79,0.3)',
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                  Importing...
                </>
              ) : '🚀 Start Import'}
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 12, padding: '16px 20px', marginBottom: 24,
            color: '#dc2626', fontSize: 14, display: 'flex', gap: 10,
          }}>
            ❌ {error}
          </div>
        )}

        {/* Step 3: Results */}
        {result && (
          <div style={{
            background: 'white', borderRadius: 16, padding: 28,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: '1px solid #d1fae5',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#2d6a4f', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16, flexShrink: 0
              }}>3</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a4731' }}>Import Results</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{result.message}</p>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Created', value: result.created, color: '#22c55e', bg: '#f0fdf4', icon: '✅' },
                { label: 'Updated', value: result.updated, color: '#3b82f6', bg: '#eff6ff', icon: '🔄' },
                { label: 'Skipped', value: result.skipped, color: '#f59e0b', bg: '#fffbeb', icon: '⚠️' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: stat.bg, borderRadius: 10,
                  padding: '16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{stat.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <div>
                <h3 style={{ color: '#dc2626', fontSize: 15, marginBottom: 10 }}>
                  ⚠️ Row Errors ({result.errors.length})
                </h3>
                <div style={{ maxHeight: 200, overflowY: 'auto', background: '#fef2f2', borderRadius: 8, padding: 12 }}>
                  {result.errors.map((err, i) => (
                    <div key={i} style={{ fontSize: 13, color: '#7f1d1d', marginBottom: 4, padding: '4px 0', borderBottom: '1px solid #fecaca' }}>
                      <strong>Row {err.row}:</strong> {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <a
                href="/admin/products"
                style={{
                  flex: 1, textAlign: 'center',
                  background: '#2d6a4f', color: 'white',
                  borderRadius: 10, padding: '12px', fontSize: 14,
                  fontWeight: 600, textDecoration: 'none',
                  display: 'block',
                }}
              >
                View Products →
              </a>
              <button
                onClick={() => { setFile(null); setResult(null); }}
                style={{
                  flex: 1, background: '#f3f4f6', color: '#374151',
                  border: 'none', borderRadius: 10, padding: '12px', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Import Another File
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
