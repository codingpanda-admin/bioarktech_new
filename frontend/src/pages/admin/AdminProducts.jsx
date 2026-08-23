import React, { useEffect, useState, useCallback, useRef, useImperativeHandle } from 'react';
import { apiFetch, API_URL, formatAssetUrl } from '../../utils/api';
import { formatRichText } from '../../utils/richText';
import { cleanRichTextPasteHtml, isMicrosoftOfficeHtml } from '../../utils/richTextPaste';

const richTextToPlainText = (value) => {
  const source = String(value || '');
  if (!/<[^>]+>/.test(source)) return source;

  const withLineBreaks = source
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|h[1-6]|blockquote)>/gi, '\n');
  const decoder = document.createElement('div');
  decoder.innerHTML = withLineBreaks;
  return (decoder.textContent || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const reagentKeyFeaturesToPlainText = (value) => (
  (Array.isArray(value) ? value : [value])
    .map(richTextToPlainText)
    .filter(Boolean)
    .join('\n')
);

const parseNumericCatalogPrice = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const normalized = text.replace(/^\$\s*/, '').replace(/,/g, '');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return Number.NaN;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.NaN;
};

const validateDiscountedPrice = (discountValue, listValue, label) => {
  const discountText = String(discountValue ?? '').trim();
  if (!discountText) return;

  const discount = parseNumericCatalogPrice(discountText);
  const listPrice = parseNumericCatalogPrice(listValue);
  if (Number.isNaN(discount)) {
    throw new Error(`${label} must be a non-negative numeric price.`);
  }
  if (listPrice === null || Number.isNaN(listPrice)) {
    throw new Error(`${label} requires a numeric List Price.`);
  }
  if (discount > listPrice) {
    throw new Error(`${label} cannot exceed its List Price.`);
  }
};

const FilledHomeIcon = () => (
  <svg className="admin-home-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M3 10.5 12 3l9 7.5v9A1.5 1.5 0 0 1 19.5 21H15v-6h-6v6H4.5A1.5 1.5 0 0 1 3 19.5v-9Z" />
  </svg>
);

export const DeactivateIcon = () => (
  <span className="admin-deactivate-icon" aria-hidden="true">{'\u23FB'}</span>
);

export const CatalogNumberDisplayToggle = ({ checked, onChange }) => (
  <label className="admin-form-field admin-switch-field">
    <span>Catalog Number Display</span>
    <span className="admin-slide-switch">
      <input
        type="checkbox"
        role="switch"
        aria-label="Display catalog number"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="admin-slide-switch-track" aria-hidden="true" />
      <span className="admin-slide-switch-state" aria-hidden="true">{checked ? 'Show' : 'Hide'}</span>
    </span>
  </label>
);

