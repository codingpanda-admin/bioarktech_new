import { useEffect, useMemo, useState } from 'react';
import GeneStructureVisual from '../components/GeneStructureVisual';
import { apiFetch } from '../utils/api';

const steps = [
  { id: 'category', label: 'Select Category' },
  { id: 'functionType', label: 'Select Function Type' },
  { id: 'deliveryType', label: 'Select Delivery Type' },
  { id: 'structureMap', label: 'Select Structure Map' },
  { id: 'targetGene', label: 'Provide Target Gene Info' },
  { id: 'format', label: 'Select Format Type' },
];

const emptyMetadata = {
  categories: [],
  delivery_types: [],
  structure_substeps: [],
  target_gene_options: [],
  format_types: [],
};

const initialDesign = {
  category: '',
  functionType: '',
  deliveryType: '',
  structureMap: {},
  targetGeneMode: '',
  targetGene: '',
  targetGeneRecord: null,
  format: {},
};

const emptyGeneSearch = {
  species: '',
  geneName: '',
  description: '',
};

const makeFormatKey = (formatCode, unitAmount) => `${formatCode}::${unitAmount}`;
const makePriceKey = (formatCode, unitAmount) => `${formatCode}::${unitAmount}`;

const parseCatalogDesignPrefill = (catalogNumber) => {
  const segments = String(catalogNumber || '')
    .replace(/\s+/g, '')
    .toUpperCase()
    .split('-');
  const selectionCode = segments[0] || '';
  const structureCode = segments[1] || '';

  if (!/^[A-Z]{2}[STLM]$/.test(selectionCode) || !/^[A-Z0-9]{6}$/.test(structureCode)) {
    return null;
  }

  return {
    functionType: selectionCode.slice(0, 2),
    deliveryType: selectionCode.slice(2),
    structureMap: Object.fromEntries(
      [...structureCode].map((valueCode, index) => [`S${index + 1}`, valueCode]),
    ),
  };
};

const getDiscountPriceDetails = (price) => {
  const listPrice = price?.list_price !== null && price?.list_price !== ''
    ? Number(price.list_price)
    : null;
  const discountedPrice = price?.discount_price !== null && price?.discount_price !== ''
    ? Number(price.discount_price)
    : null;
  const isDiscounted = (
    Number.isFinite(listPrice)
    && listPrice > 0
    && Number.isFinite(discountedPrice)
    && discountedPrice >= 0
    && discountedPrice < listPrice
  );

  if (!isDiscounted) {
    return { isDiscounted: false, listPrice, discountedPrice, discountPercent: '' };
  }

  const percentage = ((listPrice - discountedPrice) / listPrice) * 100;
  const discountPercent = percentage < 0.01
    ? '<0.01'
    : percentage < 1
      ? percentage.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
      : String(Math.round(percentage));

  return { isDiscounted, listPrice, discountedPrice, discountPercent };
};

const getEffectivePrice = (price) => {
  const discount = getDiscountPriceDetails(price);
  if (discount.isDiscounted) return discount.discountedPrice;
  if (Number.isFinite(discount.listPrice)) return discount.listPrice;
  if (Number.isFinite(discount.discountedPrice)) return discount.discountedPrice;
  return 0;
};

const formatUsd = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const CubeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3 4.5 7.25 12 11.5l7.5-4.25L12 3Z" />
    <path d="M4.5 7.25v8.5L12 20l7.5-4.25v-8.5" />
    <path d="M12 11.5V20" />
  </svg>
);

const SectionIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 7h4v4H7zM13 13h4v4h-4z" />
    <path d="M11 9h4a2 2 0 0 1 2 2v2M13 15H9a2 2 0 0 1-2-2v-2" />
  </svg>
);

const SummaryIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m8 7 8.5 8.5a2.1 2.1 0 0 1 0 3 2.1 2.1 0 0 1-3 0L5 10V5h5l2.5 2.5" />
    <path d="M8 8h.01" />
  </svg>
);

