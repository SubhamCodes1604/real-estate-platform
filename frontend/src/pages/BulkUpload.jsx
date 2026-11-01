import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./BulkUpload.css";

function BulkUpload() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];

    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".zip")) {
      setError("Please select a .zip file.");
      return;
    }

    if (selected.size > 50 * 1024 * 1024) {
      setError("File exceeds 50 MB limit.");
      return;
    }

    setFile(selected);
    setError("");
    setPreview(null);
    setImportResult(null);
  };

  const handlePreview = async () => {
    if (!file) {
      setError("Please select a ZIP file first.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(
        "/bulk-upload/preview/",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setPreview(response.data);
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to preview ZIP file."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(
        "/bulk-upload/import/",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setImportResult(response.data);
      setStep(3);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Import failed."
      );
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFile(null);
    setPreview(null);
    setImportResult(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get(
        "/bulk-upload/template/",
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = "bulk_properties_template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Unable to download template.");
    }
  };

  return (
    <div className="bulk-upload-page">
      <div className="bulk-upload-header">
        <h1>Bulk Property Upload</h1>
        <p>
          Upload multiple properties at once using a ZIP file
          containing an Excel spreadsheet and property images.
        </p>
      </div>

      <div className="bulk-upload-steps">
        <div className={`bulk-upload-step ${step >= 1 ? "active" : ""}`}>
          <span className="bulk-upload-step-num">1</span>
          <span>Select ZIP</span>
        </div>
        <div className="bulk-upload-step-divider"></div>
        <div className={`bulk-upload-step ${step >= 2 ? "active" : ""}`}>
          <span className="bulk-upload-step-num">2</span>
          <span>Preview &amp; Validate</span>
        </div>
        <div className="bulk-upload-step-divider"></div>
        <div className={`bulk-upload-step ${step >= 3 ? "active" : ""}`}>
          <span className="bulk-upload-step-num">3</span>
          <span>Import Results</span>
        </div>
      </div>

      {error && (
        <div className="bulk-upload-error">
          <p>{error}</p>
        </div>
      )}

      {step === 1 && (
        <div className="bulk-upload-section">
          <div className="bulk-upload-instructions">
            <h3>How It Works</h3>
            <ol>
              <li>
                Download the Excel template and fill in your
                property details.
              </li>
              <li>
                Organize your property images into folders named
                by Property ID (e.g., <code>images/PROP001/</code>).
              </li>
              <li>
                Zip the Excel file and images folder together.
              </li>
              <li>
                Upload the ZIP file below for preview and import.
              </li>
            </ol>

            <button
              type="button"
              className="bulk-upload-template-button"
              onClick={handleDownloadTemplate}
            >
              Download Excel Template
            </button>
          </div>

          <div className="bulk-upload-dropzone">
            <label htmlFor="bulk-upload-file" className="bulk-upload-file-label">
              <input
                id="bulk-upload-file"
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="bulk-upload-file-input"
              />
              <div className="bulk-upload-dropzone-content">
                <p>
                  {file
                    ? file.name
                    : "Click to select a ZIP file"}
                </p>
                {file && (
                  <span className="bulk-upload-file-size">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                )}
              </div>
            </label>
          </div>

          {file && (
            <button
              type="button"
              className="bulk-upload-preview-button"
              disabled={uploading}
              onClick={handlePreview}
            >
              {uploading ? "Validating..." : "Preview & Validate"}
            </button>
          )}
        </div>
      )}

      {step === 2 && preview && (
        <div className="bulk-upload-section">
          <div className="bulk-upload-preview-summary">
            <div className="bulk-upload-stat">
              <span className="bulk-upload-stat-label">Total Rows</span>
              <strong>{preview.total_rows}</strong>
            </div>
            <div className="bulk-upload-stat valid">
              <span className="bulk-upload-stat-label">Valid</span>
              <strong>{preview.valid_count}</strong>
            </div>
            <div className="bulk-upload-stat invalid">
              <span className="bulk-upload-stat-label">Invalid</span>
              <strong>{preview.invalid_count}</strong>
            </div>
            <div className="bulk-upload-stat">
              <span className="bulk-upload-stat-label">Images</span>
              <strong>{preview.image_count}</strong>
            </div>
          </div>

          {preview.missing_images.length > 0 && (
            <div className="bulk-upload-warning">
              <h4>Properties Without Images</h4>
              <ul>
                {preview.missing_images.map((m) => (
                  <li key={m.property_id}>
                    {m.property_id}: {m.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.valid_rows.length > 0 && (
            <div className="bulk-upload-preview-section">
              <h4>Valid Properties ({preview.valid_count})</h4>
              <div className="bulk-upload-table-wrap">
                <table className="bulk-upload-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>City</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.valid_rows.map((row) => (
                      <tr key={row.property_id}>
                        <td>{row.property_id}</td>
                        <td>{row.title}</td>
                        <td>{row.property_type}</td>
                        <td>{row.price_raw}</td>
                        <td>{row.city}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {preview.invalid_rows.length > 0 && (
            <div className="bulk-upload-preview-section">
              <h4>Invalid Properties ({preview.invalid_count})</h4>
              <div className="bulk-upload-table-wrap">
                <table className="bulk-upload-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Property ID</th>
                      <th>Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.invalid_rows.map((row) => (
                      <tr key={row.row_num}>
                        <td>{row.row_num}</td>
                        <td>{row.property_id || "—"}</td>
                        <td>
                          <ul className="bulk-upload-error-list">
                            {row.errors.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bulk-upload-actions">
            <button
              type="button"
              className="bulk-upload-back-button"
              onClick={handleReset}
            >
              Back
            </button>
            <button
              type="button"
              className="bulk-upload-import-button"
              disabled={importing || preview.valid_count === 0}
              onClick={handleImport}
            >
              {importing
                ? "Importing..."
                : `Import ${preview.valid_count} Properties`}
            </button>
          </div>
        </div>
      )}

      {step === 3 && importResult && (
        <div className="bulk-upload-section">
          <div className="bulk-upload-result-summary">
            <h3>Import Complete</h3>
            <div className="bulk-upload-stat-row">
              <div className="bulk-upload-stat">
                <span className="bulk-upload-stat-label">Total</span>
                <strong>{importResult.total}</strong>
              </div>
              <div className="bulk-upload-stat valid">
                <span className="bulk-upload-stat-label">Imported</span>
                <strong>{importResult.imported}</strong>
              </div>
              <div className="bulk-upload-stat invalid">
                <span className="bulk-upload-stat-label">Failed</span>
                <strong>{importResult.failed}</strong>
              </div>
            </div>
          </div>

          {importResult.upload?.errors?.length > 0 && (
            <div className="bulk-upload-preview-section">
              <h4>Errors ({importResult.failed})</h4>
              <div className="bulk-upload-table-wrap">
                <table className="bulk-upload-table">
                  <thead>
                    <tr>
                      <th>Property ID</th>
                      <th>Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.upload.errors.map((err, i) => (
                      <tr key={i}>
                        <td>{err.property_id || "—"}</td>
                        <td>
                          <ul className="bulk-upload-error-list">
                            {err.errors ? (
                              err.errors.map((e, j) => (
                                <li key={j}>{e}</li>
                              ))
                            ) : (
                              <li>{err.error}</li>
                            )}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bulk-upload-actions">
            <Link to="/my-properties" className="bulk-upload-link-button">
              View My Properties
            </Link>
            <button
              type="button"
              className="bulk-upload-import-button"
              onClick={handleReset}
            >
              Upload Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkUpload;