const PublicDetailLink = ({ identifier }) => {
  if (!identifier) return <span>—</span>;
  const publicPath = `/product/${encodeURIComponent(identifier)}`;

  return (
    <a
      className="admin-public-detail-link"
      href={publicPath}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open ${publicPath} in a new tab`}
    >
      {publicPath}
    </a>
  );
};

export const ProductContentEditor = React.forwardRef(function ProductContentEditor({
  value,
  onChange,
  ariaLabel = 'Product content text',
  imageUploadEndpoint = '/api/admin-panel/products/upload-image/',
}, ref) {
  const editorRef = useRef(null);
  const lastEmittedHtmlRef = useRef(null);
  const selectedImageRef = useRef(null);
  const savedSelectionRangeRef = useRef(null);
  const [isImageDragActive, setIsImageDragActive] = useState(false);
  const [imageUploadsInProgress, setImageUploadsInProgress] = useState(0);
  const [imageUploadError, setImageUploadError] = useState('');
  const [selectedImageWidth, setSelectedImageWidth] = useState(null);

  const ensureTableWrappers = () => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.querySelectorAll('table').forEach((table) => {
      if (table.parentElement?.classList.contains('rich-table-wrap')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'rich-table-wrap';
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  };

  useEffect(() => {
    const rawValue = value || '';

    // The editor owns its DOM while the user is typing. Rewriting innerHTML for
    // a value that originated here resets both the caret and native undo stack.
    if (rawValue === lastEmittedHtmlRef.current) {
      return;
    }

    const normalizedValue = isMicrosoftOfficeHtml(rawValue)
      ? cleanRichTextPasteHtml(rawValue)
      : rawValue;
    const editorHtml = /<\/?[a-z][\s\S]*>/i.test(normalizedValue)
      ? normalizedValue
      : formatRichText(normalizedValue);
    if (editorRef.current && editorRef.current.innerHTML !== editorHtml) {
      selectedImageRef.current = null;
      setSelectedImageWidth(null);
      editorRef.current.innerHTML = editorHtml;
    }
    ensureTableWrappers();
    if (rawValue !== editorHtml) {
      lastEmittedHtmlRef.current = editorHtml;
      onChange(editorHtml);
    } else {
      lastEmittedHtmlRef.current = editorHtml;
    }
  }, [value, onChange]);

  const syncValue = () => {
    if (editorRef.current) {
      ensureTableWrappers();
      if (selectedImageRef.current && !editorRef.current.contains(selectedImageRef.current)) {
        selectedImageRef.current = null;
        setSelectedImageWidth(null);
      }

      // Editor-only selection decoration must never be stored in catalog HTML.
      const cleanEditor = editorRef.current.cloneNode(true);
      cleanEditor.querySelectorAll('.is-rich-image-selected').forEach((image) => {
        image.classList.remove('is-rich-image-selected');
        if (!image.className) image.removeAttribute('class');
      });
      const rawHtml = cleanEditor.innerHTML;
      const nextHtml = isMicrosoftOfficeHtml(rawHtml)
        ? cleanRichTextPasteHtml(rawHtml)
        : rawHtml;
      lastEmittedHtmlRef.current = nextHtml;
      onChange(nextHtml);
    }
  };

  useImperativeHandle(ref, () => ({
    getHtml: () => {
      if (!editorRef.current) return '';
      const cleanEditor = editorRef.current.cloneNode(true);
      cleanEditor.querySelectorAll('.is-rich-image-selected').forEach((image) => {
        image.classList.remove('is-rich-image-selected');
        if (!image.className) image.removeAttribute('class');
      });
      const rawHtml = cleanEditor.innerHTML;
      return isMicrosoftOfficeHtml(rawHtml)
        ? cleanRichTextPasteHtml(rawHtml)
        : rawHtml;
    },
    sync: () => syncValue(),
  }));

  const clearSelectedImage = () => {
    selectedImageRef.current?.classList.remove('is-rich-image-selected');
    selectedImageRef.current = null;
    setSelectedImageWidth(null);
  };

  const selectEditorImage = (image) => {
    const editor = editorRef.current;
    if (!editor || !image || !editor.contains(image)) return;

    selectedImageRef.current?.classList.remove('is-rich-image-selected');
    selectedImageRef.current = image;
    image.classList.add('is-rich-image-selected');

    const percentageWidth = /^\s*(\d+(?:\.\d+)?)%\s*$/.exec(image.style.width || '');
    const renderedPercentage = editor.clientWidth > 0
      ? (image.getBoundingClientRect().width / editor.clientWidth) * 100
      : 100;
    const width = percentageWidth ? Number(percentageWidth[1]) : renderedPercentage;
    setSelectedImageWidth(Math.max(10, Math.min(100, Math.round(width / 5) * 5)));
  };

  const resizeSelectedImage = (nextWidth) => {
    const image = selectedImageRef.current;
    const editor = editorRef.current;
    if (!image || !editor?.contains(image)) {
      clearSelectedImage();
      return;
    }

    const width = Math.max(10, Math.min(100, Number(nextWidth) || 100));
    image.style.width = `${width}%`;
    image.style.height = 'auto';
    image.removeAttribute('width');
    image.removeAttribute('height');
    setSelectedImageWidth(width);
    syncValue();
  };

  const deleteSelectedImage = () => {
    const editor = editorRef.current;
    const image = selectedImageRef.current;
    if (!editor || !image || !editor.contains(image)) {
      clearSelectedImage();
      return;
    }

    const parent = image.parentNode;
    const nextSibling = image.nextSibling;
    image.remove();
    selectedImageRef.current = null;
    setSelectedImageWidth(null);

    if (parent && editor.contains(parent)) {
      const nextRange = document.createRange();
      if (nextSibling && parent.contains(nextSibling)) {
        nextRange.setStartBefore(nextSibling);
      } else {
        nextRange.selectNodeContents(parent);
        nextRange.collapse(false);
      }
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(nextRange);
      savedSelectionRangeRef.current = nextRange.cloneRange();
    }

    syncValue();
    focusEditor();
  };

  const handleEditorClick = (event) => {
    const image = event.target?.closest?.('img');
    if (image && editorRef.current?.contains(image)) {
      selectEditorImage(image);
    } else {
      clearSelectedImage();
    }
  };

  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus({ preventScroll: true });
    }
  };

  const getEditorSelectionRange = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement
      : range.commonAncestorContainer;
    return editor.contains(container) ? range.cloneRange() : null;
  };

  const rememberEditorSelection = () => {
    const range = getEditorSelectionRange();
    if (range) savedSelectionRangeRef.current = range;
    return range;
  };

  const restoreEditorSelection = (requestedRange) => {
    const editor = editorRef.current;
    const range = requestedRange || savedSelectionRangeRef.current;
    if (!editor || !range) return false;

    const container = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement
      : range.commonAncestorContainer;
    if (!container || !editor.contains(container)) return false;

    focusEditor();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    return true;
  };

  const preventFocusLoss = (event) => {
    rememberEditorSelection();
    event.preventDefault();
  };

  const applyBoldFallback = (range) => {
    const editor = editorRef.current;
    if (!editor || !range || range.collapsed || !restoreEditorSelection(range)) return false;

    const strong = document.createElement('strong');
    const selectedContent = range.extractContents();
    strong.appendChild(selectedContent);
    range.insertNode(strong);
    editor.normalize();

    const nextRange = document.createRange();
    nextRange.selectNodeContents(strong);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(nextRange);
    savedSelectionRangeRef.current = nextRange.cloneRange();
    return true;
  };

  const runCommand = (command, commandValue = null) => {
    const range = getEditorSelectionRange() || savedSelectionRangeRef.current;
    restoreEditorSelection(range);
    const htmlBeforeCommand = editorRef.current?.innerHTML;
    document.execCommand(command, false, commandValue);

    // execCommand is deprecated and returns without changing the document in
    // some browser builds. Bold still needs to update the selected text now.
    if (
      command === 'bold'
      && range
      && !range.collapsed
      && editorRef.current?.innerHTML === htmlBeforeCommand
    ) {
      applyBoldFallback(range);
    }

    rememberEditorSelection();
    syncValue();
  };

  const handleBoldMouseDown = (event) => {
    rememberEditorSelection();
    event.preventDefault();
    runCommand('bold');
  };

  const handleLink = () => {
    const range = getEditorSelectionRange() || savedSelectionRangeRef.current;
    const url = window.prompt('Enter link URL');
    if (!url) return;
    restoreEditorSelection(range);
    runCommand('createLink', url);
  };

  const getDropRange = (event) => {
    let range = null;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(event.clientX, event.clientY);
    } else if (document.caretPositionFromPoint) {
      const position = document.caretPositionFromPoint(event.clientX, event.clientY);
      if (position) {
        range = document.createRange();
        range.setStart(position.offsetNode, position.offset);
        range.collapse(true);
      }
    }

    const editor = editorRef.current;
    const container = range?.commonAncestorContainer?.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement
      : range?.commonAncestorContainer;
    return editor && container && editor.contains(container) ? range.cloneRange() : null;
  };

  const getEditorEndRange = () => {
    const editor = editorRef.current;
    if (!editor) return null;
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    return range;
  };

  const insertUploadedImage = (imageUrl, fileName, requestedRange) => {
    const editor = editorRef.current;
    if (!editor) return null;

    const range = requestedRange || getEditorSelectionRange() || getEditorEndRange();
    if (!range) return null;

    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = fileName || 'Uploaded image';

    const lineBreak = document.createElement('br');
    range.deleteContents();
    range.insertNode(image);
    image.after(lineBreak);

    const nextRange = document.createRange();
    nextRange.setStartAfter(lineBreak);
    nextRange.collapse(true);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(nextRange);
    editor.focus();
    selectEditorImage(image);
    syncValue();
    return nextRange.cloneRange();
  };

  const uploadAndInsertImages = async (files, requestedRange) => {
    const imageFiles = files.filter((file) => file?.type?.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setImageUploadError('');
    setImageUploadsInProgress((count) => count + imageFiles.length);
    let insertionRange = requestedRange || getEditorSelectionRange() || getEditorEndRange();

    for (const file of imageFiles) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        const response = await apiFetch(imageUploadEndpoint, {
          method: 'POST',
          body: formData,
        });
        const imageUrl = response.url || formatAssetUrl(response.image_path);
        if (!imageUrl) throw new Error('The uploaded image URL was not returned.');
        insertionRange = insertUploadedImage(imageUrl, file.name, insertionRange) || insertionRange;
      } catch (error) {
        setImageUploadError(error.message || `Failed to upload ${file.name}.`);
      } finally {
        setImageUploadsInProgress((count) => Math.max(0, count - 1));
      }
    }
  };

  const handlePaste = (event) => {
    const imageFiles = Array.from(event.clipboardData?.items || [])
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter(Boolean);

    if (imageFiles.length > 0) {
      event.preventDefault();
      void uploadAndInsertImages(imageFiles, getEditorSelectionRange());
      return;
    }

    const plainText = event.clipboardData?.getData('text/plain') || '';
    const htmlText = event.clipboardData?.getData('text/html') || '';

    if (htmlText) {
      const cleanedHtml = cleanRichTextPasteHtml(htmlText);
      if (cleanedHtml) {
        event.preventDefault();
        focusEditor();
        document.execCommand('insertHTML', false, cleanedHtml);
        ensureTableWrappers();
        syncValue();
      }
      return;
    }

    if (!plainText || !plainText.includes('|')) {
      return;
    }

    const formattedHtml = formatRichText(plainText);
    if (!formattedHtml.includes('<table')) {
      return;
    }

    event.preventDefault();
    focusEditor();
    document.execCommand('insertHTML', false, formattedHtml);
    syncValue();
  };

  const handleImageDragOver = (event) => {
    const dragTypes = Array.from(event.dataTransfer?.types || []);
    const hasFiles = dragTypes.includes('Files') || Array.from(event.dataTransfer?.items || [])
      .some((item) => item.kind === 'file');
    if (!hasFiles) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsImageDragActive(true);
  };

  const handleImageDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsImageDragActive(false);
    }
  };

  const handleImageDrop = (event) => {
    const droppedFiles = Array.from(event.dataTransfer?.files || []);
    if (droppedFiles.length === 0) return;

    event.preventDefault();
    const imageFiles = droppedFiles
      .filter((file) => file.type.startsWith('image/'));
    setIsImageDragActive(false);
    if (imageFiles.length === 0) {
      setImageUploadError('Only image files can be dropped into this field.');
      return;
    }

    void uploadAndInsertImages(imageFiles, getDropRange(event));
  };

  const handleBlockChange = (event) => {
    runCommand('formatBlock', event.target.value);
    event.target.value = 'p';
  };

  const getSelectedTableCell = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    let node = selection.anchorNode;
    if (node?.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    return node?.closest?.('td, th') || null;
  };

  const insertTable = () => {
    focusEditor();
    const tableHtml = `
      <div class="rich-table-wrap">
        <table>
          <thead>
            <tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell</td><td>Cell</td><td>Cell</td></tr>
            <tr><td>Cell</td><td>Cell</td><td>Cell</td></tr>
          </tbody>
        </table>
      </div>
      <p><br></p>
    `;
    document.execCommand('insertHTML', false, tableHtml);
    syncValue();
  };

  const addTableRow = () => {
    const cell = getSelectedTableCell();
    const row = cell?.parentElement;
    if (!row) return;

    const newRow = row.cloneNode(true);
    newRow.querySelectorAll('th, td').forEach((item) => {
      item.innerHTML = 'Cell';
    });
    row.after(newRow);
    syncValue();
  };

  const addTableColumn = () => {
    const cell = getSelectedTableCell();
    const table = cell?.closest('table');
    if (!cell || !table) return;

    const columnIndex = cell.cellIndex;
    table.querySelectorAll('tr').forEach((row) => {
      const referenceCell = row.children[columnIndex];
      const newCell = referenceCell.cloneNode(false);
      newCell.innerHTML = referenceCell.tagName.toLowerCase() === 'th' ? 'Header' : 'Cell';
      referenceCell.after(newCell);
    });
    syncValue();
  };

  const deleteTableRow = () => {
    const cell = getSelectedTableCell();
    const row = cell?.parentElement;
    const table = cell?.closest('table');
    if (!row || !table) return;

    if (table.querySelectorAll('tr').length <= 1) {
      table.remove();
    } else {
      row.remove();
    }
    syncValue();
  };

  const deleteTableColumn = () => {
    const cell = getSelectedTableCell();
    const table = cell?.closest('table');
    if (!cell || !table) return;

    const columnIndex = cell.cellIndex;
    table.querySelectorAll('tr').forEach((row) => {
      row.children[columnIndex]?.remove();
    });
    if (!table.querySelector('th, td')) {
      table.remove();
    }
    syncValue();
  };

  const deleteTable = () => {
    const cell = getSelectedTableCell();
    const table = cell?.closest('table');
    if (!table) return;

    const wrapper = table.parentElement?.classList.contains('rich-table-wrap')
      ? table.parentElement
      : null;
    (wrapper || table).remove();
    syncValue();
    focusEditor();
  };

  const mergeCellRight = () => {
    const cell = getSelectedTableCell();
    const nextCell = cell?.nextElementSibling;
    if (!cell || !nextCell || !['TD', 'TH'].includes(nextCell.tagName)) return;

    const currentColSpan = Number(cell.getAttribute('colspan') || 1);
    const nextColSpan = Number(nextCell.getAttribute('colspan') || 1);
    const separator = cell.innerHTML.trim() && nextCell.innerHTML.trim() ? '<br>' : '';
    cell.innerHTML = `${cell.innerHTML}${separator}${nextCell.innerHTML}`;
    cell.setAttribute('colspan', String(currentColSpan + nextColSpan));
    nextCell.remove();
    syncValue();
  };

  const mergeCellDown = () => {
    const cell = getSelectedTableCell();
    const row = cell?.parentElement;
    const nextRow = row?.nextElementSibling;
    if (!cell || !nextRow) return;

    const cellBelow = nextRow.children[cell.cellIndex];
    if (!cellBelow || !['TD', 'TH'].includes(cellBelow.tagName)) return;

    const currentRowSpan = Number(cell.getAttribute('rowspan') || 1);
    const belowRowSpan = Number(cellBelow.getAttribute('rowspan') || 1);
    const separator = cell.innerHTML.trim() && cellBelow.innerHTML.trim() ? '<br>' : '';
    cell.innerHTML = `${cell.innerHTML}${separator}${cellBelow.innerHTML}`;
    cell.setAttribute('rowspan', String(currentRowSpan + belowRowSpan));
    cellBelow.remove();
    syncValue();
  };

  return (
    <div className="admin-rich-text admin-product-rich-text">
      <div className="admin-rich-text-toolbar" aria-label="Product content formatting tools">
        <div className="admin-rich-text-command-group" role="group" aria-label="History commands">
          <button
            type="button"
            className="admin-rich-undo-button"
            aria-label="Undo last change"
            title="Undo (Ctrl+Z)"
            onMouseDown={preventFocusLoss}
            onClick={() => runCommand('undo')}
          >
            <span aria-hidden="true">{'\u21B6'}</span> Undo
          </button>
        </div>
        <span className="admin-rich-text-divider" aria-hidden="true" />
        <div className="admin-rich-text-command-group" role="group" aria-label="Text formatting commands">
          <select aria-label="Text style" defaultValue="p" onMouseDown={rememberEditorSelection} onChange={handleBlockChange}>
            <option value="p">Paragraph</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="blockquote">Quote</option>
          </select>
          <button type="button" aria-label="Bold" onMouseDown={handleBoldMouseDown}><strong>B</strong></button>
          <button type="button" onMouseDown={preventFocusLoss} onClick={() => runCommand('italic')}><em>I</em></button>
          <button type="button" onMouseDown={preventFocusLoss} onClick={() => runCommand('underline')}><span className="admin-rich-underline">U</span></button>
          <button type="button" onMouseDown={preventFocusLoss} onClick={() => runCommand('insertUnorderedList')}>Bullet List</button>
          <button type="button" onMouseDown={preventFocusLoss} onClick={() => runCommand('insertOrderedList')}>Numbered List</button>
          <button type="button" onMouseDown={preventFocusLoss} onClick={handleLink}>Link</button>
          <button type="button" onMouseDown={preventFocusLoss} onClick={() => runCommand('unlink')}>Unlink</button>
        </div>
        <span className="admin-rich-text-divider" aria-hidden="true" />
        <div className="admin-rich-text-command-group" role="group" aria-label="Image commands">
          <button
            type="button"
            className="admin-rich-delete-image-button"
            disabled={selectedImageWidth === null}
            aria-label="Delete selected image"
            title={selectedImageWidth === null ? 'Select an image in the editor first' : 'Delete selected image'}
            onMouseDown={preventFocusLoss}
            onClick={deleteSelectedImage}
          >
            Delete Image
          </button>
        </div>
        <span className="admin-rich-text-divider" aria-hidden="true" />
        <div className="admin-rich-text-command-group" role="group" aria-label="Table commands">
          <button type="button" className="admin-rich-table-button" onMouseDown={preventFocusLoss} onClick={insertTable}>Insert Table</button>
          <button type="button" className="admin-rich-table-button" onMouseDown={preventFocusLoss} onClick={addTableRow}>Add Row</button>
          <button type="button" className="admin-rich-table-button" onMouseDown={preventFocusLoss} onClick={addTableColumn}>Add Column</button>
          <button type="button" className="admin-rich-table-button" onMouseDown={preventFocusLoss} onClick={mergeCellRight}>Merge Right</button>
          <button type="button" className="admin-rich-table-button" onMouseDown={preventFocusLoss} onClick={mergeCellDown}>Merge Down</button>
          <button type="button" className="admin-rich-table-button" onMouseDown={preventFocusLoss} onClick={deleteTableRow}>Delete Row</button>
          <button type="button" className="admin-rich-table-button" onMouseDown={preventFocusLoss} onClick={deleteTableColumn}>Delete Column</button>
          <button type="button" className="admin-rich-table-button" onMouseDown={preventFocusLoss} onClick={deleteTable}>Delete Table</button>
        </div>
      </div>
      <div
        className={`admin-rich-text-image-hint ${imageUploadError ? 'has-error' : ''}`}
        role="status"
        aria-live="polite"
      >
        {imageUploadsInProgress > 0
          ? `Uploading ${imageUploadsInProgress} image${imageUploadsInProgress === 1 ? '' : 's'}...`
          : imageUploadError || 'Paste an image or drag and drop it into the text field.'}
      </div>
      <div
        ref={editorRef}
        className={`admin-rich-text-editor ${isImageDragActive ? 'is-image-drag-active' : ''}`}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        onInput={syncValue}
        onBlur={syncValue}
        onClick={handleEditorClick}
        onMouseUp={rememberEditorSelection}
        onKeyUp={rememberEditorSelection}
        onPaste={handlePaste}
        onDragEnter={handleImageDragOver}
        onDragOver={handleImageDragOver}
        onDragLeave={handleImageDragLeave}
        onDrop={handleImageDrop}
        suppressContentEditableWarning
      />
      {selectedImageWidth !== null && (
        <div className="admin-rich-image-resize" role="group" aria-label="Selected image size">
          <span className="admin-rich-image-resize-label">Image size</span>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={selectedImageWidth}
            aria-label="Image width percentage"
            onChange={(event) => resizeSelectedImage(event.target.value)}
          />
          <output>{selectedImageWidth}%</output>
          <div className="admin-rich-image-size-presets" aria-label="Image size presets">
            {[25, 50, 75, 100].map((width) => (
              <button
                key={width}
                type="button"
                className={selectedImageWidth === width ? 'is-active' : ''}
                onMouseDown={preventFocusLoss}
                onClick={() => resizeSelectedImage(width)}
              >
                {width}%
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export const CatalogGroupEditorModal = ({ group, category, itemType, onClose, onSaved }) => {
  const summaryEditorRef = useRef(null);
  const [groupName, setGroupName] = useState(group?.group_name || '');
  const [externalId, setExternalId] = useState(group?.external_id || '');
  const [summary, setSummary] = useState(group?.summary || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEditing = Boolean(group?.group_id);
  const typeLabel = itemType === 'service' ? 'Service' : itemType === 'reagent' ? 'Reagent' : 'Product';

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanName = groupName.trim();
    if (!cleanName) {
      setError(`${typeLabel} Group Name is required.`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const endpoint = isEditing
        ? `/api/admin-panel/catalog-groups/${group.group_id}/update/`
        : '/api/admin-panel/catalog-groups/create/';
      const savedGroup = await apiFetch(endpoint, {
        method: 'POST',
        body: {
          category_external_id: category.id,
          group_name: cleanName,
          external_id: externalId.trim(),
          summary: summaryEditorRef.current?.getHtml() ?? summary,
        },
      });
      onSaved(savedGroup);
    } catch (err) {
      setError(err.message || `Failed to save ${typeLabel.toLowerCase()} group.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={() => !saving && onClose()}>
      <div className="admin-modal admin-modal-lg admin-catalog-group-modal" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{isEditing ? `Edit ${typeLabel} Group` : `Create ${typeLabel} Group`}</h3>
          <button type="button" className="admin-modal-close" disabled={saving} onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            {error && <div className="admin-alert error">{error}</div>}
            <div className="admin-form-grid">
              <label className="admin-form-field">
                <span>{typeLabel} Group Name *</span>
                <input type="text" value={groupName} onChange={(event) => setGroupName(event.target.value)} required />
              </label>
              <label className="admin-form-field">
                <span>External ID *</span>
                <input
                  type="text"
                  value={externalId}
                  onChange={(event) => setExternalId(event.target.value)}
                  placeholder={isEditing ? 'Enter an External ID' : 'Leave blank to auto-generate'}
                  required={isEditing}
                  aria-describedby="catalog-group-external-id-help"
                />
                <small id="catalog-group-external-id-help">
                  Letters, numbers, hyphens, and underscores only. Changing this also changes the public group URL.
                </small>
              </label>
              <div className="admin-form-field span-3">
                <span>Summary</span>
                <ProductContentEditor
                  ref={summaryEditorRef}
                  value={summary}
                  onChange={setSummary}
                  ariaLabel={`${typeLabel} group summary`}
                />
              </div>
            </div>
          </div>
          <div className="admin-modal-footer">
            <button type="button" className="secondary-admin-button" disabled={saving} onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Save Group' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CatalogCategoryEditorPage = ({ category, itemType, onCancel, onSaved }) => {
  const summaryEditorRef = useRef(null);
  const [categoryName, setCategoryName] = useState(category?.category_name || category?.name || '');
  const [summary, setSummary] = useState(category?.summary || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const typeLabel = itemType === 'service' ? 'Service' : itemType === 'reagent' ? 'Reagent' : 'Product';
  const externalId = category?.external_id || category?.id || '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanName = categoryName.trim();
    if (!cleanName) {
      setError(`${typeLabel} Category Name is required.`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const updatedCategory = await apiFetch(
        `/api/admin-panel/product-categories/${category.category_id}/update/`,
        {
          method: 'POST',
          body: {
            category_name: cleanName,
            summary: summaryEditorRef.current?.getHtml() ?? summary,
          },
        },
      );
      onSaved(updatedCategory);
    } catch (err) {
      setError(err.message || `Failed to save ${typeLabel.toLowerCase()} category.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-blog-editor-page admin-category-editor-page">
      <div className="admin-editor-header">
        <div>
          <button type="button" className="admin-back-button" disabled={saving} onClick={onCancel}>
            Back to {typeLabel} Catalog
          </button>
          <h2 id="admin-content-title">Edit {typeLabel} Category</h2>
        </div>
        <div className="admin-editor-header-actions">
          <button type="button" className="secondary-admin-button" disabled={saving} onClick={onCancel}>Cancel</button>
          <button type="submit" form="admin-category-editor-form" className="primary-button" disabled={saving}>
            {saving ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      </div>

      {error && <div className="admin-alert error">{error}</div>}

      <form id="admin-category-editor-form" onSubmit={handleSubmit} className="admin-editor-panel">
        <div className="admin-form-grid">
          <label className="admin-form-field">
            <span>{typeLabel} Category Name *</span>
            <input type="text" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required />
          </label>
          <label className="admin-form-field">
            <span>External ID</span>
            <input type="text" value={externalId} readOnly />
          </label>
          <div className="admin-form-field span-3">
            <span>Summary</span>
            <ProductContentEditor
              ref={summaryEditorRef}
              value={summary}
              onChange={setSummary}
              ariaLabel={`${typeLabel} category summary`}
            />
          </div>
        </div>
        <div className="admin-editor-footer">
          <button type="button" className="secondary-admin-button" disabled={saving} onClick={onCancel}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const CatalogVideoEditor = ({ videos = [], onChange, onUpload, itemLabel }) => (
  <div className="admin-form-field span-3 admin-catalog-video-editor">
    <span className="admin-catalog-media-title">{itemLabel} Videos</span>
    <div className="admin-catalog-video-grid">
      {videos.map((videoUrl, index) => (
        <div className="admin-catalog-video-card" key={`${videoUrl}-${index}`}>
          {videoUrl ? (
            <video src={formatAssetUrl(videoUrl)} controls preload="metadata" />
          ) : (
            <span className="admin-catalog-video-empty">Empty path</span>
          )}
          <input
            type="text"
            value={videoUrl || ''}
            onChange={(event) => {
              const nextVideos = [...videos];
              nextVideos[index] = event.target.value;
              onChange(nextVideos);
            }}
            placeholder="Video path"
            aria-label={`${itemLabel} video ${index + 1} path`}
          />
          <button
            type="button"
            className="admin-catalog-media-remove"
            onClick={() => onChange(videos.filter((_, videoIndex) => videoIndex !== index))}
            aria-label={`Remove ${itemLabel.toLowerCase()} video ${index + 1}`}
            title="Remove video"
          >
            ×
          </button>
        </div>
      ))}

      <div className="admin-catalog-video-add-card">
        <button
          type="button"
          className="secondary-admin-button"
          onClick={() => onChange([...videos, ''])}
        >
          + Add Path
        </button>
        <label className="primary-button">
          + Upload Video
          <input
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            onChange={onUpload}
          />
        </label>
        <small>MP4, WebM, or Ogg; maximum 200 MB.</small>
      </div>
    </div>
  </div>
);

function AdminProducts({ categoryFilter = null, initialEditId = null, onInitialEditHandled }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [catalogStatus, setCatalogStatus] = useState('active');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogRows, setCatalogRows] = useState([]);
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [catalogImageUploading, setCatalogImageUploading] = useState({});
  const [draggedCatalogIndex, setDraggedCatalogIndex] = useState(null);
  const [collapsedCatalogs, setCollapsedCatalogs] = useState(() => new Set());
  const [subgroupSorts, setSubgroupSorts] = useState({});
  const [optionRows, setOptionRows] = useState([]);
  const [editingCatalogGroup, setEditingCatalogGroup] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const productContentEditorRef = useRef(null);
  const performanceDataEditorRef = useRef(null);
  const optionRowIdRef = useRef(0);

  const getProductsListUrl = useCallback(() => {
    const sourceType = categoryFilter === 'products' ? 'product' : 'reagent';
    const hiddenFilter = `&hidden=${catalogStatus === 'deactivated' ? 'true' : 'false'}`;
    return `/api/admin-panel/products/?page_number=1&page_size=250&source_type=${sourceType}${hiddenFilter}`;
  }, [categoryFilter, catalogStatus]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch categories
      const catsData = await apiFetch('/api/products/load-product-categories/');
      setCategories(catsData || []);

      // 2. Fetch products
      const data = await apiFetch(getProductsListUrl());
      
      const rawList = data.results || data.products || [];
      setProducts(rawList);
    } catch (err) {
      setError(err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [getProductsListUrl]);

  useEffect(() => {
    loadProducts();
    setSelectedCategory('All'); // Reset filter when categoryFilter tab changes
  }, [loadProducts]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const createOptionRows = (options = [], optionPrices = {}, optionDiscountedPrices = {}) => {
    const optionNames = Array.isArray(options) ? options : [];
    const priceMap = optionPrices && typeof optionPrices === 'object' && !Array.isArray(optionPrices)
      ? optionPrices
      : {};
    const discountedPriceMap = (
      optionDiscountedPrices
      && typeof optionDiscountedPrices === 'object'
      && !Array.isArray(optionDiscountedPrices)
    ) ? optionDiscountedPrices : {};
    const names = [...new Set([
      ...optionNames,
      ...Object.keys(priceMap),
      ...Object.keys(discountedPriceMap),
    ])];

    return names.map((name) => ({
      id: `option-row-${++optionRowIdRef.current}`,
      name,
      price: priceMap[name] ?? '',
      discountedPrice: discountedPriceMap[name] ?? '',
    }));
  };

  const updateOptionRow = (rowId, field, value) => {
    setOptionRows((rows) => rows.map((row) => (
      row.id === rowId ? { ...row, [field]: value } : row
    )));
  };

  const addOptionRow = () => {
    setOptionRows((rows) => [
      ...rows,
      { id: `option-row-${++optionRowIdRef.current}`, name: '', price: '', discountedPrice: '' },
    ]);
  };

  const removeOptionRow = (rowId) => {
    setOptionRows((rows) => rows.filter((row) => row.id !== rowId));
  };

  const handleCreate = () => {
    setOptionRows([]);
    setEditingProduct({
      product_name: '',
      external_id: '',
      catalog_number: '',
      show_catalog_number: true,
      description: '',
      image_url: '',
      images: [],
      videos: [],
      category_external_id: selectedCategory !== 'All' && selectedCategory !== 'uncategorized' ? selectedCategory : '',
      product_group: '',
      source_type: categoryFilter === 'products' ? 'quote' : 'reagent',
      list_price: '',
      discounted_price: '',
      price_range: '',
      availability: '',
      hidden: false,
      is_featured: false,
      show_on_screen: false,
      quote_only: false,
      key_features: [],
      content_text: '',
    });
    setIsModalOpen(false);
    setError('');
    setSuccessMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = async (productId) => {
    try {
      setError('');
      setSuccessMsg('');
      const data = await apiFetch(`/api/admin-panel/products/${productId}/`);
      const productData = data.product || data;
      const reagentPlainTextFields = categoryFilter === 'reagents'
        ? {
            description: richTextToPlainText(productData.description),
            key_features: reagentKeyFeaturesToPlainText(productData.key_features),
            storage_stability: richTextToPlainText(productData.storage_stability),
          }
        : {};
      setOptionRows(createOptionRows(
        productData.options,
        productData.option_prices,
        productData.option_discounted_prices,
      ));
      setEditingProduct({
        ...productData,
        ...reagentPlainTextFields,
        content_text: productData.content_text || productData.contentText || productData.raw_detail?.contentText || '',
        product_id: productData.product_id || productData.id || productId
      });
      setIsModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (initialEditId === null || initialEditId === undefined) return;

    handleEdit(initialEditId).finally(() => {
      onInitialEditHandled?.();
    });
  }, [initialEditId]);

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setOptionRows([]);
    setIsModalOpen(false);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeactivate = async (productId) => {
    const itemLabel = categoryFilter === 'products' ? 'product' : 'reagent';
    if (!confirm(`Are you sure you want to deactivate this ${itemLabel}?`)) return;
    try {
      await apiFetch(`/api/admin-panel/products/${productId}/delete/`, { method: 'POST' });
      showSuccess(`${itemLabel === 'product' ? 'Product' : 'Reagent'} deactivated successfully.`);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleActivate = async (productId) => {
    const itemLabel = categoryFilter === 'products' ? 'product' : 'reagent';
    if (!confirm(`Are you sure you want to activate this ${itemLabel}?`)) return;
    try {
      await apiFetch(`/api/admin-panel/products/${productId}/update/`, {
        method: 'POST',
        body: { hidden: false }
      });
      showSuccess(`${itemLabel === 'product' ? 'Product' : 'Reagent'} activated successfully.`);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleFeatured = async (productId, currentStatus) => {
    try {
      const updatedStatus = !currentStatus;
      
      // Optimistic local state update
      setProducts(prevProducts => prevProducts.map(p => {
        const pId = p.id || p.product_id;
        if (pId === productId) {
          return { ...p, is_featured: updatedStatus };
        }
        return p;
      }));

      await apiFetch(`/api/admin-panel/products/${productId}/update/`, {
        method: 'POST',
        body: {
          is_featured: updatedStatus
        }
      });
      showSuccess(updatedStatus ? 'Product is now featured.' : 'Product is no longer featured.');

      // Sync silent background reload
      const data = await apiFetch(getProductsListUrl());
      const rawList = data.results || data.products || [];
      setProducts(rawList);
    } catch (err) {
      setError(err.message);
      // Revert status on failure
      const data = await apiFetch(getProductsListUrl());
      const rawList = data.results || data.products || [];
      setProducts(rawList);
    }
  };

  const handleToggleShowOnScreen = async (productId, currentStatus) => {
    try {
      const updatedStatus = !currentStatus;
      
      // Optimistic local state update
      setProducts(prevProducts => prevProducts.map(p => {
        const pId = p.id || p.product_id;
        if (pId === productId) {
          return { ...p, show_on_screen: updatedStatus };
        }
        return p;
      }));

      await apiFetch(`/api/admin-panel/products/${productId}/update/`, {
        method: 'POST',
        body: {
          show_on_screen: updatedStatus
        }
      });
      showSuccess(updatedStatus ? 'Product will display on homepage.' : 'Product will not display on homepage.');

      // Sync silent background reload
      const data = await apiFetch(getProductsListUrl());
      const rawList = data.results || data.products || [];
      setProducts(rawList);
    } catch (err) {
      setError(err.message);
      // Revert status on failure
      const data = await apiFetch(getProductsListUrl());
      const rawList = data.results || data.products || [];
      setProducts(rawList);
    }
  };

  const handleSave = async (e, { closeAfterSave = true } = {}) => {
    e.preventDefault();
    setSaving(true);
    try {
      const editorContentText = productContentEditorRef.current?.getHtml?.() ?? editingProduct.content_text ?? '';
      // Content emitted by the rich-text editor is already canonical HTML.
      // Re-running it through the Markdown converter can strip embedded images
      // and flatten tables when surrounding text resembles Markdown syntax.
      const latestContentText = editorContentText;
      const latestDescription = editingProduct.description;
      const latestKeyFeatures = editingProduct.key_features;
      const latestStorageStability = editingProduct.storage_stability;
      const latestPerformanceData = performanceDataEditorRef.current?.getHtml?.() ?? editingProduct.performance_data ?? '';
      const updatedRawDetail = (
        editingProduct.raw_detail &&
        typeof editingProduct.raw_detail === 'object' &&
        !Array.isArray(editingProduct.raw_detail)
      )
        ? { ...editingProduct.raw_detail, contentText: latestContentText }
        : editingProduct.raw_detail;
      const isNew = !editingProduct.product_id;
      const endpoint = isNew
        ? '/api/admin-panel/products/create/'
        : `/api/admin-panel/products/${editingProduct.product_id}/update/`;

      const normalizedOptionRows = optionRows
        .map((row) => ({
          name: String(row.name || '').trim(),
          price: String(row.price ?? '').trim(),
          discountedPrice: String(row.discountedPrice ?? '').trim(),
        }))
        .filter((row) => row.name || row.price || row.discountedPrice);
      const unnamedOption = normalizedOptionRows.find((row) => !row.name);
      if (unnamedOption) {
        throw new Error('Each option price must have an option name.');
      }
      const normalizedOptions = normalizedOptionRows.map((row) => row.name);
      if (new Set(normalizedOptions).size !== normalizedOptions.length) {
        throw new Error('Option names must be unique.');
      }
      const normalizedOptionPrices = Object.fromEntries(
        normalizedOptionRows.map((row) => [row.name, row.price])
      );
      const normalizedOptionDiscountedPrices = Object.fromEntries(
        normalizedOptionRows
          .filter((row) => row.discountedPrice)
          .map((row) => [row.name, row.discountedPrice])
      );

      validateDiscountedPrice(
        editingProduct.discounted_price,
        editingProduct.list_price,
        'Discounted Price',
      );
      normalizedOptionRows.forEach((row) => {
        const effectiveListPrice = parseNumericCatalogPrice(row.price) === null
          ? editingProduct.list_price
          : row.price;
        validateDiscountedPrice(
          row.discountedPrice,
          effectiveListPrice,
          `Discounted Price for option "${row.name}"`,
        );
      });
      
      // Map 'uncategorized' option back to null or empty string for DB submission
      const payload = {
        ...editingProduct,
        description: latestDescription,
        content_text: latestContentText,
        key_features: normalizeKeyFeaturesForSave(latestKeyFeatures),
        storage_stability: latestStorageStability,
        performance_data: latestPerformanceData,
        options: normalizedOptions,
        option_prices: normalizedOptionPrices,
        option_discounted_prices: normalizedOptionDiscountedPrices,
        videos: (editingProduct.videos || []).filter(Boolean),
        manuals: (editingProduct.manuals || []).filter(man => man.name && man.manual),
        raw_detail: updatedRawDetail,
        category_external_id: editingProduct.category_external_id === 'uncategorized' ? '' : editingProduct.category_external_id
      };

      const saveResponse = await apiFetch(endpoint, {
        method: 'POST',
        body: payload,
      });
      showSuccess(isNew ? 'Product created!' : 'Product updated!');
      setIsModalOpen(false);
      if (closeAfterSave) {
        setEditingProduct(null);
        setOptionRows([]);
      } else if (isNew) {
        setOptionRows(createOptionRows(normalizedOptions, normalizedOptionPrices, normalizedOptionDiscountedPrices));
        setEditingProduct((prev) => ({
          ...prev,
          ...payload,
          product_id: saveResponse?.id,
          id: saveResponse?.id,
        }));
      } else {
        setOptionRows(createOptionRows(normalizedOptions, normalizedOptionPrices, normalizedOptionDiscountedPrices));
        setEditingProduct((prev) => ({
          ...prev,
          ...payload,
        }));
      }
      loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setEditingProduct(prev => ({ ...prev, [field]: value }));
  };

  const formatKeyFeaturesForEdit = (value) => {
    if (Array.isArray(value)) {
      return value.join('\n');
    }
    return value || '';
  };

  const updateKeyFeatures = (value) => {
    updateField('key_features', value);
  };

  const normalizeKeyFeaturesForSave = (value) => {
    if (Array.isArray(value)) {
      return value;
    }
    return String(value || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const handleImageUpload = async (e, targetField) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);

      // CSRF token retrieval helper
      let csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      if (!csrfToken) {
        const csrfRes = await fetch(`${API_URL}/api/csrf/`, { credentials: 'include' });
        const csrfData = await csrfRes.json();
        csrfToken = csrfData.csrftoken;
      }

      const response = await fetch(`${API_URL}/api/admin-panel/products/upload-image/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to upload image.');
      }

      const data = await response.json();
      const newPath = data.image_path;

      if (targetField === 'image_url') {
        updateField('image_url', newPath);
      } else if (targetField === 'images') {
        const newImages = [...(editingProduct.images || []), newPath];
        updateField('images', newImages);
      }
      showSuccess('Image uploaded successfully.');
    } catch (err) {
      setError(err.message || 'Image upload failed.');
    }
  };

  const handleManualUpload = async (e, idx) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);

      let csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      if (!csrfToken) {
        const csrfRes = await fetch(`${API_URL}/api/csrf/`, { credentials: 'include' });
        const csrfData = await csrfRes.json();
        csrfToken = csrfData.csrftoken;
      }

      const response = await fetch(`${API_URL}/api/admin-panel/products/upload-image/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to upload manual.');
      }

      const data = await response.json();
      const newPath = data.image_path;

      const newManuals = [...(editingProduct.manuals || [])];
      const defaultName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      newManuals[idx] = {
        ...newManuals[idx],
        name: newManuals[idx]?.name || defaultName,
        manual: newPath
      };
      updateField('manuals', newManuals);
      showSuccess('Manual uploaded successfully.');
    } catch (err) {
      setError(err.message || 'Manual upload failed.');
    }
  };


  const currentProductType = categoryFilter === 'products' ? 'product' : 'reagent';
  const normalizeCategory = (cat) => ({
    id: cat.external_id || cat.externalId || cat.id,
    name: cat.category_name || cat.name || cat.label,
    category_id: cat.category_id || cat.id,
    priority: cat.priority || 1,
    product_type: cat.product_type || currentProductType,
    show_on_homepage: !!cat.show_on_homepage,
    homepage_image: cat.homepage_image || '',
    summary: cat.summary || '',
    groups: (cat.groups || []).filter((group) => group.is_active !== false),
    product_count: cat.product_count ?? products.filter(p => p.category_external_id === (cat.external_id || cat.externalId || cat.id)).length,
  });
  const dbMatchedCategories = categories
    .filter((cat) => {
      const type = (cat.product_type || '').toLowerCase();
      return type === currentProductType
        || (currentProductType === 'product' && type === 'both')
        || (currentProductType === 'reagent' && type === 'consumable')
        || (!type && currentProductType === 'product');
    })
    .map(normalizeCategory);
  const matchedCategories = dbMatchedCategories
    .filter((cat) => cat.id)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0) || a.name.localeCompare(b.name));
  const availableProductGroups = matchedCategories
    .find((category) => category.id === editingProduct?.category_external_id)
    ?.groups || [];

  const openCatalogEditor = () => {
    setError('');
    setCatalogRows(matchedCategories.map((cat, index) => ({
      category_id: cat.category_id,
      category_name: cat.name,
      external_id: cat.id,
      priority: cat.priority || index + 1,
      product_type: cat.product_type || currentProductType,
      show_on_homepage: !!cat.show_on_homepage,
      homepage_image: cat.homepage_image || '',
      summary: cat.summary || '',
      groups: cat.groups || [],
      product_count: products.filter(p => p.category_external_id === cat.id).length,
      isNew: false,
    })));
    setIsCatalogModalOpen(true);
  };

  const updateCatalogRow = (index, field, value) => {
    setCatalogRows((prev) => prev.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: value } : row
    )));
  };

  const handleCatalogImageUpload = async (event, index) => {
    const fileInput = event.currentTarget;
    const file = fileInput.files?.[0];
    if (!file) return;

    setError('');
    setCatalogImageUploading((current) => ({ ...current, [index]: true }));
    try {
      const formData = new FormData();
      formData.append('image', file);

      let csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      if (!csrfToken) {
        const csrfResponse = await fetch(`${API_URL}/api/csrf/`, { credentials: 'include' });
        const csrfData = await csrfResponse.json();
        csrfToken = csrfData.csrftoken;
      }

      const response = await fetch(`${API_URL}/api/admin-panel/products/upload-image/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload homepage image.');
      }

      const data = await response.json();
      updateCatalogRow(index, 'homepage_image', data.image_path || data.url || '');
      showSuccess('Homepage category image uploaded. Save the catalog to apply it.');
    } catch (err) {
      setError(err.message || 'Homepage image upload failed.');
    } finally {
      setCatalogImageUploading((current) => ({ ...current, [index]: false }));
      fileInput.value = '';
    }
  };

  const handleVideoUpload = async (event) => {
    const fileInput = event.currentTarget;
    const file = fileInput.files?.[0];
    if (!file) return;

    setError('');
    try {
      const formData = new FormData();
      formData.append('video', file);
      const data = await apiFetch('/api/admin-panel/catalog/upload-video/', {
        method: 'POST',
        body: formData,
      });
      updateField('videos', [...(editingProduct.videos || []), data.video_path]);
      showSuccess('Video uploaded successfully.');
    } catch (err) {
      setError(err.message || 'Video upload failed.');
    } finally {
      fileInput.value = '';
    }
  };

  const moveCatalogRow = (index, direction) => {
    setCatalogRows((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;

      const rows = [...prev];
      [rows[index], rows[nextIndex]] = [rows[nextIndex], rows[index]];
      return rows.map((row, rowIndex) => ({ ...row, priority: rowIndex + 1 }));
    });
  };

  const reorderCatalogRows = (fromIndex, toIndex) => {
    if (fromIndex === null || fromIndex === undefined || fromIndex === toIndex) {
      return;
    }

    setCatalogRows((prev) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
        return prev;
      }

      const rows = [...prev];
      const [movedRow] = rows.splice(fromIndex, 1);
      rows.splice(toIndex, 0, movedRow);
      return rows.map((row, rowIndex) => ({ ...row, priority: rowIndex + 1 }));
    });
  };

  const handleCatalogDragStart = (event, index) => {
    setDraggedCatalogIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleCatalogDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleCatalogDrop = (event, index) => {
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer.getData('text/plain'));
    reorderCatalogRows(Number.isNaN(fromIndex) ? draggedCatalogIndex : fromIndex, index);
    setDraggedCatalogIndex(null);
  };

  const addCatalogRow = () => {
    setCatalogRows((prev) => [
      ...prev,
      {
        temp_id: `new-${Date.now()}`,
        category_name: '',
        external_id: '',
        priority: prev.length + 1,
        product_type: currentProductType,
        show_on_homepage: false,
        homepage_image: '',
        product_count: 0,
        isNew: true,
      },
    ]);
  };

  const deleteCatalogRow = async (index) => {
    const row = catalogRows[index];
    if (row.product_count > 0) {
      alert('This catalog contains products. Move or remove those products before deleting it.');
      return;
    }

    if (!confirm('Are you sure you want to delete this catalog?')) return;

    try {
      if (row.category_id) {
        await apiFetch(`/api/admin-panel/product-categories/${row.category_id}/delete/`, { method: 'POST' });
      }
      setCatalogRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index).map((item, rowIndex) => ({ ...item, priority: rowIndex + 1 })));
      showSuccess('Catalog deleted.');
      loadProducts();
    } catch (err) {
      alert(err.message || 'Failed to delete catalog.');
    }
  };

  const saveCatalogRows = async () => {
    setCatalogSaving(true);
    setError('');
    try {
      const unnamedRowIndex = catalogRows.findIndex((row) => !row.category_name?.trim());
      if (unnamedRowIndex !== -1) {
        throw new Error(`Catalog name is required in row ${unnamedRowIndex + 1}.`);
      }

      const savedRows = [];
      for (const row of catalogRows) {
        const payload = {
          category_name: row.category_name,
          external_id: row.external_id,
          priority: row.priority,
          product_type: row.product_type || currentProductType,
          show_on_homepage: !!row.show_on_homepage,
          homepage_image: row.homepage_image || '',
        };

        if (row.isNew || !row.category_id) {
          const created = await apiFetch('/api/admin-panel/product-categories/create/', {
            method: 'POST',
            body: payload,
          });
          savedRows.push(created);
        } else {
          const updated = await apiFetch(`/api/admin-panel/product-categories/${row.category_id}/update/`, {
            method: 'POST',
            body: payload,
          });
          savedRows.push(updated);
        }
      }

      await apiFetch('/api/admin-panel/product-categories/reorder/', {
        method: 'POST',
        body: {
          categories: savedRows.map((row, index) => ({
            category_id: row.category_id,
            priority: index + 1,
          })),
        },
      });

      showSuccess('Catalog updated.');
      setIsCatalogModalOpen(false);
      loadProducts();
    } catch (err) {
      setError(err.message || 'Failed to save catalog.');
    } finally {
      setCatalogSaving(false);
    }
  };

  // Grouping logic
  const getGroupedData = () => {
    const query = searchQuery.trim().toLowerCase();
    const searched = products.filter(p =>
      !query || 
      p.product_name?.toLowerCase().includes(query) ||
      p.external_id?.toLowerCase().includes(query) ||
      p.catalog_number?.toLowerCase().includes(query)
    );

    const groups = [];

    // Category routing
    matchedCategories.forEach(cat => {
      if (selectedCategory !== 'All' && selectedCategory !== cat.id) {
        return;
      }

      const catProducts = searched.filter(p => p.category_external_id === cat.id);
      
      const subGroupMap = {};
      (cat.groups || []).forEach((group) => {
        subGroupMap[group.group_name] = [];
      });
      catProducts.forEach(p => {
        const groupName = p.product_group || '';
        if (!subGroupMap[groupName]) {
          subGroupMap[groupName] = [];
        }
        subGroupMap[groupName].push(p);
      });

      groups.push({
        category: {
          category_id: cat.id,
          category_name: cat.name,
          external_id: cat.id
        },
        subgroups: subGroupMap,
        totalCount: catProducts.length
      });
    });

    // Uncategorized route
    if (selectedCategory === 'All' || selectedCategory === 'uncategorized') {
      const activeCatIds = matchedCategories.map(c => c.id);
      const uncategorizedProducts = searched.filter(p => 
        !p.category_external_id || !activeCatIds.includes(p.category_external_id)
      );

      if (uncategorizedProducts.length > 0 || selectedCategory === 'uncategorized') {
        const subGroupMap = {};
        uncategorizedProducts.forEach(p => {
          const groupName = p.product_group || '';
          if (!subGroupMap[groupName]) {
            subGroupMap[groupName] = [];
          }
          subGroupMap[groupName].push(p);
        });

        groups.push({
          category: {
            category_id: 'uncategorized',
            category_name: 'Uncategorized / Custom Products',
            external_id: 'uncategorized'
          },
          subgroups: subGroupMap,
          totalCount: uncategorizedProducts.length
        });
      }
    }

    return groups;
  };

  const groupedData = getGroupedData();

  const getSubgroupSortKey = (categoryId, subgroupName) => (
    `${categoryFilter}:${catalogStatus}:${categoryId}:${subgroupName || 'General'}`
  );

  const getSubgroupSort = (sortKey) => (
    subgroupSorts[sortKey] || { field: 'catalog_number', direction: 'asc' }
  );

  const updateSubgroupSort = (sortKey, field) => {
    setSubgroupSorts((currentSorts) => {
      const current = currentSorts[sortKey] || { field: 'catalog_number', direction: 'asc' };
      return {
        ...currentSorts,
        [sortKey]: {
          field,
          direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
        },
      };
    });
  };

  const getPriceSortValue = (value) => {
    const match = String(value || '').replaceAll(',', '').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  };

  const sortSubgroupProducts = (items, sortConfig) => (
    items
      .map((item, index) => ({ item, index }))
      .sort((left, right) => {
        const leftValue = sortConfig.field === 'price'
          ? getPriceSortValue(left.item.list_price)
          : String(left.item[sortConfig.field] || '').trim();
        const rightValue = sortConfig.field === 'price'
          ? getPriceSortValue(right.item.list_price)
          : String(right.item[sortConfig.field] || '').trim();
        const leftMissing = leftValue === null || leftValue === '';
        const rightMissing = rightValue === null || rightValue === '';

        if (leftMissing !== rightMissing) return leftMissing ? 1 : -1;
        if (leftMissing && rightMissing) return left.index - right.index;

        const comparison = sortConfig.field === 'price'
          ? leftValue - rightValue
          : leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: 'base' });
        return comparison === 0
          ? left.index - right.index
          : comparison * (sortConfig.direction === 'asc' ? 1 : -1);
      })
      .map(({ item }) => item)
  );

  const SortableHeader = ({ label, field, sortKey, sortConfig }) => {
    const isActive = sortConfig.field === field;
    return (
      <th aria-sort={isActive ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button
          type="button"
          className={`admin-table-sort-button ${isActive ? 'is-active' : ''}`}
          onClick={() => updateSubgroupSort(sortKey, field)}
          aria-label={`Sort by ${label}${isActive ? `, currently ${sortConfig.direction === 'asc' ? 'ascending' : 'descending'}` : ''}`}
        >
          <span>{label}</span>
          {isActive && (
            <span
              className="admin-table-sort-direction"
              data-direction={sortConfig.direction}
              aria-hidden="true"
            />
          )}
        </button>
      </th>
    );
  };

  const toggleCatalogCollapse = (catalogId) => {
    setCollapsedCatalogs((prev) => {
      const next = new Set(prev);
      if (next.has(catalogId)) {
        next.delete(catalogId);
      } else {
        next.add(catalogId);
      }
      return next;
    });
  };

  if (editingProduct) {
    const isEditingExistingProduct = Boolean(editingProduct.product_id || editingProduct.id);

    return (
      <div className="admin-blog-editor-page admin-product-editor-page">
        <div className="admin-editor-header">
          <div>
            <button type="button" className="admin-back-button" onClick={handleCancelEdit}>
              Back to {categoryFilter === 'products' ? 'Products Catalog' : 'Reagents Catalog'}
            </button>
            <h2 id="admin-content-title">
              {isEditingExistingProduct ? `Edit ${categoryFilter === 'products' ? 'Product' : 'Reagent'}` : `Create ${categoryFilter === 'products' ? 'Product' : 'Reagent'}`}
            </h2>
          </div>
          <div className="admin-editor-header-actions">
            <button type="button" className="secondary-admin-button" onClick={handleCancelEdit}>Cancel</button>
            <button type="button" className="secondary-admin-button" disabled={saving} onClick={(e) => handleSave(e, { closeAfterSave: false })}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="submit" form="admin-product-editor-form" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : (isEditingExistingProduct ? 'Save & Close' : 'Create & Close')}
            </button>
          </div>
        </div>

        {error && <div className="admin-alert error">{error}</div>}

        <form id="admin-product-editor-form" onSubmit={handleSave} className="admin-editor-panel">
          <div className="admin-form-grid admin-catalog-editor-grid">
            <label className="admin-form-field span-2">
              <span>Product Name *</span>
              <input type="text" value={editingProduct.product_name || ''} onChange={(e) => updateField('product_name', e.target.value)} required />
            </label>
            <label className="admin-form-field">
              <span>External ID *</span>
              <input type="text" value={editingProduct.external_id || ''} onChange={(e) => updateField('external_id', e.target.value)} required />
            </label>
            <label className="admin-form-field">
              <span>Catalog Number</span>
              <input type="text" value={editingProduct.catalog_number || ''} onChange={(e) => updateField('catalog_number', e.target.value)} />
            </label>
            <CatalogNumberDisplayToggle
              checked={editingProduct.show_catalog_number !== false}
              onChange={(checked) => updateField('show_catalog_number', checked)}
            />
            <label className="admin-form-field">
              <span>Category *</span>
              <select
                value={editingProduct.category_external_id || ''}
                onChange={(e) => setEditingProduct((current) => ({
                  ...current,
                  category_external_id: e.target.value,
                  catalog_group_id: null,
                  product_group: '',
                }))}
                required
              >
                <option value="">-- Select Category --</option>
                {matchedCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.id})
                  </option>
                ))}
                <option value="uncategorized">Uncategorized / Custom</option>
              </select>
            </label>
            <label className="admin-form-field">
              <span>Product Group (Subcategory)</span>
              <select
                value={editingProduct.catalog_group_id || ''}
                onChange={(e) => {
                  const group = availableProductGroups.find((item) => String(item.group_id) === e.target.value);
                  setEditingProduct((current) => ({
                    ...current,
                    catalog_group_id: group?.group_id || null,
                    product_group: group?.group_name || '',
                  }));
                }}
                disabled={!editingProduct.category_external_id}
              >
                <option value="">-- No Group --</option>
                {availableProductGroups.map((group) => (
                  <option key={group.group_id} value={group.group_id}>{group.group_name}</option>
                ))}
              </select>
            </label>
            <label className="admin-form-field">
              <span>List Price</span>
              <input type="text" value={editingProduct.list_price || ''} onChange={(e) => updateField('list_price', e.target.value)} />
            </label>
            <label className="admin-form-field">
              <span>Discounted Price</span>
              <input
                type="text"
                value={editingProduct.discounted_price || ''}
                onChange={(e) => updateField('discounted_price', e.target.value)}
                placeholder="Must not exceed List Price"
              />
            </label>

            <div className="admin-form-field span-3 admin-options-editor">
              <div className="admin-options-editor-header">
                <div>
                  <h3>Options &amp; Option Prices</h3>
                  <p>Manage the selectable sizes, packages, or configurations for this item.</p>
                </div>
                <button type="button" className="secondary-admin-button" onClick={addOptionRow}>
                  + Add Option
                </button>
              </div>

              {optionRows.length === 0 ? (
                <div className="admin-options-empty">No options have been added.</div>
              ) : (
                <div className="admin-options-list">
                  <div className="admin-option-row admin-option-row-heading" aria-hidden="true">
                    <span>Option</span>
                    <span>List Price</span>
                    <span>Discounted Price</span>
                    <span>Action</span>
                  </div>
                  {optionRows.map((row, index) => (
                    <div className="admin-option-row" key={row.id}>
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateOptionRow(row.id, 'name', e.target.value)}
                        placeholder="e.g. 500 µL"
                        aria-label={`Option ${index + 1} name`}
                      />
                      <input
                        type="text"
                        value={row.price}
                        onChange={(e) => updateOptionRow(row.id, 'price', e.target.value)}
                        placeholder="e.g. $39.00"
                        aria-label={`Option ${index + 1} price`}
                      />
                      <input
                        type="text"
                        value={row.discountedPrice}
                        onChange={(e) => updateOptionRow(row.id, 'discountedPrice', e.target.value)}
                        placeholder="Optional discounted price"
                        aria-label={`Option ${index + 1} discounted price`}
                      />
                      <button
                        type="button"
                        className="admin-action-btn delete"
                        onClick={() => removeOptionRow(row.id)}
                        aria-label={`Remove option ${index + 1}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-form-field span-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontWeight: '500', color: 'var(--ink)' }}>Main Image</span>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                {editingProduct.image_url ? (
                  <div className="admin-image-preview-wrapper" style={{ position: 'relative', width: '100px', height: '100px', border: '1px solid var(--line)', borderRadius: '6px', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={formatAssetUrl(editingProduct.image_url)}
                      alt="Main Preview"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={() => updateField('image_url', '')}
                      style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(244, 67, 54, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                      title="Remove image"
                    >
                      x
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '100px', height: '100px', border: '1px dashed var(--line)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '12px', background: '#fcfdfd', textAlign: 'center', padding: '5px' }}>
                    No Image
                  </div>
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Image URL or Path (e.g. media/product_images/...)"
                    value={editingProduct.image_url || ''}
                    onChange={(e) => updateField('image_url', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: '6px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label className="secondary-admin-button" style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer', margin: 0, display: 'inline-block' }}>
                      Upload File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'image_url')}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>or type route above</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-form-field span-3" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '15px', marginTop: '10px' }}>
              <span style={{ fontWeight: '600', color: 'var(--ink)' }}>Additional Gallery Images</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px', marginTop: '5px' }}>
                {(editingProduct.images || []).map((imgUrl, idx) => (
                  <div key={idx} className="admin-image-preview-wrapper" style={{ position: 'relative', height: '150px', border: '1px solid var(--line)', borderRadius: '6px', overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column', padding: '5px', gap: '5px' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minHeight: '80px', position: 'relative' }}>
                      {imgUrl ? (
                        <img
                          src={formatAssetUrl(imgUrl)}
                          alt={`Preview ${idx + 1}`}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Empty Path</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={imgUrl || ''}
                      onChange={(e) => {
                        const newImages = [...(editingProduct.images || [])];
                        newImages[idx] = e.target.value;
                        updateField('images', newImages);
                      }}
                      placeholder="Image path"
                      style={{ fontSize: '11px', padding: '4px', width: '100%', border: '1px solid var(--line)', borderRadius: '4px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = (editingProduct.images || []).filter((_, i) => i !== idx);
                        updateField('images', newImages);
                      }}
                      style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(244, 67, 54, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                      title="Remove image"
                    >
                      x
                    </button>
                  </div>
                ))}

                <div style={{ height: '150px', border: '1px dashed var(--line)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#fcfdfd', padding: '10px' }}>
                  <button
                    type="button"
                    className="secondary-admin-button"
                    onClick={() => {
                      const newImages = [...(editingProduct.images || []), ''];
                      updateField('images', newImages);
                    }}
                    style={{ fontSize: '12px', padding: '6px 10px', width: '100%' }}
                  >
                    + Add Path
                  </button>
                  <label className="primary-button" style={{ fontSize: '12px', padding: '6px 10px', width: '100%', textAlign: 'center', cursor: 'pointer', display: 'inline-block', margin: 0 }}>
                    + Upload File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'images')}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <CatalogVideoEditor
              videos={editingProduct.videos || []}
              onChange={(videos) => updateField('videos', videos)}
              onUpload={handleVideoUpload}
              itemLabel={categoryFilter === 'products' ? 'Product' : 'Reagent'}
            />

            <div className="admin-form-field span-3" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '15px', marginTop: '10px' }}>
              <span style={{ fontWeight: '600', color: 'var(--ink)' }}>Product Manuals (PDFs)</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', marginTop: '5px' }}>
                {(editingProduct.manuals || []).map((man, idx) => (
                  <div key={idx} style={{ position: 'relative', border: '1px solid var(--line)', borderRadius: '6px', padding: '10px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      value={man.name || ''}
                      onChange={(e) => {
                        const newManuals = [...(editingProduct.manuals || [])];
                        newManuals[idx] = { ...newManuals[idx], name: e.target.value };
                        updateField('manuals', newManuals);
                      }}
                      placeholder="Manual Name (e.g. Protocol Guide)"
                      style={{ fontSize: '12px', padding: '6px', border: '1px solid var(--line)', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      value={man.manual || ''}
                      onChange={(e) => {
                        const newManuals = [...(editingProduct.manuals || [])];
                        newManuals[idx] = { ...newManuals[idx], manual: e.target.value };
                        updateField('manuals', newManuals);
                      }}
                      placeholder="File Path (e.g. manual_files/...)"
                      style={{ fontSize: '12px', padding: '6px', border: '1px solid var(--line)', borderRadius: '4px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                      <label className="secondary-admin-button" style={{ fontSize: '11px', padding: '4px 8px', cursor: 'pointer', margin: 0, display: 'inline-block' }}>
                        Upload PDF
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleManualUpload(e, idx)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newManuals = (editingProduct.manuals || []).filter((_, i) => i !== idx);
                        updateField('manuals', newManuals);
                      }}
                      style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(244, 67, 54, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                      title="Remove manual"
                    >
                      x
                    </button>
                  </div>
                ))}
                
                <div style={{ minHeight: '110px', border: '1px dashed var(--line)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#fcfdfd', padding: '10px' }}>
                  <button
                    type="button"
                    className="secondary-admin-button"
                    onClick={() => {
                      const newManuals = [...(editingProduct.manuals || []), { name: '', manual: '' }];
                      updateField('manuals', newManuals);
                    }}
                    style={{ fontSize: '12px', padding: '6px 10px', width: '100%' }}
                  >
                    + Add Manual
                  </button>
                </div>
              </div>
            </div>

            <div className="admin-form-field span-3">
              <span>{categoryFilter === 'products' ? 'Product Detail' : 'Reagent Detail'}</span>
              <ProductContentEditor ref={productContentEditorRef} value={editingProduct.content_text || ''} onChange={(value) => updateField('content_text', value)} />
            </div>
            {categoryFilter === 'reagents' ? (
              <>
                <label className="admin-form-field span-3">
                  <span>Description</span>
                  <textarea rows="4" value={editingProduct.description || ''} onChange={(e) => updateField('description', e.target.value)} />
                </label>
                <label className="admin-form-field span-3">
                  <span>Key Features</span>
                  <textarea
                    rows="5"
                    value={formatKeyFeaturesForEdit(editingProduct.key_features)}
                    onChange={(e) => updateKeyFeatures(e.target.value)}
                    placeholder="Enter one key feature per line"
                  />
                </label>
                <label className="admin-form-field span-3">
                  <span>Storage &amp; Stability</span>
                  <textarea rows="4" value={editingProduct.storage_stability || ''} onChange={(e) => updateField('storage_stability', e.target.value)} />
                </label>
                <div className="admin-form-field span-3">
                  <span>Performance Data</span>
                  <ProductContentEditor
                    ref={performanceDataEditorRef}
                    value={editingProduct.performance_data || ''}
                    onChange={(value) => updateField('performance_data', value)}
                    ariaLabel="Reagent performance data"
                  />
                </div>
              </>
            ) : (
              <>
                <label className="admin-form-field span-3">
                  <span>Description</span>
                  <textarea rows="4" value={editingProduct.description || ''} onChange={(e) => updateField('description', e.target.value)} />
                </label>
                <label className="admin-form-field span-3">
                  <span>Key Features</span>
                  <textarea
                    rows="5"
                    value={formatKeyFeaturesForEdit(editingProduct.key_features)}
                    onChange={(e) => updateKeyFeatures(e.target.value)}
                    placeholder="Enter one key feature per line"
                  />
                </label>
                <label className="admin-form-field span-3">
                  <span>Storage &amp; Stability</span>
                  <textarea rows="4" value={editingProduct.storage_stability || ''} onChange={(e) => updateField('storage_stability', e.target.value)} />
                </label>
                <div className="admin-form-field span-3">
                  <span>Performance Data</span>
                  <ProductContentEditor
                    ref={performanceDataEditorRef}
                    value={editingProduct.performance_data || ''}
                    onChange={(value) => updateField('performance_data', value)}
                    ariaLabel="Product performance data"
                  />
                </div>
              </>
            )}
            <label className="admin-form-field">
              <span>Availability</span>
              <input type="text" value={editingProduct.availability || ''} onChange={(e) => updateField('availability', e.target.value)} />
            </label>
            <label className="admin-form-field">
              <span>Source Type</span>
              <input type="text" value={editingProduct.source_type || ''} onChange={(e) => updateField('source_type', e.target.value)} />
            </label>
            <label className="admin-form-field">
              <span>Display Order</span>
              <input type="number" value={editingProduct.display_order || ''} onChange={(e) => updateField('display_order', e.target.value ? parseInt(e.target.value) : null)} />
            </label>
          </div>

          <div className="admin-form-toggles">
            <label className="admin-toggle">
              <input type="checkbox" checked={!!editingProduct.hidden} onChange={(e) => updateField('hidden', e.target.checked)} />
              <span>Deactivated</span>
            </label>
            <label className="admin-toggle">
              <input type="checkbox" checked={!!editingProduct.is_featured} onChange={(e) => updateField('is_featured', e.target.checked)} />
              <span>Featured</span>
            </label>
            <label className="admin-toggle">
              <input type="checkbox" checked={!!editingProduct.show_on_screen} onChange={(e) => updateField('show_on_screen', e.target.checked)} />
              <span>Display on homepage</span>
            </label>
            <label className="admin-toggle">
              <input type="checkbox" checked={!!editingProduct.quote_only} onChange={(e) => updateField('quote_only', e.target.checked)} />
              <span>Quote Only</span>
            </label>
          </div>

          <div className="admin-editor-footer">
            <button type="button" className="secondary-admin-button" onClick={handleCancelEdit}>Cancel</button>
            <button type="button" className="secondary-admin-button" disabled={saving} onClick={(e) => handleSave(e, { closeAfterSave: false })}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : (isEditingExistingProduct ? 'Save & Close' : 'Create & Close')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (editingCategory) {
    return (
      <CatalogCategoryEditorPage
        category={editingCategory}
        itemType={currentProductType}
        onCancel={() => setEditingCategory(null)}
        onSaved={(savedCategory) => {
          setEditingCategory(null);
          showSuccess(`${currentProductType === 'reagent' ? 'Reagent' : 'Product'} category ${savedCategory.category_name} saved.`);
          loadProducts();
        }}
      />
    );
  }

  return (
    <>
      <div className="admin-section-header">
        <h2 id="admin-content-title">
          {categoryFilter === 'products' ? 'Products Catalog' : 'Reagents Catalog'}
        </h2>
        <div className="admin-section-actions">
          <div className="admin-search-box">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="secondary-admin-button" onClick={openCatalogEditor}>
            Edit Catalog
          </button>
          <button className="primary-button" onClick={handleCreate}>
            + Add {categoryFilter === 'products' ? 'Product' : 'Reagent'}
          </button>
        </div>
      </div>

      <div
        className="admin-tabs"
        role="tablist"
        aria-label={`${categoryFilter === 'products' ? 'Product' : 'Reagent'} status`}
      >
        <button
          type="button"
          role="tab"
          aria-selected={catalogStatus === 'active'}
          className={catalogStatus === 'active' ? 'is-active' : ''}
          onClick={() => setCatalogStatus('active')}
        >
          Active {categoryFilter === 'products' ? 'Products' : 'Reagents'}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={catalogStatus === 'deactivated'}
          className={catalogStatus === 'deactivated' ? 'is-active' : ''}
          onClick={() => setCatalogStatus('deactivated')}
        >
          Deactivated {categoryFilter === 'products' ? 'Products' : 'Reagents'}
        </button>
      </div>

      {/* Category Pills Filter */}
      <div className="admin-category-pills">
        <button 
          className={`category-pill ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('All')}
        >
          All ({products.length})
        </button>
        {matchedCategories.map(cat => {
          const count = products.filter(p => p.category_external_id === cat.id).length;
          return (
            <button 
              key={cat.id}
              className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name} ({count})
            </button>
          );
        })}
        <button 
          className={`category-pill ${selectedCategory === 'uncategorized' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('uncategorized')}
        >
          Uncategorized ({products.filter(p => !p.category_external_id || !matchedCategories.map(c => c.id).includes(p.category_external_id)).length})
        </button>
      </div>

      {successMsg && <div className="admin-alert success">{successMsg}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      {loading ? (
        <div className="admin-empty-table">Loading...</div>
      ) : groupedData.length === 0 ? (
        <div className="admin-empty-table">No items found.</div>
      ) : (
        <div className="admin-grouped-products">
          {groupedData.map((groupObj) => {
            const cat = groupObj.category;
            const subGroups = groupObj.subgroups;
            const catalogId = cat.category_id;
            const isCollapsed = collapsedCatalogs.has(catalogId);
            
            if (selectedCategory === 'All' && groupObj.totalCount === 0) {
              return null;
            }

            return (
              <div key={catalogId} className={`admin-category-group ${isCollapsed ? 'is-collapsed' : ''}`}>
                <h3 className="admin-category-title">
                  <button
                    className="admin-category-toggle"
                    type="button"
                    aria-expanded={!isCollapsed}
                    aria-controls={`catalog-panel-${catalogId}`}
                    onClick={() => toggleCatalogCollapse(catalogId)}
                  >
                    <span className="admin-category-toggle-icon" aria-hidden="true">
                      {isCollapsed ? '+' : '-'}
                    </span>
                    <span>{cat.category_name}</span>
                  </button>
                  <span className="admin-category-title-actions">
                    {catalogId !== 'uncategorized' && (
                      <button
                        type="button"
                        className="admin-action-btn edit"
                        onClick={() => setEditingCatalogGroup({
                          group: null,
                          category: matchedCategories.find((item) => item.id === catalogId),
                        })}
                      >
                        + Add Group
                      </button>
                    )}
                    <span className="admin-category-badge">{groupObj.totalCount} items</span>
                  </span>
                </h3>

                {!isCollapsed && (
                  <div id={`catalog-panel-${catalogId}`} className="admin-category-panel">
                    {Object.keys(subGroups).length === 0 ? (
                      <div className="admin-empty-table" style={{ minHeight: '80px', background: '#fcfdfd' }}>
                        No items in this category.
                      </div>
                    ) : (
                      Object.keys(subGroups).map((subGroupName) => {
                        const productsList = subGroups[subGroupName];
                        const category = matchedCategories.find((item) => item.id === catalogId);
                        const catalogGroup = category?.groups?.find((item) => item.group_name === subGroupName);
                        const sortKey = getSubgroupSortKey(catalogId, subGroupName);
                        const sortConfig = getSubgroupSort(sortKey);
                        const sortedProductsList = sortSubgroupProducts(productsList, sortConfig);
                        return (
                          <div key={subGroupName} className="admin-subgroup-group">
                        <h4 className="admin-subgroup-title">
                          <span className="admin-subgroup-identity">
                            <span>{subGroupName || 'General'} ({productsList.length})</span>
                            {catalogGroup?.external_id && (
                              <code className="admin-subgroup-external-id">External ID: {catalogGroup.external_id}</code>
                            )}
                          </span>
                          {catalogGroup && (
                            <button
                              type="button"
                              className="admin-action-btn edit"
                              onClick={() => setEditingCatalogGroup({ group: catalogGroup, category })}
                            >
                              Edit Group
                            </button>
                          )}
                        </h4>
                        <div className="admin-data-table-wrap">
                          <table className="admin-data-table">
                            <thead>
                              <tr>
                                <SortableHeader label="Name" field="product_name" sortKey={sortKey} sortConfig={sortConfig} />
                                <SortableHeader label="External ID" field="external_id" sortKey={sortKey} sortConfig={sortConfig} />
                                <th>Public URL</th>
                                <SortableHeader label="Catalog #" field="catalog_number" sortKey={sortKey} sortConfig={sortConfig} />
                                <SortableHeader label="Price" field="price" sortKey={sortKey} sortConfig={sortConfig} />
                                {catalogStatus === 'deactivated' && <th>Status</th>}
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedProductsList.map((product) => {
                                const pId = product.id || product.product_id;
                                return (
                                  <tr key={pId}>
                                    <td>
                                      <div className="admin-product-cell">
                                        {product.image_url && (
                                          <img 
                                            src={formatAssetUrl(product.image_url)} 
                                            alt="" 
                                            className="admin-thumb" 
                                          />
                                        )}
                                        <span style={{ fontWeight: 500 }}>{product.product_name}</span>
                                      </div>
                                    </td>
                                    <td><code>{product.external_id}</code></td>
                                    <td>
                                      <PublicDetailLink identifier={product.external_id || product.catalog_number} />
                                    </td>
                                    <td>{product.catalog_number || '—'}</td>
                                    <td>{product.list_price || '—'}</td>
                                    {catalogStatus === 'deactivated' && (
                                      <td>
                                        <span className="admin-badge badge-muted">Deactivated</span>
                                      </td>
                                    )}
                                    <td>
                                      <div className="admin-row-actions">
                                        {catalogStatus !== 'deactivated' && (
                                          <>
                                        <button
                                          type="button"
                                          className="admin-action-btn"
                                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFeatured(pId, product.is_featured); }}
                                          title={product.is_featured ? "Remove from Featured" : "Mark as Featured"}
                                          style={{
                                            background: product.is_featured ? 'var(--blue)' : '#f1f5f9',
                                            color: product.is_featured ? '#fff' : 'var(--ink-light)',
                                            border: '1px solid ' + (product.is_featured ? 'var(--blue)' : '#cbd5e1'),
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            marginRight: '4px'
                                          }}
                                        >
                                          ★
                                        </button>
                                        <button
                                          type="button"
                                          className="admin-action-btn admin-homepage-action-btn"
                                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleShowOnScreen(pId, product.show_on_screen); }}
                                          title="Display on homepage"
                                          aria-label="Display on homepage"
                                          style={{
                                            background: product.show_on_screen ? 'var(--blue)' : '#f1f5f9',
                                            color: product.show_on_screen ? '#fff' : 'var(--ink-light)',
                                            border: '1px solid ' + (product.show_on_screen ? 'var(--blue)' : '#cbd5e1'),
                                            minWidth: '34px',
                                            width: '34px',
                                            height: '30px',
                                            padding: '0',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            marginRight: '4px'
                                          }}
                                        >
                                          <FilledHomeIcon />
                                        </button>
                                          </>
                                        )}
                                        <button type="button" className="admin-action-btn edit" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(pId); }}>Edit</button>
                                        {product.hidden ? (
                                          <button type="button" className="admin-action-btn edit" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleActivate(pId); }}>Activate</button>
                                        ) : (
                                          <button
                                            type="button"
                                            className="admin-action-btn delete admin-deactivate-action-btn"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeactivate(pId); }}
                                            title="Deactivate"
                                            aria-label="Deactivate"
                                          >
                                            <DeactivateIcon />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editingCatalogGroup?.category && (
        <CatalogGroupEditorModal
          group={editingCatalogGroup.group}
          category={editingCatalogGroup.category}
          itemType={currentProductType}
          onClose={() => setEditingCatalogGroup(null)}
          onSaved={(savedGroup) => {
            setEditingCatalogGroup(null);
            showSuccess(`${currentProductType === 'reagent' ? 'Reagent' : 'Product'} group ${savedGroup.group_name} saved.`);
            loadProducts();
          }}
        />
      )}

      {isModalOpen && editingProduct && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{(editingProduct.product_id || editingProduct.id) ? 'Edit Product' : 'Create Product'}</h3>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="admin-modal-body">
              <div className="admin-form-grid admin-catalog-editor-grid">
                <label className="admin-form-field span-2">
                  <span>Product Name *</span>
                  <input type="text" value={editingProduct.product_name || ''} onChange={(e) => updateField('product_name', e.target.value)} required />
                </label>
                <label className="admin-form-field">
                  <span>External ID *</span>
                  <input type="text" value={editingProduct.external_id || ''} onChange={(e) => updateField('external_id', e.target.value)} required />
                </label>
                <label className="admin-form-field">
                  <span>Catalog Number</span>
                  <input type="text" value={editingProduct.catalog_number || ''} onChange={(e) => updateField('catalog_number', e.target.value)} />
                </label>
                <CatalogNumberDisplayToggle
                  checked={editingProduct.show_catalog_number !== false}
                  onChange={(checked) => updateField('show_catalog_number', checked)}
                />
                <label className="admin-form-field">
                  <span>Category *</span>
                  <select 
                    value={editingProduct.category_external_id || ''} 
                    onChange={(e) => setEditingProduct((current) => ({
                      ...current,
                      category_external_id: e.target.value,
                      catalog_group_id: null,
                      product_group: '',
                    }))}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {matchedCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.id})
                      </option>
                    ))}
                    <option value="uncategorized">Uncategorized / Custom</option>
                  </select>
                </label>
                <label className="admin-form-field">
                  <span>Product Group (Subcategory)</span>
                  <select
                    value={editingProduct.catalog_group_id || ''}
                    onChange={(e) => {
                      const group = availableProductGroups.find((item) => String(item.group_id) === e.target.value);
                      setEditingProduct((current) => ({
                        ...current,
                        catalog_group_id: group?.group_id || null,
                        product_group: group?.group_name || '',
                      }));
                    }}
                    disabled={!editingProduct.category_external_id}
                  >
                    <option value="">-- No Group --</option>
                    {availableProductGroups.map((group) => (
                      <option key={group.group_id} value={group.group_id}>{group.group_name}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-form-field">
                  <span>List Price</span>
                  <input type="text" value={editingProduct.list_price || ''} onChange={(e) => updateField('list_price', e.target.value)} />
                </label>
                <label className="admin-form-field">
                  <span>Discounted Price</span>
                  <input
                    type="text"
                    value={editingProduct.discounted_price || ''}
                    onChange={(e) => updateField('discounted_price', e.target.value)}
                    placeholder="Must not exceed List Price"
                  />
                </label>
                <div className="admin-form-field span-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontWeight: '500', color: 'var(--ink)' }}>Main Image</span>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {editingProduct.image_url ? (
                      <div className="admin-image-preview-wrapper" style={{ position: 'relative', width: '100px', height: '100px', border: '1px solid var(--line)', borderRadius: '6px', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                          src={formatAssetUrl(editingProduct.image_url)} 
                          alt="Main Preview" 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                        <button
                          type="button"
                          onClick={() => updateField('image_url', '')}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(244, 67, 54, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: '100px', height: '100px', border: '1px dashed var(--line)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '12px', background: '#fcfdfd', textAlign: 'center', padding: '5px' }}>
                        No Image
                      </div>
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input 
                        type="text" 
                        placeholder="Image URL or Path (e.g. media/product_images/...)" 
                        value={editingProduct.image_url || ''} 
                        onChange={(e) => updateField('image_url', e.target.value)} 
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: '6px' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label className="secondary-admin-button" style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer', margin: 0, display: 'inline-block' }}>
                          Upload File
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(e, 'image_url')} 
                            style={{ display: 'none' }}
                          />
                        </label>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>or type route above</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="admin-form-field span-3" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '15px', marginTop: '10px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--ink)' }}>Additional Gallery Images</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px', marginTop: '5px' }}>
                    {(editingProduct.images || []).map((imgUrl, idx) => (
                      <div key={idx} className="admin-image-preview-wrapper" style={{ position: 'relative', height: '150px', border: '1px solid var(--line)', borderRadius: '6px', overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column', padding: '5px', gap: '5px' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minHeight: '80px', position: 'relative' }}>
                          {imgUrl ? (
                            <img 
                              src={formatAssetUrl(imgUrl)} 
                              alt={`Preview ${idx + 1}`} 
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Empty Path</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={imgUrl || ''}
                          onChange={(e) => {
                            const newImages = [...(editingProduct.images || [])];
                            newImages[idx] = e.target.value;
                            updateField('images', newImages);
                          }}
                          placeholder="Image path"
                          style={{ fontSize: '11px', padding: '4px', width: '100%', border: '1px solid var(--line)', borderRadius: '4px' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = (editingProduct.images || []).filter((_, i) => i !== idx);
                            updateField('images', newImages);
                          }}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(244, 67, 54, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    {/* Add Image Option Card */}
                    <div style={{ height: '150px', border: '1px dashed var(--line)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#fcfdfd', padding: '10px' }}>
                      <button 
                        type="button" 
                        className="secondary-admin-button" 
                        onClick={() => {
                          const newImages = [...(editingProduct.images || []), ''];
                          updateField('images', newImages);
                        }}
                        style={{ fontSize: '12px', padding: '6px 10px', width: '100%' }}
                      >
                        + Add Path
                      </button>
                      <label className="primary-button" style={{ fontSize: '12px', padding: '6px 10px', width: '100%', textAlign: 'center', cursor: 'pointer', display: 'inline-block', margin: 0 }}>
                        + Upload File
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageUpload(e, 'images')} 
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <CatalogVideoEditor
                  videos={editingProduct.videos || []}
                  onChange={(videos) => updateField('videos', videos)}
                  onUpload={handleVideoUpload}
                  itemLabel={categoryFilter === 'products' ? 'Product' : 'Reagent'}
                />

                <div className="admin-form-field span-3" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '15px', marginTop: '10px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--ink)' }}>Product Manuals (PDFs)</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', marginTop: '5px' }}>
                    {(editingProduct.manuals || []).map((man, idx) => (
                      <div key={idx} style={{ position: 'relative', border: '1px solid var(--line)', borderRadius: '6px', padding: '10px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                          type="text"
                          value={man.name || ''}
                          onChange={(e) => {
                            const newManuals = [...(editingProduct.manuals || [])];
                            newManuals[idx] = { ...newManuals[idx], name: e.target.value };
                            updateField('manuals', newManuals);
                          }}
                          placeholder="Manual Name (e.g. Protocol Guide)"
                          style={{ fontSize: '12px', padding: '6px', border: '1px solid var(--line)', borderRadius: '4px' }}
                        />
                        <input
                          type="text"
                          value={man.manual || ''}
                          onChange={(e) => {
                            const newManuals = [...(editingProduct.manuals || [])];
                            newManuals[idx] = { ...newManuals[idx], manual: e.target.value };
                            updateField('manuals', newManuals);
                          }}
                          placeholder="File Path (e.g. manual_files/...)"
                          style={{ fontSize: '12px', padding: '6px', border: '1px solid var(--line)', borderRadius: '4px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                          <label className="secondary-admin-button" style={{ fontSize: '11px', padding: '4px 8px', cursor: 'pointer', margin: 0, display: 'inline-block' }}>
                            Upload PDF
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => handleManualUpload(e, idx)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newManuals = (editingProduct.manuals || []).filter((_, i) => i !== idx);
                            updateField('manuals', newManuals);
                          }}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(244, 67, 54, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                          title="Remove manual"
                        >
                          x
                        </button>
                      </div>
                    ))}
                    
                    <div style={{ minHeight: '110px', border: '1px dashed var(--line)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#fcfdfd', padding: '10px' }}>
                      <button
                        type="button"
                        className="secondary-admin-button"
                        onClick={() => {
                          const newManuals = [...(editingProduct.manuals || []), { name: '', manual: '' }];
                          updateField('manuals', newManuals);
                        }}
                        style={{ fontSize: '12px', padding: '6px 10px', width: '100%' }}
                      >
                        + Add Manual
                      </button>
                    </div>
                  </div>
                </div>

                <div className="admin-form-field span-3">
                  <span>{categoryFilter === 'products' ? 'Product Detail' : 'Reagent Detail'}</span>
                  <ProductContentEditor ref={productContentEditorRef} value={editingProduct.content_text || ''} onChange={(value) => updateField('content_text', value)} />
                </div>
                <label className="admin-form-field span-3">
                  <span>Description</span>
                  <textarea rows="4" value={editingProduct.description || ''} onChange={(e) => updateField('description', e.target.value)} />
                </label>
                <label className="admin-form-field span-3">
                  <span>Key Features</span>
                  <textarea
                    rows="5"
                    value={formatKeyFeaturesForEdit(editingProduct.key_features)}
                    onChange={(e) => updateKeyFeatures(e.target.value)}
                    placeholder="Enter one key feature per line"
                  />
                </label>
                <label className="admin-form-field span-3">
                  <span>Storage &amp; Stability</span>
                  <textarea rows="4" value={editingProduct.storage_stability || ''} onChange={(e) => updateField('storage_stability', e.target.value)} />
                </label>
                <div className="admin-form-field span-3">
                  <span>Performance Data</span>
                  <ProductContentEditor
                    ref={performanceDataEditorRef}
                    value={editingProduct.performance_data || ''}
                    onChange={(value) => updateField('performance_data', value)}
                    ariaLabel={`${categoryFilter === 'products' ? 'Product' : 'Reagent'} performance data`}
                  />
                </div>
                <label className="admin-form-field">
                  <span>Availability</span>
                  <input type="text" value={editingProduct.availability || ''} onChange={(e) => updateField('availability', e.target.value)} />
                </label>
                <label className="admin-form-field">
                  <span>Source Type</span>
                  <input type="text" value={editingProduct.source_type || ''} onChange={(e) => updateField('source_type', e.target.value)} />
                </label>
                <label className="admin-form-field">
                  <span>Display Order</span>
                  <input type="number" value={editingProduct.display_order || ''} onChange={(e) => updateField('display_order', e.target.value ? parseInt(e.target.value) : null)} />
                </label>
              </div>
              <div className="admin-form-toggles">
                <label className="admin-toggle">
                  <input type="checkbox" checked={!!editingProduct.hidden} onChange={(e) => updateField('hidden', e.target.checked)} />
                  <span>Deactivated</span>
                </label>
                <label className="admin-toggle">
                  <input type="checkbox" checked={!!editingProduct.is_featured} onChange={(e) => updateField('is_featured', e.target.checked)} />
                  <span>Featured</span>
                </label>
                <label className="admin-toggle">
                  <input type="checkbox" checked={!!editingProduct.show_on_screen} onChange={(e) => updateField('show_on_screen', e.target.checked)} />
                  <span>Display on homepage</span>
                </label>
                <label className="admin-toggle">
                  <input type="checkbox" checked={!!editingProduct.quote_only} onChange={(e) => updateField('quote_only', e.target.checked)} />
                  <span>Quote Only</span>
                </label>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="secondary-admin-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? 'Saving...' : ((editingProduct.product_id || editingProduct.id) ? 'Update Product' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCatalogModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsCatalogModalOpen(false)}>
          <div className="admin-modal admin-modal-lg admin-catalog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Edit Catalog</h3>
              <button className="admin-modal-close" onClick={() => setIsCatalogModalOpen(false)}>×</button>
            </div>
            <div className="admin-modal-body">
              {error && <div className="admin-alert error" role="alert">{error}</div>}
              <div className="admin-catalog-toolbar">
                <button type="button" className="primary-button" onClick={addCatalogRow}>+ Add Catalog</button>
              </div>
              <div className="admin-data-table-wrap">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Priority</th>
                      <th>Catalog Name</th>
                      <th>External ID</th>
                      <th>Popular</th>
                      <th>Homepage Image</th>
                      <th>Groups</th>
                      <th>Products</th>
                      <th>Reorder</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalogRows.map((row, index) => (
                      <tr
                        key={row.category_id || row.temp_id || row.external_id || index}
                        className={draggedCatalogIndex === index ? 'is-dragging' : undefined}
                        draggable
                        onDragStart={(event) => handleCatalogDragStart(event, index)}
                        onDragOver={handleCatalogDragOver}
                        onDrop={(event) => handleCatalogDrop(event, index)}
                        onDragEnd={() => setDraggedCatalogIndex(null)}
                      >
                        <td><span className="admin-drag-handle" aria-hidden="true">::</span> {index + 1}</td>
                        <td>
                          <input
                            className="admin-table-input"
                            type="text"
                            value={row.category_name || ''}
                            onChange={(e) => updateCatalogRow(index, 'category_name', e.target.value)}
                            placeholder="Catalog name"
                          />
                        </td>
                        <td><code>{row.external_id || 'Auto-generated on save'}</code></td>
                        <td>
                          <label className="admin-toggle" style={{ justifyContent: 'center' }}>
                            <input
                              type="checkbox"
                              checked={!!row.show_on_homepage}
                              onChange={(e) => updateCatalogRow(index, 'show_on_homepage', e.target.checked)}
                              aria-label={`Display ${row.category_name || 'category'} on homepage`}
                            />
                            <span>Show</span>
                          </label>
                        </td>
                        <td>
                          <div className="admin-catalog-image-editor">
                            <div className="admin-catalog-image-thumbnail">
                              {row.homepage_image ? (
                                <img src={formatAssetUrl(row.homepage_image)} alt={`${row.category_name || 'Category'} homepage`} />
                              ) : (
                                <span>No image</span>
                              )}
                            </div>
                            <div className="admin-catalog-image-actions">
                              <label className="admin-action-btn edit">
                                {catalogImageUploading[index]
                                  ? 'Uploading...'
                                  : row.homepage_image ? 'Replace' : 'Upload'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={!!catalogImageUploading[index]}
                                  onChange={(event) => handleCatalogImageUpload(event, index)}
                                />
                              </label>
                              {row.homepage_image && (
                                <button
                                  type="button"
                                  className="admin-action-btn delete"
                                  onClick={() => updateCatalogRow(index, 'homepage_image', '')}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="admin-catalog-group-actions">
                            {(row.groups || []).map((group) => (
                              <button
                                key={group.group_id}
                                type="button"
                                className="admin-action-btn edit admin-catalog-group-edit-button"
                                onClick={() => {
                                  setEditingCatalogGroup({
                                    group,
                                    category: {
                                      ...row,
                                      id: row.external_id,
                                      name: row.category_name,
                                    },
                                  });
                                  setIsCatalogModalOpen(false);
                                }}
                                title={`Edit ${group.group_name}`}
                              >
                                <span>{group.group_name}</span>
                                <code>{group.external_id}</code>
                              </button>
                            ))}
                            {!row.isNew && row.category_id && (
                              <button
                                type="button"
                                className="admin-action-btn admin-catalog-group-add-button"
                                onClick={() => {
                                  setEditingCatalogGroup({
                                    group: null,
                                    category: {
                                      ...row,
                                      id: row.external_id,
                                      name: row.category_name,
                                    },
                                  });
                                  setIsCatalogModalOpen(false);
                                }}
                              >
                                + Add Group
                              </button>
                            )}
                            {(row.groups || []).length === 0 && (row.isNew || !row.category_id) && (
                              <span className="admin-catalog-groups-empty">Save category first</span>
                            )}
                          </div>
                        </td>
                        <td>{row.product_count || 0}</td>
                        <td>
                          <div className="admin-row-actions">
                            <button className="admin-action-btn edit" type="button" disabled={index === 0} onClick={() => moveCatalogRow(index, -1)}>Up</button>
                            <button className="admin-action-btn edit" type="button" disabled={index === catalogRows.length - 1} onClick={() => moveCatalogRow(index, 1)}>Down</button>
                          </div>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              className="admin-action-btn edit"
                              type="button"
                              disabled={row.isNew || !row.category_id}
                              title={row.isNew ? 'Save this category before editing its summary.' : 'Edit category'}
                              onClick={() => {
                                setEditingCategory(row);
                                setIsCatalogModalOpen(false);
                              }}
                            >
                              Edit
                            </button>
                            <button className="admin-action-btn delete" type="button" onClick={() => deleteCatalogRow(index)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="secondary-admin-button" onClick={() => setIsCatalogModalOpen(false)}>Cancel</button>
              <button type="button" className="primary-button" disabled={catalogSaving} onClick={saveCatalogRows}>
                {catalogSaving ? 'Saving...' : 'Save Catalog'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminProducts;
