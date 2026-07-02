import { formatAssetUrl } from './api';

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const hasHtmlTags = (value) => /<\/?[a-z][\s\S]*>/i.test(value);

const hasMarkdownSyntax = (value) => /(\*\*|__|!\[[^\]]*]\(|\[[^\]]+]\([^)]+\)|(?:^|\s)-\s+(?:\*\*)?[A-Za-z0-9]|(?:^|\s)#{1,4}\s*|\s---\s|^\s*\|?.+\|.+(?:\n|\r\n?)\s*\|?\s*:?-{3,}|^\s*\|?[^|\n]+(?:\|[^|\n]+){2,}\|?\s*$)/m.test(value);

const decodeHtmlEntities = (value) => String(value)
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

const htmlToRichTextSource = (value) => decodeHtmlEntities(value)
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<li[^>]*>/gi, '\n- ')
  .replace(/<\/li>/gi, '\n')
  .replace(/<h1[^>]*>/gi, '\n\n# ')
  .replace(/<h2[^>]*>/gi, '\n\n## ')
  .replace(/<h3[^>]*>/gi, '\n\n### ')
  .replace(/<h4[^>]*>/gi, '\n\n#### ')
  .replace(/<\/(?:p|div|section|article|blockquote|h[1-6]|ul|ol|table|tr)>/gi, '\n\n')
  .replace(/<[^>]+>/g, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const toSafeHref = (value) => {
  const href = String(value || '').trim();

  if (!href || href.startsWith('//')) return '#';
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  if (/^(\/(?!\/)|#|[./\w-])/i.test(href) && !/^[a-z][a-z\d+.-]*:/i.test(href)) {
    return href;
  }

  return '#';
};

const formatInlineMarkdown = (value) => {
  const codeBlocks = [];
  const codeToken = (index) => `@@CODE_${index}@@`;

  let output = escapeHtml(value).replace(/`([^`]+)`/g, (_, code) => {
    const index = codeBlocks.push(`<code>${code}</code>`) - 1;
    return codeToken(index);
  });

  output = output
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_, alt, url) => {
      const href = escapeHtml(formatAssetUrl(url));
      return `<img src="${href}" alt="${alt}" />`;
    })
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_, label, url) => {
      const href = escapeHtml(toSafeHref(url));
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    })
    .replace(/(\*\*|__)(.+?)\1/g, '<strong>$2</strong>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/(^|[\s([])(\*|_)([^*_]+?)\2(?=[\s).,!?:;]|$)/g, '$1<em>$3</em>');

  codeBlocks.forEach((code, index) => {
    output = output.replace(codeToken(index), code);
  });

  return output;
};

const formatListBlock = (lines, tagName) => {
  const itemPattern = tagName === 'ol' ? /^\s*\d+[.)]\s+/ : /^\s*[-*+]\s+/;
  const items = lines
    .map((line) => line.replace(itemPattern, '').trim())
    .filter(Boolean)
    .map((item) => `<li>${formatInlineMarkdown(item)}</li>`)
    .join('');

  return `<${tagName}>${items}</${tagName}>`;
};

const normalizeInlineListMarkers = (value) => {
  let lastInlineListOffset = -1;

  return value.replace(
    /\s+-\s+(?=(?:\*\*)?[A-Za-z0-9])/g,
    (match, offset, source) => {
      const beforeMarker = source.slice(0, offset).trimEnd();
      const isContinuingInlineList = lastInlineListOffset >= 0 &&
        !/\n{2,}/.test(source.slice(lastInlineListOffset, offset));
      const previousChar = beforeMarker.at(-1) || '';

      if (!isContinuingInlineList && !/[:;.!?)]/.test(previousChar)) {
        return match;
      }

      lastInlineListOffset = offset;
      return isContinuingInlineList ? '\n- ' : '\n\n- ';
    }
  );
};

const normalizeMarkdownImageBlocks = (value) => value.replace(
  /\s*(!\[[^\]]*]\([^)]+\))\s*/g,
  '\n\n$1\n\n'
);

const normalizeInlineMarkdownStructure = (value) => String(value)
  .replace(/\s+-\s+(?=\*\*[^*]+\*\*)/g, '\n- ')
  .replace(/\s+---\s+/g, '\n\n---\n\n')
  .replace(/(^|\s)(#{1,4})\s+/g, (_, lead, hashes) => (
    `${lead ? '\n\n' : ''}${hashes} `
  ))
  .replace(/(#{1,4}\s+[^#\n-]+?)\s+(?=-\s+(?:\*\*)?[A-Za-z0-9])/g, '$1\n\n')
  .replace(/(#{1,4}\s+Montgomery County[’']s Life Sciences Hub)\s+(Montgomery County[—–-])/g, '$1\n\n$2')
  .replace(/([.!?])\s+(?=We(?:’|'| a)re\b)/g, '$1\n\n')
  .replace(/(\*\*[^*]+\*\*\s+[—-]\s+[^\n]+?)\s+(?=(This event|This article|This post|We(?:’|'| a)re)\b)/g, '$1\n\n');

const splitTableRow = (line) => line
  .trim()
  .replace(/^\|/, '')
  .replace(/\|$/, '')
  .split('|')
  .map((cell) => cell.trim());

const isTableDivider = (line) => splitTableRow(line)
  .every((cell) => /^:?-{3,}:?$/.test(cell));

const isTableLine = (line) => {
  const cells = splitTableRow(line);
  return cells.length > 1 && cells.some(Boolean);
};

const normalizeMarkdownTableBlocks = (value) => {
  const lines = String(value).replace(/\r\n?/g, '\n').split('\n');

  return lines
    .filter((line, index) => {
      const trimmedLine = line.trim();
      const previousTableLine = lines
        .slice(0, index)
        .reverse()
        .find((candidate) => candidate.trim() && !/^\|\s*$/.test(candidate.trim()));
      const nextTableLine = lines
        .slice(index + 1)
        .find((candidate) => candidate.trim() && !/^\|\s*$/.test(candidate.trim()));

      if (/^\|\s*$/.test(trimmedLine)) {
        return !(isTableLine(previousTableLine || '') && isTableLine(nextTableLine || ''));
      }

      if (trimmedLine) return true;

      const previousLine = previousTableLine || '';
      const nextLine = nextTableLine || '';
      return !(isTableLine(previousLine) && isTableLine(nextLine));
    })
    .join('\n');
};

const compactLooseMarkdownTables = (value) => {
  const lines = String(value).replace(/\r\n?/g, '\n').split('\n');
  const output = [];
  let tableRows = [];

  const flushTableRows = () => {
    if (!tableRows.length) return;

    if (tableRows.length > 1) {
      output.push(tableRows.join('\n'));
    } else {
      output.push(tableRows[0]);
    }
    tableRows = [];
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (isTableLine(trimmedLine) && !/^\|\s*$/.test(trimmedLine)) {
      tableRows.push(line);
      return;
    }

    if (!trimmedLine || /^\|\s*$/.test(trimmedLine)) {
      if (tableRows.length) {
        return;
      }
      output.push(line);
      return;
    }

    flushTableRows();
    output.push(line);
  });

  flushTableRows();
  return output.join('\n');
};

const formatTableBlock = (lines) => {
  const rows = lines
    .filter((line) => !isTableDivider(line))
    .map(splitTableRow)
    .filter((cells) => cells.length > 1);

  if (!rows.length) return '';

  const columnCount = Math.max(...rows.map((cells) => cells.length));
  const normalizeRow = (cells) => Array.from(
    { length: columnCount },
    (_, index) => cells[index] || ''
  );
  const [headRow, ...bodyRows] = rows.map(normalizeRow);
  const renderCell = (tagName, cell) => `<${tagName}>${formatInlineMarkdown(cell)}</${tagName}>`;
  const header = `<thead><tr>${headRow.map((cell) => renderCell('th', cell)).join('')}</tr></thead>`;
  const body = bodyRows.length
    ? `<tbody>${bodyRows.map((row) => `<tr>${row.map((cell) => renderCell('td', cell)).join('')}</tr>`).join('')}</tbody>`
    : '';

  return `<div class="rich-table-wrap"><table>${header}${body}</table></div>`;
};

const formatBlock = (block) => {
  const lines = block.split('\n').map((line) => line.trimEnd()).filter(Boolean);
  const text = lines.join('\n').trim();
  const headingLinePattern = /^\s{0,3}(#{1,4})\s*(.+)$/;
  const firstUnorderedListIndex = lines.findIndex((line) => /^\s*[-*+]\s+/.test(line));
  const firstOrderedListIndex = lines.findIndex((line) => /^\s*\d+[.)]\s+/.test(line));

  if (!text) return '';
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(text)) return '<hr />';

  if (lines.every(isTableLine)) {
    return formatTableBlock(lines);
  }

  if (lines.length > 1 && lines.some((line) => headingLinePattern.test(line))) {
    const blocks = [];
    let currentBlock = [];

    lines.forEach((line) => {
      if (headingLinePattern.test(line)) {
        if (currentBlock.length) {
          blocks.push(currentBlock.join('\n'));
          currentBlock = [];
        }
        blocks.push(line);
      } else {
        currentBlock.push(line);
      }
    });

    if (currentBlock.length) {
      blocks.push(currentBlock.join('\n'));
    }

    return blocks.map(formatBlock).join('');
  }

  const heading = text.match(headingLinePattern);
  if (heading) {
    const level = heading[1].length;
    return `<h${level}>${formatInlineMarkdown(heading[2].trim())}</h${level}>`;
  }

  if (
    firstUnorderedListIndex > 0 &&
    lines.slice(firstUnorderedListIndex).every((line) => /^\s*[-*+]\s+/.test(line))
  ) {
    return `${formatBlock(lines.slice(0, firstUnorderedListIndex).join('\n'))}${formatListBlock(lines.slice(firstUnorderedListIndex), 'ul')}`;
  }

  if (
    firstOrderedListIndex > 0 &&
    lines.slice(firstOrderedListIndex).every((line) => /^\s*\d+[.)]\s+/.test(line))
  ) {
    return `${formatBlock(lines.slice(0, firstOrderedListIndex).join('\n'))}${formatListBlock(lines.slice(firstOrderedListIndex), 'ol')}`;
  }

  if (lines.every((line) => /^\s*[-*+]\s+/.test(line))) {
    return formatListBlock(lines, 'ul');
  }

  if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
    return formatListBlock(lines, 'ol');
  }

  if (lines.every((line) => /^\s*>\s?/.test(line))) {
    const quote = lines.map((line) => line.replace(/^\s*>\s?/, '')).join('\n');
    return `<blockquote>${formatInlineMarkdown(quote).replace(/\n/g, '<br />')}</blockquote>`;
  }

  return `<p>${formatInlineMarkdown(text).replace(/\n/g, '<br />')}</p>`;
};

export const formatRichText = (value) => {
  if (!value) return '';

  const content = String(value).trim();
  if (!content) return '';
  if (hasHtmlTags(content) && !hasMarkdownSyntax(content)) return content;

  const source = hasHtmlTags(content) ? htmlToRichTextSource(content) : content;

  return normalizeMarkdownImageBlocks(normalizeInlineListMarkers(normalizeInlineMarkdownStructure(compactLooseMarkdownTables(normalizeMarkdownTableBlocks(source)))))
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map(formatBlock)
    .filter(Boolean)
    .join('');
};
