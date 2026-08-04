import React, { useMemo, useState } from 'react';

const steps = [
  { id: 'category', label: 'Select category' },
  { id: 'functionType', label: 'Select function type' },
  { id: 'deliveryType', label: 'Select delivery type' },
  { id: 'structureMap', label: 'Select structure map' },
  { id: 'targetGene', label: 'Provide target gene info' },
  { id: 'format', label: 'Type Functoinal Format' },
];

const optionSets = {
  category: ['CRISPR-Cas9', 'RNAi', 'Mammalian Cloning', 'Prokaryotic Cloning'],
  functionType: ['CRISPR RNA Knockdown', 'CRISPRa', 'CRISPRi', 'CRISPR KnockOut', 'CRISPR AAVS1 Donor'],
  deliveryType: ['Standard', 'All-in-One', 'Lenti', 'Lenti-AIO'],
  promoter: ['PCMV', 'EF1a', 'EF1a Core'],
  proteinTag: ['His', 'MycDDK', 'None', 'Customized'],
  fluorescenceMarker: ['GFP', 'RFP', 'BFP', 'Luciferase', 'None'],
  selectionMarker: ['Puro', 'BSD', 'Neo', 'None'],
  targetGene: ['Search Target Gene', 'Control (or Scramble)', 'Non-Insert (or Template)'],
  format: [
    {
      title: 'Vector',
      description: 'The products are provided as a kit containing all the essential components for convenient use in your experiments. For CRISPR/RNAi targeting a specific gene, three distinct gRNAs/shRNAs are designed to target the specified genes or RNAs, with a scramble tube included as a control. If ordering only a CRISPR/RNAi control, non-insert vector, overexpression or inducible expression, the corresponding tube is included in the kit.',
    },
    {
      title: 'Lentivirus',
      description: 'The product is provided as lentivirus at titers specified by the customer, with three available options: 1x10^7, 1x10^8, and 1x10^9 TU/mL. For CRISPR/RNAi targeting a specific gene, three DNA constructs are combined to create the lentiviral mixture, with a separate scramble tube included as a control. If ordering only a CRISPR/RNAi control, overexpression or inducible expression, the corresponding tube is included in the package.',
    },
    {
      title: 'Cell',
      description: 'The constructed stable cell line is provided as frozen cells in quantities specified by the customer.',
    },
  ],
};

