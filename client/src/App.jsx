import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [urls, setUrls] = useState('')
  const [file, setFile] = useState(null)
  const [prefix, setPrefix] = useState('')
  const [suffix, setSuffix] = useState('')
  const [convertToWebp, setConvertToWebp] = useState(false)
  const [optimize, setOptimize] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])

  const handleDownload = async () => {
    if (!urls.trim() && !file) return

    setLoading(true)
    setResults([])

    try {
      let response;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('convertToWebp', convertToWebp);
        formData.append('optimize', optimize);
        formData.append('prefix', prefix);
        formData.append('suffix', suffix);

        response = await axios.post('http://localhost:5000/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        const urlList = urls.split('\n').map(u => u.trim()).filter(u => u)
        response = await axios.post('http://localhost:5000/api/download', {
          urls: urlList,
          convertToWebp,
          optimize,
          prefix,
          suffix
        })
      }

      setResults(response.data.results)
    } catch (error) {
      console.error(error)
      setResults([{ status: 'error', error: 'Failed to connect to server', url: 'System' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1>Image Downloader</h1>
      <div className="card">
        <div className="input-section">
          <h3>Option 1: Paste URLs</h3>
          <textarea
            placeholder="Enter image URLs (one per line)"
            value={urls}
            onChange={(e) => {
              setUrls(e.target.value);
              setFile(null); // Clear file if typing URLs
            }}
            disabled={!!file}
          />
        </div>

        <div className="input-section">
          <h3>Option 2: Upload CSV/Excel</h3>
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={(e) => {
              setFile(e.target.files[0]);
              setUrls(''); // Clear URLs if file selected
            }}
            disabled={!!urls}
          />
          {file && <p className="file-name">Selected: {file.name}</p>}
        </div>

        <div className="input-group">
          <input
            type="text"
            placeholder="Filename Prefix"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className="text-input"
          />
          <input
            type="text"
            placeholder="Filename Suffix"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
            className="text-input"
          />
        </div>

        <div className="options">
          <label className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={convertToWebp}
              onChange={(e) => setConvertToWebp(e.target.checked)}
            />
            Convert to WebP
          </label>

          <label className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={optimize}
              onChange={(e) => setOptimize(e.target.checked)}
            />
            Optimize Image
          </label>
        </div>

        <button onClick={handleDownload} disabled={loading || (!urls.trim() && !file)}>
          {loading ? 'Processing...' : 'Download Images'}
        </button>

        {results.length > 0 && (
          <div className="status">
            {results.map((res, index) => (
              <div key={index} className={`status-item ${res.status}`}>
                {res.status === 'success'
                  ? `✓ Saved: ${res.file}`
                  : `✗ Error (${res.url}): ${res.error}`}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default App
