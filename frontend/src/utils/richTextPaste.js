const WORD_HTML_PATTERN = /(?:class\s*=\s*["'][^"']*\bMso|\bmso-|urn:schemas-microsoft-com:office|<o:p\b|<!--\s*\[if\s+(?:gte\s+)?mso)/i;

const ALLOWED_TAGS = new Set([
  'A', 'BLOCKQUOTE', 'BR', 'COL', 'COLGROUP', 'DIV', 'EM', 'H1', 'H2', 'H3', 'H4',
  'HR', 'IMG', 'LI', 'OL', 'P', 'S', 'STRONG', 'TABLE', 'TBODY', 'TD', 'TFOOT',
  'TH', 'THEAD', 'TR', 'U', 'UL',
]);

const REMOVED_TAGS = new Set([
  'APPLET', 'BUTTON', 'EMBED', 'FORM', 'IFRAME', 'INPUT', 'LINK', 'META', 'OBJECT',
  'SCRIPT', 'SELECT', 'STYLE', 'TEXTAREA', 'TITLE', 'XML',
]);

const INLINE_STYLE_TAGS = new Set([
  'DIV', 'FONT', 'H1', 'H2', 'H3', 'H4', 'LI', 'P', 'SPAN',
]);

export const isMicrosoftOfficeHtml = (value) => WORD_HTML_PATTERN.test(String(value || ''));

const replaceTag = (documentNode, element, tagName) => {
  const replacement = documentNode.createElement(tagName);
  Array.from(element.attributes).forEach((attribute) => {
    replacement.setAttribute(attribute.name, attribute.value);
  });
  while (element.firstChild) replacement.appendChild(element.firstChild);
  element.replaceWith(replacement);
  return replacement;
};

const unwrapElement = (element) => {
  const parent = element.parentNode;
  if (!parent) return;
  while (element.firstChild) parent.insertBefore(element.firstChild, element);
  element.remove();
};

const removeComments = (documentNode, root) => {
  const walker = documentNode.createTreeWalker(root, 128);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((comment) => comment.remove());
};

const firstTextNode = (documentNode, element) => {
  const walker = documentNode.createTreeWalker(element, 4);
  return walker.nextNode() ? walker.currentNode : null;
};

const trimLeadingListWhitespace = (documentNode, element) => {
  const textNode = firstTextNode(documentNode, element);
  if (!textNode) return;
  textNode.data = textNode.data.replace(/^[\s\u00a0]+/, '');
  if (!textNode.data) textNode.remove();
};

const convertWordHeadings = (documentNode, root) => {
  root.querySelectorAll('p, div').forEach((element) => {
    const className = element.getAttribute('class') || '';
    let headingTag = '';

    if (/\bMsoTitle\b/i.test(className)) headingTag = 'h1';
    else if (/\bMsoHeading1\b/i.test(className)) headingTag = 'h2';
    else if (/\bMsoHeading2\b/i.test(className)) headingTag = 'h3';
    else if (/\bMsoHeading[3-9]\b/i.test(className)) headingTag = 'h4';

    if (headingTag) replaceTag(documentNode, element, headingTag);
  });
};

const convertWordLists = (documentNode, root) => {
  const listParagraphs = Array.from(root.querySelectorAll('p, div')).filter((element) => {
    const className = element.getAttribute('class') || '';
    const style = element.getAttribute('style') || '';
    return /\bMsoListParagraph/i.test(className) || /(?:^|;)\s*mso-list\s*:/i.test(style);
  });

  listParagraphs.forEach((paragraph) => {
    const marker = Array.from(paragraph.querySelectorAll('span')).find((span) => (
      /mso-list\s*:\s*ignore/i.test(span.getAttribute('style') || '')
    ));
    const markerText = (marker?.textContent || '').replace(/\u00a0/g, ' ').trim();
    const ordered = /^(?:\d+|[a-z]|[ivxlcdm]+)[.)]/i.test(markerText);
    const listTag = ordered ? 'ol' : 'ul';
    marker?.remove();

    let list = paragraph.previousElementSibling;
    if (list?.tagName.toLowerCase() !== listTag || list.getAttribute('data-word-list') !== 'true') {
      list = documentNode.createElement(listTag);
      list.setAttribute('data-word-list', 'true');
      paragraph.parentNode?.insertBefore(list, paragraph);
    }

    const item = documentNode.createElement('li');
    while (paragraph.firstChild) item.appendChild(paragraph.firstChild);
    trimLeadingListWhitespace(documentNode, item);
    list.appendChild(item);
    paragraph.remove();
  });
};

const preserveSupportedInlineStyles = (documentNode, root) => {
  Array.from(root.querySelectorAll('*')).forEach((element) => {
    if (!INLINE_STYLE_TAGS.has(element.tagName)) return;

    const style = element.getAttribute('style') || '';
    const wrappers = [];
    const tagName = element.tagName;
    if (/(?:font-weight|mso-bidi-font-weight)\s*:\s*(?:bold|[6-9]00)/i.test(style) && !['B', 'STRONG'].includes(tagName)) {
      wrappers.push('strong');
    }
    if (/(?:font-style|mso-bidi-font-style)\s*:\s*italic/i.test(style) && !['EM', 'I'].includes(tagName)) {
      wrappers.push('em');
    }
    if (/text-decoration(?:-line)?\s*:[^;]*\bunderline\b/i.test(style) && tagName !== 'U') {
      wrappers.push('u');
    }
    if (wrappers.length === 0 || !element.firstChild) return;

    const fragment = documentNode.createDocumentFragment();
    while (element.firstChild) fragment.appendChild(element.firstChild);
    let formattedContent = fragment;
    wrappers.forEach((wrapperTag) => {
      const wrapper = documentNode.createElement(wrapperTag);
      wrapper.appendChild(formattedContent);
      formattedContent = wrapper;
    });
    element.appendChild(formattedContent);
  });
};

const safeLinkUrl = (value) => {
  const url = String(value || '').trim();
  if (/^(?:https?:|mailto:|tel:)/i.test(url)) return url;
  if (/^(?:\/(?!\/)|#|\.\.?\/)/.test(url)) return url;
  return '';
};

const safeImageUrl = (value) => {
  const url = String(value || '').trim();
  if (/^(?:https?:|\/(?!\/)|\.\.?\/)/i.test(url)) return url;
  if (/^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(url)) return url;
  return '';
};

const sanitizeElementAttributes = (element) => {
  const tagName = element.tagName;
  const originalAttributes = Object.fromEntries(
    Array.from(element.attributes).map((attribute) => [attribute.name.toLowerCase(), attribute.value]),
  );
  Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));

  if (tagName === 'A') {
    const href = safeLinkUrl(originalAttributes.href);
    if (href) element.setAttribute('href', href);
    if (originalAttributes.title) element.setAttribute('title', originalAttributes.title);
    return;
  }

  if (tagName === 'IMG') {
    const src = safeImageUrl(originalAttributes.src);
    if (!src) {
      element.remove();
      return;
    }
    element.setAttribute('src', src);
    element.setAttribute('alt', originalAttributes.alt || 'Pasted image');
    const width = /(?:^|;)\s*width\s*:\s*((?:100|[1-9]?\d)(?:\.\d+)?%)/i.exec(originalAttributes.style || '')?.[1];
    if (width) element.setAttribute('style', `width: ${width}; height: auto;`);
    return;
  }

  if (['TD', 'TH'].includes(tagName)) {
    ['colspan', 'rowspan'].forEach((attributeName) => {
      const value = originalAttributes[attributeName];
      if (/^\d+$/.test(value || '')) element.setAttribute(attributeName, value);
    });
    return;
  }

  if (tagName === 'OL' && /^\d+$/.test(originalAttributes.start || '')) {
    element.setAttribute('start', originalAttributes.start);
  }

  if (tagName === 'DIV' && /(?:^|\s)rich-table-wrap(?:\s|$)/.test(originalAttributes.class || '')) {
    element.setAttribute('class', 'rich-table-wrap');
  }

  if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE'].includes(tagName)) {
    const alignment = /(?:^|;)\s*text-align\s*:\s*(left|center|right|justify)/i.exec(originalAttributes.style || '')?.[1];
    if (alignment) element.setAttribute('style', `text-align: ${alignment.toLowerCase()};`);
  }
};

