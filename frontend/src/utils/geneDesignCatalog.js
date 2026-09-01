const SELECTION_CODE_PATTERN = /^[A-Z]{2}[STLM]$/;
const STRUCTURE_CODE_PATTERN = /^[A-Z0-9]{6}$/;
const TARGET_CODE_PATTERN = /^[A-Z0-9#]{1,6}$/;
const FORMAT_CODE_PATTERN = /^[KLC]$/;

export const normalizeGeneDesignCatalogNumber = (catalogNumber) => (
  String(catalogNumber || '')
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, '')
    .toUpperCase()
);

export const parseGeneDesignCatalogNumber = (catalogNumber) => {
  const normalized = normalizeGeneDesignCatalogNumber(catalogNumber);
  const segments = normalized.split('-');
  const selectionCode = segments[0] || '';
  const structureCode = segments[1] || '';

  if (!SELECTION_CODE_PATTERN.test(selectionCode) || !STRUCTURE_CODE_PATTERN.test(structureCode)) {
    return null;
  }

  let targetCode = segments[2] || '';
  let formatCode = segments[3] || '';

  // Some catalog numbers append the delivery-format code directly to the
  // six-character target code instead of separating it with a final hyphen.
  if (!formatCode && targetCode.length > 6) {
    const attachedFormatCode = targetCode.slice(-1);
    if (FORMAT_CODE_PATTERN.test(attachedFormatCode)) {
      formatCode = attachedFormatCode;
      targetCode = targetCode.slice(0, -1);
    }
  }

  return {
    normalized,
    functionType: selectionCode.slice(0, 2),
    deliveryType: selectionCode.slice(2),
    targetGene: TARGET_CODE_PATTERN.test(targetCode) ? targetCode : '',
    formatCode: FORMAT_CODE_PATTERN.test(formatCode) ? formatCode : '',
    structureMap: Object.fromEntries(
      [...structureCode].map((valueCode, index) => [`S${index + 1}`, valueCode]),
    ),
  };
};

export const getGeneDesignPath = (catalogNumber) => {
  const parsedCatalog = parseGeneDesignCatalogNumber(catalogNumber);
  return parsedCatalog
    ? `/design?catalog=${encodeURIComponent(parsedCatalog.normalized)}`
    : '';
};