const summaryLabels = {
  category: 'Category',
  functionType: 'Function Type',
  deliveryType: 'Delivery Type',
  promoter: 'Promoter',
  proteinTag: 'Protein Tag',
  fluorescenceMarker: 'Fluorescence Marker',
  selectionMarker: 'Selection Marker',
  targetGene: 'Target Sequence',
  format: 'Format',
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

function DesignPage({ navigate }) {
  const [activeStep, setActiveStep] = useState(0);
  const [design, setDesign] = useState({
    category: '',
    functionType: '',
    deliveryType: '',
    structureMap: '',
    promoter: '',
    proteinTag: '',
    fluorescenceMarker: '',
    selectionMarker: '',
    targetGene: '',
    format: [],
  });

  const activeStepId = steps[activeStep].id;
  const canGoBack = activeStep > 0;
  const canGoNext = activeStep < steps.length - 1;
  const isCurrentStepComplete = (() => {
    if (activeStepId === 'structureMap') {
      return Boolean(design.promoter && design.proteinTag && design.fluorescenceMarker && design.selectionMarker);
    }
    if (activeStepId === 'format') {
      return design.format.length > 0;
    }
    return Boolean(design[activeStepId]);
  })();

  const designDescription = useMemo(() => {
    return [
      `Category: ${design.category || '-'}`,
      `Function Type: ${design.functionType || '-'}`,
      `Delivery Type: ${design.deliveryType || '-'}`,
      `Structure Map: ${design.structureMap || '-'}`,
      `Promoter: ${design.promoter || '-'}`,
      `Protein Tag: ${design.proteinTag || '-'}`,
      `Fluorescence Marker: ${design.fluorescenceMarker || '-'}`,
      `Selection Marker: ${design.selectionMarker || '-'}`,
      `Target Sequence: ${design.targetGene || '-'}`,
      `Format: ${design.format.length ? design.format.join(', ') : '-'}`,
    ].join('\n');
  }, [design]);

  const selectedStepTags = [
    { step: 'Step 1', label: 'Category', values: [design.category].filter(Boolean) },
    { step: 'Step 2', label: 'Function Type', values: [design.functionType].filter(Boolean) },
    { step: 'Step 3', label: 'Delivery Type', values: [design.deliveryType].filter(Boolean) },
    {
      step: 'Step 4',
      label: 'Structure Map',
      values: [
        design.promoter && `Promoter: ${design.promoter}`,
        design.proteinTag && `Protein Tag: ${design.proteinTag}`,
        design.fluorescenceMarker && `Fluorescence Marker: ${design.fluorescenceMarker}`,
        design.selectionMarker && `Selection Marker: ${design.selectionMarker}`,
      ].filter(Boolean),
    },
    { step: 'Step 5', label: 'Target Gene Info', values: [design.targetGene].filter(Boolean) },
    { step: 'Step 6', label: 'Functional Format', values: design.format },
  ];

  const setField = (field, value) => {
    setDesign((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFormat = (value) => {
    setDesign((prev) => ({
      ...prev,
      format: prev.format.includes(value)
        ? prev.format.filter((item) => item !== value)
        : [...prev.format, value],
    }));
  };

  const resetCurrentStep = () => {
    if (activeStepId === 'structureMap') {
      setDesign((prev) => ({
        ...prev,
        promoter: '',
        proteinTag: '',
        fluorescenceMarker: '',
        selectionMarker: '',
      }));
      return;
    }

    if (activeStepId === 'format') {
      setDesign((prev) => ({ ...prev, format: [] }));
      return;
    }

    setDesign((prev) => ({ ...prev, [activeStepId]: '' }));
  };

  const goToQuote = () => {
    const params = new URLSearchParams({ projectDescription: designDescription });
    navigate(`/request-quote?${params.toString()}`);
  };

  const renderOptionButton = (field, value) => (
    <button
      key={value}
      type="button"
      className={`design-option ${design[field] === value ? 'is-selected' : ''}`}
      onClick={() => setField(field, value)}
    >
      <span className="design-option-icon"><CubeIcon /></span>
      <span>{value}</span>
    </button>
  );

  const renderStructureChoice = (field, value) => (
    <button
      key={value}
      type="button"
      className={`design-structure-choice ${design[field] === value ? 'is-selected' : ''}`}
      onClick={() => setField(field, value)}
    >
      {value}
    </button>
  );

  const renderStepControls = () => {
    if (activeStepId === 'structureMap') {
      return (
        <div className="design-structure-groups">
          <div className="design-structure-group">
            <h3>Promoter</h3>
            <div className="design-structure-choices">
              {optionSets.promoter.map((value) => renderStructureChoice('promoter', value))}
            </div>
          </div>
          <div className="design-structure-group">
            <h3>Protein Tag</h3>
            <div className="design-structure-choices">
              {optionSets.proteinTag.map((value) => renderStructureChoice('proteinTag', value))}
            </div>
          </div>
          <div className="design-structure-group">
            <h3>Fluorescence Marker</h3>
            <div className="design-structure-choices">
              {optionSets.fluorescenceMarker.map((value) => renderStructureChoice('fluorescenceMarker', value))}
            </div>
          </div>
          <div className="design-structure-group">
            <h3>Selection Marker</h3>
            <div className="design-structure-choices">
              {optionSets.selectionMarker.map((value) => renderStructureChoice('selectionMarker', value))}
            </div>
          </div>
        </div>
      );
    }

    if (activeStepId === 'targetGene') {
      return (
        <div className="design-target-options">
          {optionSets.targetGene.map((value) => (
            <button
              key={value}
              type="button"
              className={`design-target-option ${design.targetGene === value ? 'is-selected' : ''}`}
              onClick={() => setField('targetGene', value)}
            >
              {value === 'Search Target Gene' && (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16 16 4 4" />
                </svg>
              )}
              <span>{value}</span>
            </button>
          ))}
        </div>
      );
    }

    if (activeStepId === 'format') {
      return (
        <div className="design-format-grid">
          {optionSets.format.map((option) => (
            <button
              key={option.title}
              type="button"
              className={`design-format-card ${design.format.includes(option.title) ? 'is-selected' : ''}`}
              onClick={() => toggleFormat(option.title)}
            >
              <span className="design-format-title">{option.title}</span>
              <span className="design-format-description">{option.description}</span>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="design-option-grid">
        {optionSets[activeStepId].map((value) => renderOptionButton(activeStepId, value))}
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

        <aside className="design-panel design-summary" aria-labelledby="design-summary-title">
          <h2 id="design-summary-title"><SummaryIcon /> Design Summary</h2>
          <dl>
            <div>
              <dt>{summaryLabels.category}</dt>
              <dd>{design.category || '-'}</dd>
            </div>
            <div>
              <dt>{summaryLabels.functionType}</dt>
              <dd>{design.functionType || '-'}</dd>
            </div>
            <div>
              <dt>{summaryLabels.deliveryType}</dt>
              <dd>{design.deliveryType || '-'}</dd>
            </div>
            <div className="half">
              <dt>{summaryLabels.promoter}</dt>
              <dd>{design.promoter || '-'}</dd>
            </div>
            <div className="half">
              <dt>{summaryLabels.proteinTag}</dt>
              <dd>{design.proteinTag || '-'}</dd>
            </div>
            <div className="half">
              <dt>{summaryLabels.fluorescenceMarker}</dt>
              <dd>{design.fluorescenceMarker || '-'}</dd>
            </div>
            <div className="half">
              <dt>{summaryLabels.selectionMarker}</dt>
              <dd>{design.selectionMarker || '-'}</dd>
            </div>
            <div>
              <dt>{summaryLabels.targetGene}</dt>
              <dd>{design.targetGene || '-'}</dd>
            </div>
            <div>
              <dt>{summaryLabels.format}</dt>
              <dd>{design.format.length ? design.format.join(', ') : '-'}</dd>
            </div>
          </dl>
        </aside>
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
            <button
              type="button"
              className="design-reset-button"
              onClick={resetCurrentStep}
            >
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
              disabled={!isCurrentStepComplete}
              onClick={goToQuote}
            >
              Submit to Quote
              <span aria-hidden="true">›</span>
            </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default DesignPage;
