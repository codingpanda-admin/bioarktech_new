import React, { useEffect, useMemo, useState } from 'react';
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
  format: '',
};

const emptyGeneSearch = {
  species: '',
  geneName: '',
  description: '',
};

const makeFormatKey = (formatCode, unitAmount) => `${formatCode}::${unitAmount}`;

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

function DesignPage({ navigate }) {
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

  useEffect(() => {
    let isCurrent = true;

    apiFetch('/api/genes/design-metadata/')
      .then((data) => {
        if (isCurrent) setMetadata({ ...emptyMetadata, ...data });
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
  }, []);

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
  const selectedFormat = useMemo(() => {
    for (const formatType of metadata.format_types) {
      const option = formatType.options.find(
        (item) => makeFormatKey(formatType.code_id, item.unit_amount) === design.format,
      );
      if (option) return { type: formatType, option };
    }
    return null;
  }, [design.format, metadata.format_types]);

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

  const canGoBack = activeStep > 0;
  const canGoNext = activeStep < steps.length - 1;
  const isDesignComplete = Boolean(
    design.category
      && design.functionType
      && design.deliveryType
      && metadata.structure_substeps.length > 0
      && metadata.structure_substeps.every((substep) => design.structureMap[substep.code])
      && design.targetGene
      && design.format,
  );
  const isCurrentStepComplete = (() => {
    if (metadataLoading || metadataError) return false;
    if (activeStepId === 'structureMap') {
      return metadata.structure_substeps.length > 0
        && metadata.structure_substeps.every((substep) => design.structureMap[substep.code]);
    }
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
  const formatLabel = selectedFormat
    ? `${selectedFormat.type.name} — ${selectedFormat.option.unit_amount}`
    : '';

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
      `Format: ${formatLabel || '-'}`,
    ].join('\n');
  }, [
    categoryLabel,
    deliveryTypeLabel,
    formatLabel,
    functionTypeLabel,
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
    { step: 'Step 6', label: 'Format Type', values: [formatLabel].filter(Boolean) },
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
    setDesign((previous) => ({
      ...previous,
      targetGeneMode: 'search',
      targetGene: gene.target_sequence,
      targetGeneRecord: gene,
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
    setDesign((previous) => ({ ...previous, [activeStepId]: '' }));
  };

  const goToQuote = () => {
    const params = new URLSearchParams({ projectDescription: designDescription });
    navigate(`/request-quote?${params.toString()}`);
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
                <div className="design-structure-group" key={substep.code}>
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
      <div className="design-format-grid">
        {metadata.format_types.map((formatType) => {
          const isSelected = selectedFormat?.type.code_id === formatType.code_id;
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
              <div className="design-format-options" aria-label={`${formatType.name} unit amounts`}>
                {formatType.options.map((option) => {
                  const optionKey = makeFormatKey(formatType.code_id, option.unit_amount);
                  return (
                    <button
                      key={optionKey}
                      type="button"
                      className={`design-format-option ${design.format === optionKey ? 'is-selected' : ''}`}
                      onClick={() => setField('format', optionKey)}
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
            <img src="/images/design/gene-structure-base.png" alt="Gene structure map" />
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
          <dl>
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
            <div><dt>Format</dt><dd>{formatLabel || '-'}</dd></div>
          </dl>
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
