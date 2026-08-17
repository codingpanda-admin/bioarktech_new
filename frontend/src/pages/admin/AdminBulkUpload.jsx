import { useRef, useState } from 'react';
import { apiFetch } from '../../utils/api';

const uploadTypes = [
  {
    type: 'product',
    title: 'Products',
    template: '/templates/bioark-product-bulk-upload-template.xlsx',
    note: 'Only the first price option in each row is imported.',
  },
  {
    type: 'reagent',
    title: 'Reagents',
    template: '/templates/bioark-reagent-bulk-upload-template.xlsx',
    note: 'Only the first price option in each row is imported.',
  },
  {
    type: 'service',
    title: 'Services',
    template: '/templates/bioark-service-bulk-upload-template.xlsx',
    note: 'Service text is imported as plain text.',
  },
];

const emptyState = () => ({ file: null, uploading: false, error: '', result: null });

function AdminBulkUpload() {
  const [states, setStates] = useState(() => Object.fromEntries(
    uploadTypes.map(({ type }) => [type, emptyState()])
  ));
  const inputRefs = useRef({});

  const updateState = (type, changes) => {
    setStates((current) => ({
      ...current,
      [type]: { ...current[type], ...changes },
    }));
  };

  const selectFile = (type, file) => {
    updateState(type, { file: file || null, error: '', result: null });
  };

  const upload = async (type) => {
    const file = states[type].file;
    if (!file) {
      updateState(type, { error: 'Select the completed Excel template first.' });
      return;
    }

    updateState(type, { uploading: true, error: '', result: null });
    const body = new FormData();
    body.append('file', file);
    try {
      const result = await apiFetch(`/api/admin-panel/bulk-upload/${type}/`, {
        method: 'POST',
        body,
      });
      updateState(type, { uploading: false, result, file: null });
      if (inputRefs.current[type]) inputRefs.current[type].value = '';
    } catch (error) {
      updateState(type, {
        uploading: false,
        error: error.message || 'The workbook could not be uploaded.',
      });
    }
  };

  return (
    <div className="admin-bulk-upload">
      <div className="admin-section-header admin-bulk-upload-header">
        <div>
          <h2 id="admin-content-title">Bulk Upload Catalog</h2>
          <p>Use the matching Excel template and keep one catalog item on each row.</p>
        </div>
      </div>

      <div className="admin-bulk-guidance" role="note">
        <strong>Import rules</strong>
        <span>Rich-text formatting is ignored. Images, videos, and documents are never imported or removed.</span>
        <span>An existing External ID is updated; a new External ID creates a new item.</span>
      </div>

      <div className="admin-bulk-grid">
        {uploadTypes.map(({ type, title, template, note }) => {
          const state = states[type];
          return (
            <section className="admin-bulk-card" key={type} aria-labelledby={`${type}-bulk-title`}>
              <div className={`admin-bulk-icon is-${type}`} aria-hidden="true">
                {title.charAt(0)}
              </div>
              <div className="admin-bulk-card-heading">
                <h3 id={`${type}-bulk-title`}>{title}</h3>
                <p>{note}</p>
              </div>

              <a className="admin-template-download" href={template} download>
                <span aria-hidden="true">↓</span> Download {title} template
              </a>

              <label className="admin-bulk-file">
                <span>Completed .xlsx file</span>
                <input
                  ref={(element) => { inputRefs.current[type] = element; }}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(event) => selectFile(type, event.target.files?.[0])}
                  disabled={state.uploading}
                />
              </label>
              <div className="admin-bulk-file-name">
                {state.file ? state.file.name : 'No file selected'}
              </div>
              <button
                type="button"
                className="primary-button admin-bulk-submit"
                onClick={() => upload(type)}
                disabled={state.uploading || !state.file}
              >
                {state.uploading ? `Uploading ${title}...` : `Upload ${title}`}
              </button>

              {state.error && <div className="admin-bulk-error" role="alert">{state.error}</div>}
              {state.result && (
                <div className="admin-bulk-result" aria-live="polite">
                  <div className="admin-bulk-result-counts">
                    <span><strong>{state.result.created}</strong> created</span>
                    <span><strong>{state.result.updated}</strong> updated</span>
                    <span className={state.result.failed ? 'has-errors' : ''}>
                      <strong>{state.result.failed}</strong> failed
                    </span>
                  </div>
                  {state.result.errors?.length > 0 && (
                    <div className="admin-bulk-row-errors">
                      <h4>Rows requiring attention</h4>
                      <ul>
                        {state.result.errors.map((rowError) => (
                          <li key={`${rowError.row}-${rowError.external_id}`}>
                            <strong>Row {rowError.row}</strong>
                            {rowError.external_id && ` (${rowError.external_id})`}: {rowError.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default AdminBulkUpload;