function DesignPage({ navigate, onAddToCart, catalogNumber = '' }) {
  const [activeStep, setActiveStep] = useState(0);
  const [metadata, setMetadata] = useState(emptyMetadata);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState('');
  const [design, setDesign] = useState(initialDesign);
  const [showSummary, setShowSummary] = useState(false);
  const [geneSearchForm, setGeneSearchForm] = useState(emptyGeneSearch);
  const [geneSearchQuery, setGeneSearchQuery] = useState({ ...emptyGeneSearch, page: 1 });
  const [geneSearchData, setGeneSearchData] = useState({
    results: [],
    species: [],
    total: 0,
    page: 1,
    total_pages: 0,
  });
  const [geneSearchLoading, setGeneSearchLoading] = useState(false);
  const [geneSearchError, setGeneSearchError] = useState('');
  const [priceLookup, setPriceLookup] = useState({ results: [] });
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [formatQuantities, setFormatQuantities] = useState({});
  const [cartNotice, setCartNotice] = useState('');

  useEffect(() => {
    let isCurrent = true;

    apiFetch('/api/genes/design-metadata/')
      .then((data) => {
        if (!isCurrent) return;

        const nextMetadata = { ...emptyMetadata, ...data };
        setMetadata(nextMetadata);

        const prefill = parseCatalogDesignPrefill(catalogNumber);
        const category = prefill && nextMetadata.categories.find((item) => (
          item.function_types.some((functionType) => functionType.symbol_id === prefill.functionType)
        ));
        const hasDeliveryType = prefill && nextMetadata.delivery_types.some(
          (deliveryType) => deliveryType.symbol_id === prefill.deliveryType,
        );
        const hasValidStructure = prefill && nextMetadata.structure_substeps.every((substep) => (
          substep.options.some((option) => option.value_code === prefill.structureMap[substep.code])
        ));

        if (prefill && category && hasDeliveryType && hasValidStructure) {
          setDesign((previous) => ({
            ...previous,
            category: category.code,
            functionType: prefill.functionType,
            deliveryType: prefill.deliveryType,
            structureMap: prefill.structureMap,
          }));
          setActiveStep(0);
          setShowSummary(false);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setMetadataError('The gene-design options could not be loaded. Please refresh and try again.');
        }
      })
      .finally(() => {
        if (isCurrent) setMetadataLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [catalogNumber]);

  useEffect(() => {
    if (design.targetGeneMode !== 'search') return undefined;

    let isCurrent = true;
    const params = new URLSearchParams({
      page: String(geneSearchQuery.page),
      page_size: '20',
    });
    if (geneSearchQuery.species) params.set('species', geneSearchQuery.species);
    if (geneSearchQuery.geneName) params.set('gene_name', geneSearchQuery.geneName);
    if (geneSearchQuery.description) params.set('description', geneSearchQuery.description);

    setGeneSearchLoading(true);
    setGeneSearchError('');
    apiFetch(`/api/genes/gene-library/?${params.toString()}`)
      .then((data) => {
        if (isCurrent) setGeneSearchData(data);
      })
      .catch(() => {
        if (isCurrent) setGeneSearchError('The gene library could not be searched. Please try again.');
      })
      .finally(() => {
        if (isCurrent) setGeneSearchLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [design.targetGeneMode, geneSearchQuery]);

  const activeStepId = steps[activeStep].id;
  const selectedCategory = metadata.categories.find((item) => item.code === design.category);
  const functionTypes = selectedCategory?.function_types || [];
  const selectedFunctionType = functionTypes.find((item) => item.symbol_id === design.functionType);
  const selectedDeliveryType = metadata.delivery_types.find(
    (item) => item.symbol_id === design.deliveryType,
  );
  const selectedTargetGene = metadata.target_gene_options.find(
    (item) => item.code_id === design.targetGene,
  );
  const selectedFormats = useMemo(() => {
    const formatSelections = design.format || {};
    return metadata.format_types.flatMap((formatType) => {
      const selectedKey = formatSelections[formatType.code_id];
      const option = formatType.options.find(
        (item) => makeFormatKey(formatType.code_id, item.unit_amount) === selectedKey,
      );
      return option ? [{ type: formatType, option }] : [];
    });
  }, [design.format, metadata.format_types]);

  useEffect(() => {
    const activeKeys = new Set(selectedFormats.map(({ type, option }) => (
      makePriceKey(type.code_id, option.unit_amount)
    )));
    setFormatQuantities((previous) => {
      const next = {};
      activeKeys.forEach((key) => {
        next[key] = previous[key] || 1;
      });
      return next;
    });
    setCartNotice('');
  }, [selectedFormats]);

  const structureSelections = metadata.structure_substeps.map((substep) => {
    const selectedCode = design.structureMap[substep.code];
    const option = substep.options.find((item) => item.value_code === selectedCode);
    return { substep, option };
  });
  const propertyValueCode = metadata.structure_substeps
    .find((substep) => substep.code === 'S2')
    ?.options[0]?.value_code || '';
  const bacterialValueCode = ['L', 'M'].includes(design.deliveryType)
    ? 'C'
    : ['S', 'T'].includes(design.deliveryType)
      ? 'A'
      : '';

  useEffect(() => {
    setDesign((previous) => {
      const structureMap = { ...previous.structureMap };
      let changed = false;

      if (propertyValueCode && structureMap.S2 !== propertyValueCode) {
        structureMap.S2 = propertyValueCode;
        changed = true;
      }

      if (bacterialValueCode) {
        if (structureMap.S6 !== bacterialValueCode) {
          structureMap.S6 = bacterialValueCode;
          changed = true;
        }
      } else if (Object.prototype.hasOwnProperty.call(structureMap, 'S6')) {
        delete structureMap.S6;
        changed = true;
      }

      return changed ? { ...previous, structureMap } : previous;
    });
  }, [bacterialValueCode, propertyValueCode]);

  useEffect(() => {
    const structureComplete = metadata.structure_substeps.length > 0
      && metadata.structure_substeps.every((substep) => design.structureMap[substep.code]);
    if (
      metadataLoading
      || metadataError
      || !design.functionType
      || !design.deliveryType
      || !design.targetGene
      || !structureComplete
      || selectedFormats.length === 0
    ) {
      setPriceLookup({ results: [] });
      setPriceError('');
      setPriceLoading(false);
      return undefined;
    }

    let isCurrent = true;
    setPriceLoading(true);
    setPriceError('');
    apiFetch('/api/genes/design-price/', {
      method: 'POST',
      body: {
        function_type_code: design.functionType,
        delivery_type_code: design.deliveryType,
        target_gene_code: design.targetGene,
        structure_map: design.structureMap,
        formats: selectedFormats.map(({ type, option }) => ({
          code_id: type.code_id,
          unit_amount: option.unit_amount,
        })),
      },
    })
      .then((data) => {
        if (isCurrent) setPriceLookup(data);
      })
      .catch(() => {
        if (isCurrent) {
          setPriceLookup({ results: [] });
          setPriceError('Pricing could not be loaded. You can still submit this design for a quote.');
        }
      })
      .finally(() => {
        if (isCurrent) setPriceLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [
    design.deliveryType,
    design.functionType,
    design.structureMap,
    design.targetGene,
    metadata.structure_substeps,
    metadataError,
    metadataLoading,
    selectedFormats,
  ]);

  const canGoBack = activeStep > 0;
  const canGoNext = activeStep < steps.length - 1;
  const isDesignComplete = Boolean(
    design.category
      && design.functionType
      && design.deliveryType
      && metadata.structure_substeps.length > 0
      && metadata.structure_substeps.every((substep) => design.structureMap[substep.code])
      && design.targetGene
      && selectedFormats.length > 0,
  );
  const isCurrentStepComplete = (() => {
    if (metadataLoading || metadataError) return false;
    if (activeStepId === 'structureMap') {
      return metadata.structure_substeps.length > 0
        && metadata.structure_substeps.every((substep) => design.structureMap[substep.code]);
    }
    if (activeStepId === 'format') return selectedFormats.length > 0;
    return Boolean(design[activeStepId]);
  })();

  const categoryLabel = selectedCategory?.name || '';
  const functionTypeLabel = selectedFunctionType?.name || '';
  const deliveryTypeLabel = selectedDeliveryType?.name || '';
  const targetGeneLabel = design.targetGeneRecord
    ? `${design.targetGeneRecord.gene_name} (${design.targetGeneRecord.symbol})`
    : selectedTargetGene?.name || '';
  const targetSequence = design.targetGeneRecord?.target_sequence
    || selectedTargetGene?.code_id
    || '';
  const formatLabels = selectedFormats.map(
    ({ type, option }) => `${type.name} — ${option.unit_amount}`,
  );
  const formatLabel = formatLabels.join('; ');
  const designStructureCode = Array.from({ length: 6 }, (_, index) => (
    design.structureMap[`S${index + 1}`] || ''
  )).join('').toUpperCase();
  const buildDesignSku = (formatCode) => {
    const targetCode = String(design.targetGene || '').trim().toUpperCase();
    if (!design.functionType || !design.deliveryType || designStructureCode.length !== 6 || !targetCode || !formatCode) {
      return '';
    }
    return `${design.functionType}${design.deliveryType}-${designStructureCode}-${targetCode}-${formatCode}`;
  };
  const formatSummaries = selectedFormats.map(({ type, option }) => ({
    label: `${type.name} — ${option.unit_amount}`,
    sku: buildDesignSku(type.code_id),
  }));
  const pricedSelections = priceLookup.results.filter((price) => !price.quote_only);
  const quoteOnlySelections = priceLookup.results.filter((price) => price.quote_only);
  const pricedOrderTotal = pricedSelections.reduce((total, price) => {
    const key = makePriceKey(price.format_code, price.unit_amount);
    return total + (getEffectivePrice(price) * (formatQuantities[key] || 1));
  }, 0);

  const designDescription = useMemo(() => {
    const structureDescription = structureSelections
      .filter(({ option }) => option)
      .map(({ substep, option }) => `${substep.name}: ${option.value}`)
      .join(', ');

    return [
      `Category: ${categoryLabel || '-'}`,
      `Function Type: ${functionTypeLabel || '-'}`,
      `Delivery Type: ${deliveryTypeLabel || '-'}`,
      `Structure Map: ${structureDescription || '-'}`,
      `Target Gene: ${targetGeneLabel || '-'}`,
      `Target Sequence: ${targetSequence || '-'}`,
      `Format Types: ${selectedFormats.map(({ type, option }) => {
        const key = makePriceKey(type.code_id, option.unit_amount);
        return `${type.name} — ${option.unit_amount} x${formatQuantities[key] || 1} (SKU: ${buildDesignSku(type.code_id)})`;
      }).join('; ') || '-'}`,
    ].join('\n');
  }, [
    categoryLabel,
    deliveryTypeLabel,
    formatLabel,
    formatQuantities,
    functionTypeLabel,
    selectedFormats,
    structureSelections,
    targetGeneLabel,
    targetSequence,
  ]);

  const selectedStepTags = [
    { step: 'Step 1', label: 'Category', values: [categoryLabel].filter(Boolean) },
    { step: 'Step 2', label: 'Function Type', values: [functionTypeLabel].filter(Boolean) },
    { step: 'Step 3', label: 'Delivery Type', values: [deliveryTypeLabel].filter(Boolean) },
    {
      step: 'Step 4',
      label: 'Structure Map',
      values: structureSelections
        .filter(({ substep, option }) => substep.code !== 'S2' && option)
        .map(({ substep, option }) => `${substep.name}: ${option.value}`),
    },
    {
      step: 'Step 5',
      label: 'Target Gene Info',
      values: [
        targetGeneLabel && targetSequence
          ? `${targetGeneLabel} · ${targetSequence}`
          : targetGeneLabel,
      ].filter(Boolean),
    },
    { step: 'Step 6', label: 'Format Type', values: formatLabels },
  ];

  const selectCategory = (code) => {
    setDesign((previous) => ({
      ...previous,
      category: code,
      functionType: previous.category === code ? previous.functionType : '',
    }));
  };

  const setField = (field, value) => {
    setDesign((previous) => ({ ...previous, [field]: value }));
  };

  const setStructureField = (substepCode, valueCode) => {
    setDesign((previous) => ({
      ...previous,
      structureMap: { ...previous.structureMap, [substepCode]: valueCode },
    }));
  };

  const selectFormatOption = (formatCode, optionKey) => {
    setDesign((previous) => {
      const format = { ...(previous.format || {}) };
      if (format[formatCode] === optionKey) {
        delete format[formatCode];
      } else {
        // A bucket can hold one unit amount while selections in other buckets remain intact.
        format[formatCode] = optionKey;
      }
      return { ...previous, format };
    });
  };

  const selectStaticTargetGene = (codeId) => {
    setDesign((previous) => ({
      ...previous,
      targetGeneMode: 'static',
      targetGene: codeId,
      targetGeneRecord: null,
    }));
  };

  const selectTargetGeneSearch = () => {
    setDesign((previous) => ({
      ...previous,
      targetGeneMode: 'search',
      targetGene: previous.targetGeneMode === 'search' ? previous.targetGene : '',
      targetGeneRecord: previous.targetGeneMode === 'search' ? previous.targetGeneRecord : null,
    }));
  };

  const selectLibraryGene = (gene) => {
    const vectorDefault = metadata.format_types
      .find((formatType) => formatType.code_id === 'k')
      ?.options.find((option) => option.unit_amount === '5ug DNA');
    setDesign((previous) => ({
      ...previous,
      targetGeneMode: 'search',
      targetGene: gene.target_sequence,
      targetGeneRecord: gene,
      format: vectorDefault
        ? {
            ...(previous.format || {}),
            k: makeFormatKey('k', vectorDefault.unit_amount),
          }
        : previous.format,
    }));
  };

  const submitGeneSearch = (event) => {
    event.preventDefault();
    setGeneSearchQuery({ ...geneSearchForm, page: 1 });
  };

  const changeGeneSearchPage = (page) => {
    setGeneSearchQuery((previous) => ({ ...previous, page }));
  };

  const resetCurrentStep = () => {
    if (activeStepId === 'category') {
      setDesign((previous) => ({ ...previous, category: '', functionType: '' }));
      return;
    }
    if (activeStepId === 'structureMap') {
      setDesign((previous) => ({
        ...previous,
        structureMap: {
          ...(propertyValueCode ? { S2: propertyValueCode } : {}),
          ...(bacterialValueCode ? { S6: bacterialValueCode } : {}),
        },
      }));
      return;
    }
    if (activeStepId === 'targetGene') {
      setDesign((previous) => ({
        ...previous,
        targetGeneMode: '',
        targetGene: '',
        targetGeneRecord: null,
      }));
      setGeneSearchForm(emptyGeneSearch);
      setGeneSearchQuery({ ...emptyGeneSearch, page: 1 });
      return;
    }
    if (activeStepId === 'format') {
      setDesign((previous) => ({ ...previous, format: {} }));
      return;
    }
    setDesign((previous) => ({ ...previous, [activeStepId]: '' }));
  };

  const goToQuote = () => {
    const params = new URLSearchParams({ projectDescription: designDescription });
    navigate(`/request-quote?${params.toString()}`);
  };

  const updateFormatQuantity = (formatCode, unitAmount, value) => {
    const numericValue = Number.parseInt(value, 10);
    const quantity = Number.isFinite(numericValue) ? Math.min(999, Math.max(1, numericValue)) : 1;
    const key = makePriceKey(formatCode, unitAmount);
    setFormatQuantities((previous) => ({ ...previous, [key]: quantity }));
    setCartNotice('');
  };

  const addDesignSelectionsToCart = () => {
    if (!onAddToCart || pricedSelections.length === 0) return;

    pricedSelections.forEach((price) => {
      const key = makePriceKey(price.format_code, price.unit_amount);
      const quantity = formatQuantities[key] || 1;
      const sku = buildDesignSku(price.format_code);
      const effectivePrice = getEffectivePrice(price);
      onAddToCart(
        {
          product_sku: sku,
          product_name: `Gene Design — ${price.format_name}`,
          description: designDescription,
          source_type: 'product',
          shipping_cost: price.format_code === 'k' ? 100 : 60,
        },
        quantity,
        {
          unit_size: price.unit_amount,
          unit_price: effectivePrice,
          list_price: Number(price.list_price) || effectivePrice,
        },
      );
    });

    const skippedText = quoteOnlySelections.length > 0
      ? ` ${quoteOnlySelections.length} quote-only selection${quoteOnlySelections.length === 1 ? ' was' : 's were'} not added.`
      : '';
    setCartNotice(
      `${pricedSelections.length} selection${pricedSelections.length === 1 ? '' : 's'} added to your cart.${skippedText}`,
    );
  };

  const renderMetadataOption = ({ key, selected, onClick, title, meta, description }) => (
    <button
      key={key}
      type="button"
      className={`design-option ${selected ? 'is-selected' : ''}`}
      onClick={onClick}
    >
      <span className="design-option-icon"><CubeIcon /></span>
      <span className="design-option-copy">
        <span className="design-option-heading">
          <span>{title}</span>
          {meta && <span className="design-option-code">{meta}</span>}
        </span>
        {description && <span className="design-option-description">{description}</span>}
      </span>
    </button>
  );

  const renderStepControls = () => {
    if (metadataLoading) return <p className="design-metadata-message">Loading design options…</p>;
    if (metadataError) return <p className="design-metadata-message is-error">{metadataError}</p>;

    if (activeStepId === 'category') {
      return (
        <div className="design-option-grid">
          {metadata.categories.map((option) => renderMetadataOption({
            key: option.code,
            selected: design.category === option.code,
            onClick: () => selectCategory(option.code),
            title: option.name,
            description: option.description,
          }))}
        </div>
      );
    }

    if (activeStepId === 'functionType') {
      if (!selectedCategory) {
        return <p className="design-metadata-message">Select a category in Step 1 to see its function types.</p>;
      }
      return (
        <div className="design-option-grid">
          {functionTypes.map((option) => renderMetadataOption({
            key: option.symbol_id,
            selected: design.functionType === option.symbol_id,
            onClick: () => setField('functionType', option.symbol_id),
            title: option.name,
            meta: `${option.symbol_id} · ${option.abbreviation}`,
            description: option.description,
          }))}
        </div>
      );
    }

    if (activeStepId === 'deliveryType') {
      return (
        <div className="design-option-grid">
          {metadata.delivery_types.map((option) => renderMetadataOption({
            key: option.symbol_id,
            selected: design.deliveryType === option.symbol_id,
            onClick: () => setField('deliveryType', option.symbol_id),
            title: option.name,
            meta: `${option.symbol_id} · ${option.abbreviation}`,
            description: `${option.class_name}. ${option.description}`,
          }))}
        </div>
      );
    }

    if (activeStepId === 'structureMap') {
      return (
        <div className="design-structure-groups">
          {metadata.structure_substeps
            .filter((substep) => substep.code !== 'S2')
            .map((substep) => {
              const selectedOption = substep.options.find(
                (option) => option.value_code === design.structureMap[substep.code],
              );

              return (
                <div className={`design-structure-group is-${substep.code.toLowerCase()}`} key={substep.code}>
                  <h3>{substep.code} · {substep.name}</h3>
                  {substep.code === 'S6' ? (
                    <div className="design-structure-auto" aria-live="polite">
                      {selectedOption ? (
                        <>
                          <span>{selectedOption.value}</span>
                          <span className="design-structure-code">{selectedOption.value_code}</span>
                          <small>Automatically selected from the Step 3 delivery type</small>
                        </>
                      ) : (
                        <small>Select a delivery type in Step 3 to determine the bacterial marker.</small>
                      )}
                    </div>
                  ) : (
                    <div className="design-structure-choices">
                      {substep.options.map((option) => (
                        <button
                          key={`${substep.code}-${option.value_code}`}
                          type="button"
                          className={`design-structure-choice ${design.structureMap[substep.code] === option.value_code ? 'is-selected' : ''}`}
                          onClick={() => setStructureField(substep.code, option.value_code)}
                        >
                          <span>{option.value}</span>
                          <span className="design-structure-code">{option.value_code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      );
    }

    if (activeStepId === 'targetGene') {
      return (
        <>
          <div className="design-option-grid design-target-grid">
            {renderMetadataOption({
              key: 'search-target-gene',
              selected: design.targetGeneMode === 'search',
              onClick: selectTargetGeneSearch,
              title: 'Search Target Gene',
              meta: 'Gene Library',
              description: 'Search the gene library by gene name or description, and narrow the results by species.',
            })}
            {metadata.target_gene_options.map((option) => renderMetadataOption({
              key: option.code_id,
              selected: design.targetGeneMode === 'static' && design.targetGene === option.code_id,
              onClick: () => selectStaticTargetGene(option.code_id),
              title: option.name,
              meta: `${option.code_id} · ${option.abbreviation}`,
              description: option.description,
            }))}
          </div>

          {design.targetGeneMode === 'search' && (
            <section className="design-gene-search" aria-label="Search target gene">
              {design.targetGeneRecord && (
                <div className="design-selected-gene" role="status">
                  <span>
                    <small>Selected target gene</small>
                    <strong>{design.targetGeneRecord.gene_name}</strong>
                    <span>{[design.targetGeneRecord.symbol, design.targetGeneRecord.species].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="design-selected-gene-sequence">
                    <small>Target sequence</small>
                    <strong>{design.targetGeneRecord.target_sequence}</strong>
                  </span>
                </div>
              )}
              <form className="design-gene-search-form" onSubmit={submitGeneSearch}>
                <label>
                  <span>Species</span>
                  <select
                    value={geneSearchForm.species}
                    onChange={(event) => setGeneSearchForm((previous) => ({
                      ...previous,
                      species: event.target.value,
                    }))}
                  >
                    <option value="">All species</option>
                    {geneSearchData.species.map((species) => (
                      <option key={species} value={species}>{species}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Gene name</span>
                  <input
                    type="search"
                    value={geneSearchForm.geneName}
                    placeholder="Search gene name"
                    onChange={(event) => setGeneSearchForm((previous) => ({
                      ...previous,
                      geneName: event.target.value,
                    }))}
                  />
                </label>
                <label>
                  <span>Description</span>
                  <input
                    type="search"
                    value={geneSearchForm.description}
                    placeholder="Search description"
                    onChange={(event) => setGeneSearchForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))}
                  />
                </label>
                <div className="design-gene-search-actions">
                  <button type="submit" className="design-gene-search-submit">Search</button>
                  <button
                    type="button"
                    className="design-gene-search-clear"
                    onClick={() => {
                      setGeneSearchForm(emptyGeneSearch);
                      setGeneSearchQuery({ ...emptyGeneSearch, page: 1 });
                    }}
                  >
                    Clear
                  </button>
                </div>
              </form>

              {geneSearchError && <p className="design-metadata-message is-error">{geneSearchError}</p>}
              {geneSearchLoading ? (
                <p className="design-metadata-message">Searching the gene library…</p>
              ) : !geneSearchError && (
                <>
                  <div className="design-gene-results" role="list" aria-label="Gene search results">
                    {geneSearchData.results.map((gene) => (
                      <button
                        key={gene.id}
                        type="button"
                        role="listitem"
                        className={`design-gene-result ${design.targetGeneMode === 'search' && design.targetGene === gene.target_sequence ? 'is-selected' : ''}`}
                        onClick={() => selectLibraryGene(gene)}
                      >
                        <span className="design-gene-result-heading">
                          <strong>{gene.gene_name}</strong>
                          <span className="design-option-code">{gene.target_sequence}</span>
                        </span>
                        <span className="design-gene-result-meta">
                          {[gene.symbol, gene.species, gene.locus_id && `Locus ${gene.locus_id}`].filter(Boolean).join(' · ')}
                        </span>
                        {gene.description && <span className="design-gene-result-description">{gene.description}</span>}
                      </button>
                    ))}
                    {geneSearchData.results.length === 0 && (
                      <p className="design-gene-empty">No genes match the current search.</p>
                    )}
                  </div>
                  <div className="design-gene-pagination">
                    <span>{geneSearchData.total.toLocaleString()} genes found</span>
                    <div>
                      <button
                        type="button"
                        disabled={geneSearchData.page <= 1}
                        onClick={() => changeGeneSearchPage(geneSearchData.page - 1)}
                      >
                        Previous
                      </button>
                      <span>Page {geneSearchData.page} of {geneSearchData.total_pages || 1}</span>
                      <button
                        type="button"
                        disabled={geneSearchData.page >= geneSearchData.total_pages}
                        onClick={() => changeGeneSearchPage(geneSearchData.page + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}
        </>
      );
    }

    return (
      <div className="design-format-step">
        <p className="design-format-guidance">
          Select one or more format types. Within each format, choose one unit amount.
        </p>
        <div className="design-format-grid">
          {metadata.format_types.map((formatType) => {
            const selectedKey = design.format?.[formatType.code_id];
            const isSelected = Boolean(selectedKey);
            return (
              <article className={`design-format-card ${isSelected ? 'is-selected' : ''}`} key={formatType.code_id}>
                <span className="design-format-title">
                  {formatType.name}
                  <span className="design-option-code">{formatType.code_id}</span>
                </span>
                <span className="design-format-description">{formatType.description}</span>
                <dl className="design-format-facts">
                  <div><dt>Shipping</dt><dd>{formatType.shipping_temperature}</dd></div>
                  <div><dt>Storage</dt><dd>{formatType.storage}</dd></div>
                  <div><dt>Stability</dt><dd>{formatType.stability}</dd></div>
                </dl>
                <div className="design-format-options" role="group" aria-label={`${formatType.name} unit amounts`}>
                  {formatType.options.map((option) => {
                    const optionKey = makeFormatKey(formatType.code_id, option.unit_amount);
                    const optionSelected = selectedKey === optionKey;
                    return (
                      <button
                        key={optionKey}
                        type="button"
                        aria-pressed={optionSelected}
                        className={`design-format-option ${optionSelected ? 'is-selected' : ''}`}
                        onClick={() => selectFormatOption(formatType.code_id, optionKey)}
                      >
                        {option.unit_amount}
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
        <section className="design-price-lookup" aria-live="polite" aria-label="Gene Design price lookup">
          <div className="design-price-heading">
            <div>
              <span className="design-price-eyebrow">Price lookup</span>
              <h3>Selected Format Pricing</h3>
            </div>
            <span className="design-price-currency">USD</span>
          </div>

          {priceLoading && <p className="design-price-message">Checking current pricing…</p>}
          {priceError && <p className="design-price-message is-error">{priceError}</p>}
          {!priceLoading && !priceError && priceLookup.results.length === 0 && (
            <p className="design-price-message">Select a unit amount to view its price.</p>
          )}
          {!priceLoading && priceLookup.results.length > 0 && (
            <div className="design-price-list">
              {priceLookup.results.map((price) => {
                const discount = getDiscountPriceDetails(price);
                const effectivePrice = getEffectivePrice(price);
                return (
                  <article className="design-price-row" key={`${price.format_code}-${price.unit_amount}`}>
                    <div className="design-price-format">
                      <strong>{price.format_name}</strong>
                      <span>{price.unit_amount}</span>
                    </div>
                    {price.quote_only ? (
                      <button type="button" className="design-price-quote" onClick={goToQuote}>
                        Submit Quote
                      </button>
                    ) : discount.isDiscounted ? (
                      <div className="design-price-values is-discounted">
                        <span className="design-price-list-value">
                          <small>List Price</small>
                          <strong>{formatUsd(discount.listPrice)}</strong>
                        </span>
                        <span className="is-discount">
                          <small>Discounted Price</small>
                          <strong>{formatUsd(discount.discountedPrice)}</strong>
                          <em>{discount.discountPercent}% OFF</em>
                        </span>
                      </div>
                    ) : (
                      <div className="design-price-values is-regular">
                        <span>
                          <small>Price</small>
                          <strong>{formatUsd(effectivePrice)}</strong>
                        </span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  };

  return (
    <main className="design-page">
      <nav className="design-stepper" aria-label="Design steps">
        {steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            className={`design-step ${index === activeStep ? 'is-active' : ''} ${index < activeStep ? 'is-complete' : ''}`}
            onClick={() => setActiveStep(index)}
          >
            <span className="design-step-number">{index + 1}</span>
            <span>{step.label}</span>
          </button>
        ))}
      </nav>

      <section className="design-main-grid">
        <div className="design-panel design-gene-panel">
          <h1><SectionIcon /> Gene Structure</h1>
          <div className="design-structure-frame">
            <GeneStructureVisual
              structureSelections={structureSelections}
              functionTypeName={functionTypeLabel}
              deliveryTypeName={deliveryTypeLabel}
              targetGeneName={design.targetGeneRecord?.gene_name || selectedTargetGene?.name || ''}
            />
            <div className="design-canvas-tags" aria-label="Selected design options by step">
              {selectedStepTags.map((group) => (
                <div className="design-canvas-tag-group" key={group.step}>
                  <span className="design-canvas-tag-step">{group.step}</span>
                  <span className="design-canvas-tag-label">{group.label}</span>
                  <div className="design-canvas-tag-list">
                    {group.values.length > 0 ? (
                      group.values.map((value) => (
                        <span className="design-canvas-tag" key={value}>{value}</span>
                      ))
                    ) : (
                      <span className="design-canvas-tag empty">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="design-panel design-step-panel" aria-labelledby="design-current-step">
        <h2 id="design-current-step"><SectionIcon /> Step {activeStep + 1} · {steps[activeStep].label}</h2>
        {renderStepControls()}

        <div className="design-actions">
          <button
            type="button"
            className="design-nav-button"
            disabled={!canGoBack}
            onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
          >
            <span aria-hidden="true">‹</span>
            Back
          </button>
          <div className="design-forward-actions">
            <button type="button" className="design-reset-button" onClick={resetCurrentStep}>
              Reset
            </button>
            {canGoNext ? (
              <button
                type="button"
                className="design-next-button"
                disabled={!isCurrentStepComplete}
                onClick={() => setActiveStep((step) => Math.min(steps.length - 1, step + 1))}
              >
                Next
                <span aria-hidden="true">›</span>
              </button>
            ) : (
              <button
                type="button"
                className="design-next-button"
                disabled={!isDesignComplete}
                aria-controls="design-summary-panel"
                aria-expanded={showSummary}
                onClick={() => setShowSummary(true)}
              >
                Display Summary
              </button>
            )}
          </div>
        </div>
      </section>

      {showSummary && (
        <section
          id="design-summary-panel"
          className="design-panel design-summary design-summary-panel"
          aria-labelledby="design-summary-title"
        >
          <h2 id="design-summary-title"><SummaryIcon /> Design Summary</h2>
          <dl className="design-selection-summary-grid">
            <div><dt>Category</dt><dd>{categoryLabel || '-'}</dd></div>
            <div><dt>Function Type</dt><dd>{functionTypeLabel || '-'}</dd></div>
            <div><dt>Delivery Type</dt><dd>{deliveryTypeLabel || '-'}</dd></div>
            {structureSelections.filter(({ substep }) => substep.code !== 'S2').map(({ substep, option }) => (
              <div className="half" key={substep.code}>
                <dt>{substep.name}</dt>
                <dd>{option?.value || '-'}</dd>
              </div>
            ))}
            <div><dt>Target Gene</dt><dd>{targetGeneLabel || '-'}</dd></div>
            <div><dt>Target Sequence</dt><dd>{targetSequence || '-'}</dd></div>
            <div className="span-2">
              <dt>Formats / SKU Numbers</dt>
              <dd className="design-summary-format-list">
                {formatSummaries.length > 0 ? formatSummaries.map((item) => (
                  <span key={item.sku || item.label}>
                    <span>{item.label}</span>
                    {item.sku && <code>{item.sku}</code>}
                  </span>
                )) : '-'}
              </dd>
            </div>
          </dl>
          <section className="design-order-summary" aria-label="Selected formats and pricing">
            <div className="design-order-summary-heading">
              <div>
                <span>Pricing</span>
                <h3>Selected Formats</h3>
              </div>
              <span className="design-price-currency">USD</span>
            </div>

            {priceLoading && <p className="design-order-message">Calculating current pricing…</p>}
            {priceError && <p className="design-order-message is-error">{priceError}</p>}
            {!priceLoading && !priceError && priceLookup.results.map((price) => {
              const key = makePriceKey(price.format_code, price.unit_amount);
              const quantity = formatQuantities[key] || 1;
              const effectivePrice = getEffectivePrice(price);
              const discount = getDiscountPriceDetails(price);
              return (
                <article className="design-order-row" key={`summary-price-${key}`}>
                  <div className="design-order-format">
                    <strong>{price.format_name}</strong>
                    <span>{price.unit_amount}</span>
                  </div>
                  <div className="design-order-unit-price">
                    <small>Unit Price</small>
                    {price.quote_only ? (
                      <button type="button" onClick={goToQuote}>Submit Quote</button>
                    ) : (
                      <div className={`design-order-price-display ${discount.isDiscounted ? 'is-discounted' : ''}`}>
                        <strong>{formatUsd(effectivePrice)}</strong>
                        {discount.isDiscounted && (
                          <>
                            <span>List {formatUsd(discount.listPrice)}</span>
                            <em>{discount.discountPercent}% OFF</em>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="design-order-quantity">
                    <small># of Units</small>
                    <div className="design-quantity-control">
                      <button
                        type="button"
                        aria-label={`Decrease ${price.format_name} units`}
                        disabled={quantity <= 1}
                        onClick={() => updateFormatQuantity(price.format_code, price.unit_amount, quantity - 1)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        inputMode="numeric"
                        aria-label={`${price.format_name} number of units`}
                        value={quantity}
                        onChange={(event) => updateFormatQuantity(
                          price.format_code,
                          price.unit_amount,
                          event.target.value,
                        )}
                      />
                      <button
                        type="button"
                        aria-label={`Increase ${price.format_name} units`}
                        disabled={quantity >= 999}
                        onClick={() => updateFormatQuantity(price.format_code, price.unit_amount, quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="design-order-line-total">
                    <small>Total</small>
                    <strong>{price.quote_only ? 'Quote Only' : formatUsd(effectivePrice * quantity)}</strong>
                  </div>
                </article>
              );
            })}

            {!priceLoading && priceLookup.results.length > 0 && (
              <div className="design-order-footer">
                <div className="design-order-total">
                  <span>Purchasable Total</span>
                  <strong>{formatUsd(pricedOrderTotal)}</strong>
                </div>
                {quoteOnlySelections.length > 0 && (
                  <p>Quote-only selections are handled through the Request for Quote button.</p>
                )}
                <button
                  type="button"
                  className="design-add-cart-button"
                  disabled={pricedSelections.length === 0}
                  onClick={addDesignSelectionsToCart}
                >
                  Add Selection(s) to Cart
                </button>
                {cartNotice && (
                  <div className="design-cart-notice" role="status">
                    <span>{cartNotice}</span>
                    <button type="button" onClick={() => navigate('/cart')}>View Cart</button>
                  </div>
                )}
              </div>
            )}
          </section>
          <div className="design-summary-actions">
            <button
              type="button"
              className="design-next-button design-quote-button"
              disabled={!isDesignComplete}
              onClick={goToQuote}
            >
              Request for Quote
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default DesignPage;