const sanitizeStructure = (documentNode, root) => {
  Array.from(root.querySelectorAll('*')).forEach((element) => {
    const tagName = element.tagName;
    if (REMOVED_TAGS.has(tagName)) {
      element.remove();
      return;
    }

    if (tagName === 'B') {
      sanitizeElementAttributes(replaceTag(documentNode, element, 'strong'));
      return;
    }
    if (tagName === 'I') {
      sanitizeElementAttributes(replaceTag(documentNode, element, 'em'));
      return;
    }

    if (!ALLOWED_TAGS.has(tagName)) {
      unwrapElement(element);
      return;
    }

    sanitizeElementAttributes(element);
  });
};

const normalizeWordSpacing = (documentNode, root) => {
  const walker = documentNode.createTreeWalker(root, 4);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((textNode) => {
    textNode.data = textNode.data.replace(/\u00a0/g, ' ');
  });

  root.querySelectorAll('p, div, h1, h2, h3, h4, blockquote, li').forEach((element) => {
    const hasText = Boolean((element.textContent || '').trim());
    const hasEmbeddedContent = Boolean(element.querySelector('img, table, hr'));
    if (!hasText && !hasEmbeddedContent) element.remove();
  });

  root.querySelectorAll('br + br').forEach((lineBreak) => lineBreak.remove());
};

export const cleanRichTextPasteHtml = (value) => {
  const source = String(value || '');
  if (!source.trim() || typeof DOMParser === 'undefined') return source;

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(`<div data-rich-paste-root="true">${source}</div>`, 'text/html');
  const root = documentNode.body.querySelector('[data-rich-paste-root="true"]');
  if (!root) return '';

  const isWordContent = isMicrosoftOfficeHtml(source);
  removeComments(documentNode, root);
  root.querySelectorAll('script, style, meta, link, title, xml, iframe, object, embed, form').forEach((element) => element.remove());

  if (isWordContent) {
    convertWordHeadings(documentNode, root);
    convertWordLists(documentNode, root);
    root.querySelectorAll('o\\:p, o\\:smarttagtype').forEach((element) => {
      if ((element.textContent || '').replace(/\u00a0/g, ' ').trim()) unwrapElement(element);
      else element.remove();
    });
  }

  preserveSupportedInlineStyles(documentNode, root);
  sanitizeStructure(documentNode, root);
  root.querySelectorAll('[data-word-list]').forEach((list) => list.removeAttribute('data-word-list'));
  if (isWordContent) normalizeWordSpacing(documentNode, root);

  return root.innerHTML.trim();
};
