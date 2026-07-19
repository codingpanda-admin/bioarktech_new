import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch, logo } from '../utils/api';

const defaultProductCategories = [
  // Products
  { category_name: 'Genome Editing', external_id: 'genome-editing', product_type: 'product' },
  { category_name: 'Vector Stock', external_id: 'vector-clones', product_type: 'product' },
  { category_name: 'IVT mRNA', external_id: 'category-1764975611348', product_type: 'product' },
  { category_name: 'Purified Protein', external_id: 'category-1764975769330', product_type: 'product' },
  { category_name: 'Virus Product', external_id: 'lentivirus', product_type: 'product' },
  { category_name: 'Cell Lines', external_id: 'stable-cell-lines', product_type: 'product' },

  // Services
  { category_name: 'Genome Editing Services', external_id: 'genome-editing-services', product_type: 'service' },
  { category_name: 'Custom Cloning Services', external_id: 'synthesis-cloning-services', product_type: 'service' },
  { category_name: 'Stable Cell Line Services', external_id: 'cell-line-services', product_type: 'service' },
  { category_name: 'Lentivirus Package Services', external_id: 'virus-packaging-services', product_type: 'service' },
  { category_name: 'Vector Construction Support', external_id: 'vector-construction-services', product_type: 'service' },
  { category_name: 'Functional Testing', external_id: 'functional-testing-services', product_type: 'service' },
  { category_name: 'Experiment Services', external_id: 'experiment-services', product_type: 'service' },
  { category_name: 'Lab Supplies', external_id: 'lab-supplies-services', product_type: 'service' },
  { category_name: 'Project Consultation', external_id: 'project-consultation-services', product_type: 'service' },

  // Reagents
  { category_name: 'DNA Reagents', external_id: 'category-1765063995229', product_type: 'reagent' },
  { category_name: 'RNA Reagents', external_id: 'category-1766675380397', product_type: 'reagent' },
  { category_name: 'Protein Reagents', external_id: 'category-1766675365489', product_type: 'reagent' },
  { category_name: 'Cell Reagents', external_id: 'category-1765995504911', product_type: 'reagent' },

  // Consumables
  { category_name: 'Consumables', external_id: 'category-1780539818236', product_type: 'consumable' },
];

const categoryIcons = {
  'Genome Editing': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24"/>
    </svg>
  ),
  'Vector Stock': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
    </svg>
  ),
  'IVT mRNA': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v18M18 3v18M6 9c3 0 3-3 6-3s3 3 6 3M6 15c3 0 3-3 6-3s3 3 6 3"/>
    </svg>
  ),
  'Purified Protein': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2v4m10-4v4M5 6h14a2 2 0 012 2v2a6 6 0 01-6 6h-6a6 6 0 01-6-6V8a2 2 0 012-2zM9 16v4a2 2 0 002 2h2a2 2 0 002-2v-4"/>
    </svg>
  ),
  'Virus Product': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.93 4.93l2.12 2.12m9.9 9.9l2.12 2.12M4.93 19.07l2.12-2.12m9.9-9.9l2.12-2.12"/>
    </svg>
  ),
  'Cell Lines': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>
    </svg>
  ),
  'Genome Editing Services': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24"/>
    </svg>
  ),
  'Custom Cloning Services': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    </svg>
  ),
  'Stable Cell Line Services': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  ),
  'Protein Purification': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"/>
    </svg>
  ),

  'DNA Reagents': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.25-2.5 3-2.5 5h20c0-2-1-3.75-2.5-5"/>
      <path d="M12 2v14"/>
      <circle cx="12" cy="5" r="3"/>
    </svg>
  ),
  'RNA Reagents': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18M3 6h18M3 18h18"/>
    </svg>
  ),
  'Protein Reagents': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"/>
    </svg>
  ),
  'Cell Reagents': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  ),
  'Consumables': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    </svg>
  ),
};

const getMenuCatalogNumber = (item) => {
  const directCatalogNumber = String(item?.catalog_number || '').trim();
  if (directCatalogNumber) return directCatalogNumber;

  const titleMatch = String(item?.product_name || '').match(/\(([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)\)\s*$/i);
  return titleMatch?.[1] || '';
};

const sortMenuItemsByCatalogNumber = (items) => (
  [...(items || [])]
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftCatalogNumber = getMenuCatalogNumber(left.item);
      const rightCatalogNumber = getMenuCatalogNumber(right.item);

      if (!leftCatalogNumber && rightCatalogNumber) return 1;
      if (leftCatalogNumber && !rightCatalogNumber) return -1;

      const catalogComparison = leftCatalogNumber.localeCompare(rightCatalogNumber, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      if (catalogComparison !== 0) return catalogComparison;

      const nameComparison = String(left.item?.product_name || '').localeCompare(
        String(right.item?.product_name || ''),
        undefined,
        { numeric: true, sensitivity: 'base' },
      );
      return nameComparison || left.index - right.index;
    })
    .map(({ item }) => item)
);

const getCategorySubcategories = (cat) => {
  if (cat.subcategories && cat.subcategories.length > 0) {
    return cat.subcategories;
  }
  const id = cat.external_id;
  if (id === 'genome-editing') {
    return [
      {
        name: 'Genome Editing Tools',
        products: [
          { product_name: 'Cas9 Nuclease (S. pyogenes) Recombinant', external_id: 'cas9-nuclease-recombinant', catalog_number: 'CAS-001' },
          { product_name: 'CRISPR Knockdown Kit', external_id: 'crispr-knockdown-kit', catalog_number: 'GEX-007' },
          { product_name: 'KnockIn Kit at Safe Harbor Sites', external_id: 'knockin-kit-safe-harbor', catalog_number: 'GEX-003' },
        ]
      }
    ];
  }
  if (id === 'vector-clones') {
    return [
      {
        name: 'Vector Stocks',
        products: [
          { product_name: 'cDNA Vector Stock', external_id: 'cdna-vector-stock', catalog_number: 'VC-001' }
        ]
      }
    ];
  }
  if (id === 'category-1765063995229') {
    return [
      {
        name: 'qPCR Reagents',
        products: [
          { product_name: 'THUNDERBIRD Probe qPCR Mix', external_id: 'thunderbird-probe-qpcr-mix', catalog_number: 'QPS-101' },
          { product_name: 'THUNDERBIRD Next Probe qPCR Mix', external_id: 'thunderbird-next-probe-qpcr-mix', catalog_number: 'QPX-101' },
          { product_name: 'THUNDERBIRD SYBR qPCR Mix', external_id: 'thunderbird-sybr-qpcr-mix', catalog_number: 'QPS-201' },
        ]
      },
      {
        name: 'PCR Enzymes',
        products: [
          { product_name: 'Taq DNA Polymerase', external_id: 'taq-dna-polymerase', catalog_number: 'TAP-201' },
          { product_name: 'rTaq DNA Polymerase', external_id: 'rtaq-dna-polymerase', catalog_number: 'TAP-202' },
        ]
      }
    ];
  }
  if (id === 'category-1766675380397') {
    return [
      {
        name: 'Reverse Transcription',
        products: [
          { product_name: 'ReverTra Ace qPCR RT Kit', external_id: 'revertra-ace-qpcr-rt-kit', catalog_number: 'TRT-101' },
          { product_name: 'ReverTra Ace qPCR RT Master Mix', external_id: 'revertra-ace-qpcr-rt-master-mix', catalog_number: 'TRT-201' },
        ]
      }
    ];
  }
  if (id === 'category-1766675365489') {
    return [
      {
        name: 'Precast Protein Gels',
        products: [
          { product_name: 'FuturePAGE™ 4-12% Precast Mini Protein Gel', external_id: 'futurepage-4-12-precast-mini-protein-gel', catalog_number: 'FPG-412' },
          { product_name: 'FuturePAGE™ 4-20% Precast Mini Protein Gel', external_id: 'futurepage-4-20-precast-mini-protein-gel', catalog_number: 'FPG-420' },
        ]
      }
    ];
  }
  if (id === 'category-1765995504911') {
    return [
      {
        name: 'Fetal Bovine Serum (FBS)',
        products: [
          { product_name: 'Premium USDA-Origin Fetal Bovine Serum (FBS)', external_id: 'premium-usda-origin-fbs-lonsera', catalog_number: 'LNS-FBS-001' },
          { product_name: 'Standard-Grade Fetal Bovine Serum (FBS)', external_id: 'standard-grade-fbs-lonsera', catalog_number: 'LNS-FBS-002' },
        ]
      }
    ];
  }
  if (id === 'category-1780539818236') {
    return [
      {
        name: 'Culture Tubes & Storage',
        products: [
          { product_name: '15 mL Round-Bottom Culture Tube, Sterile', external_id: '15-ml-round-bottom-culture-tube-sterile', catalog_number: 'CT-15R' },
          { product_name: '2.0 mL Sterile Cryogenic Vial (Liquid Nitrogen)', external_id: '2-0-ml-sterile-cryogenic-vial-liquid-nitrogen', catalog_number: 'CV-20LN' },
        ]
      }
    ];
  }
  if (id === 'lentivirus') {
    return [
      {
        name: 'Lentivirus Products',
        products: [
          { product_name: 'Lentivirus ORF Stock', external_id: 'lentivirus-orf-stock', catalog_number: 'LV-ORF' },
          { product_name: 'Lentivirus Control Stock', external_id: 'lentivirus-control-stock', catalog_number: 'LV-CTR' }
        ]
      }
    ];
  }
  if (id === 'stable-cell-lines') {
    return [
      {
        name: 'Stable Cell Lines',
        products: [
          { product_name: 'Stable Cell Line Stock', external_id: 'stable-cell-line-stock', catalog_number: 'SCL-001' }
        ]
      }
    ];
  }
  if (id === 'category-1764975769330') {
    return [
      {
        name: 'Purified Proteins',
        products: [
          { product_name: 'Cas9 Nuclease (S. pyogenes) Recombinant', external_id: 'cas9-nuclease-recombinant', catalog_number: 'CAS-001' }
        ]
      }
    ];
  }
  if (id === 'category-1764975611348') {
    return [
      {
        name: 'IVT mRNA',
        products: [
          { product_name: 'CleanCap® FLuc mRNA', external_id: 'cleancap-fluc-mrna', catalog_number: 'mRNA-001' },
          { product_name: 'CleanCap® EGFP mRNA', external_id: 'cleancap-egfp-mrna', catalog_number: 'mRNA-002' }
        ]
      }
    ];
  }

  // Default Fallbacks for Services
  if (id === 'genome-editing-services') {
    return [
      {
        name: 'Genome Editing Overview & Tools',
        products: [
          { product_name: 'Genome Editing Services', external_id: 'genome-editing-services' },
          { product_name: 'CRISPR Services Overview (GEDT)', external_id: 'genome-editing' },
          { product_name: 'CRISPR Deletion Service (GEDT-012)', external_id: 'crispr-knockout' },
          { product_name: 'CRISPR Targeting KnockIn (GEDT-013)', external_id: 'crispr-targeting-knockin-service-gedt-013' },
        ]
      },
      {
        name: 'Gene Engineering',
        products: [
          { product_name: 'Gene Tagging Service', external_id: 'gene-tagging-service' },
          { product_name: 'Gene Knockout Service', external_id: 'gene-knockout-service' },
          { product_name: 'CRISPR Primer Editing (GEDT-033)', external_id: 'crispr-primer-editing-cbe-033' },
          { product_name: 'CRISPR ABE/CBE Editing (GEDT-031)', external_id: 'crispr-abe-editing-gedt-031' },
        ]
      },
      {
        name: 'Inducible & Overexpression',
        products: [
          { product_name: 'CRISPR Targeting Inducible Expression Service (IDCB-021)', external_id: 'crispr-targeting-inducible-expression-service' },
          { product_name: 'Classical Inducible Expression Service (IDCB-011)', external_id: 'classical-inducible-expression-service' },
          { product_name: 'CRISPR Targeting OverExp Service (ORFX-021)', external_id: 'crispr-targeting-overexp-service' },
          { product_name: 'Classical OverExpression Service (ORFX-011)', external_id: 'classical-overexpression-service' },
        ]
      },
      {
        name: 'RNA & miRNA Editing',
        products: [
          { product_name: 'RNA Editing Overview (RNET)', external_id: 'rna-editing-overview-rnet' },
          { product_name: 'Classical miRNA service (RNET-012)', external_id: 'classical-mirna-service' },
          { product_name: 'CRISPR RNAi Service (RNET-021)', external_id: 'crispr-rnai-service' },
          { product_name: 'Classical RNAi Service (RNET-011)', external_id: 'classical-rnai-service' },
        ]
      },
      {
        name: 'CRISPR Imaging & Regulation',
        products: [
          { product_name: 'CRISPR Imaging Service (GEDT-023)', external_id: 'crispr-imaging-service-gedt-033' },
          { product_name: 'CRISPR Inhibition Service (GEDT-022)', external_id: 'crispr-inhibition-service-gedt-022' },
          { product_name: 'CRISPR Activation Service (GEDT-021)', external_id: 'crispr-activation-service-gedt-021' },
        ]
      }
    ];
  }
  if (id === 'synthesis-cloning-services') {
    return [
      {
        name: 'Cloning Services',
        products: [
          { product_name: 'Custom Cloning Services', external_id: 'custom-cloning' },
          { product_name: 'Plasmid Cloning Service Overview', external_id: 'dna-cloning-service' },
          { product_name: 'Standard Cloning Service (PCST)', external_id: 'standard-cloning-service-pcst' },
          { product_name: 'BioArk Complex Cloning Sevice (PCBC)', external_id: 'bioark-complex-cloning-sevice-pcbc' },
          { product_name: 'BioArk Vector Cloning Service (PCBA)', external_id: 'bioark-vector-cloning-services' },
          { product_name: 'Custom Cloning Service (PCCT)', external_id: 'custom-cloning-pcct' },
          { product_name: 'Subcloning Services (PCSC)', external_id: 'subcloning-services-pcsc' },
        ]
      },
      {
        name: 'Plasmid Prep & Mutagenesis',
        products: [
          { product_name: 'Plasmid Preparation Service (PPMX)', external_id: 'plasmid-preparation-service' },
          { product_name: 'Plasmid Mutagenesis Service (PLMU)', external_id: 'mutagenesis-service-plmu' },
        ]
      }
    ];
  }
  if (id === 'cell-line-services') {
    return [
      {
        name: 'Cell Line Generation & Research',
        products: [
          { product_name: 'Stable Cell Line Services', external_id: 'stable-cell-line' },
          { product_name: 'Stable Cell Pool Service Overview', external_id: 'cell-line-generation' },
          { product_name: 'Cell Research Service Overview', external_id: 'cell-research-service-overview' },
          { product_name: 'Stable Single Clone Overview', external_id: 'stable-single-clone-overview' },
        ]
      },
      {
        name: 'Cell Expression Services',
        products: [
          { product_name: 'Inducible Expression Service', external_id: 'inducible-expression-service' },
          { product_name: 'OverExpression Service', external_id: 'overexpression-service-2' },
          { product_name: 'RNAi Exp Service', external_id: 'rnai-service' },
          { product_name: 'CRISPR Exp Service', external_id: 'crispr-exp-service' },
        ]
      },
      {
        name: 'Stable Single Clones',
        products: [
          { product_name: 'Inducible Stable Clone', external_id: 'inducible-stable-clone' },
          { product_name: 'Overexpression Stable Clone', external_id: 'overexpression-stable-clone' },
          { product_name: 'RNAi Stable Clone', external_id: 'rnai-stable-clone' },
          { product_name: 'CRISPR Stable Clone', external_id: 'crispr-stable-clone' },
        ]
      },
      {
        name: 'Stable Cell Pools',
        products: [
          { product_name: 'Inducible Cell Pool', external_id: 'inducible-cell-pool' },
          { product_name: 'OverExpression Cell Pool', external_id: 'overexpression-cell-pool' },
          { product_name: 'RNAi Cell Pool', external_id: 'rnai-cell-pool' },
          { product_name: 'CRISPR Cell Pool', external_id: 'crispr-cell-pool' },
        ]
      }
    ];
  }
  if (id === 'virus-packaging-services') {
    return [
      {
        name: 'Viral Vector Packaging',
        products: [
          { product_name: 'Lentivirus Package Services', external_id: 'lentivirus-package' },
          { product_name: 'Virus Packaging Overview', external_id: 'virus-packaging-overview' },
          { product_name: 'AAV Packaging Services (AAVP)', external_id: 'aav-packaging-services' },
          { product_name: 'Lentivirus Packaging Services', external_id: 'lentivirus-packaging-services' },
        ]
      }
    ];
  }
  if (id === 'protein-purification-services') {
    return [
      {
        name: 'Mammalian Cell Purification',
        products: [
          { product_name: 'CHO Antibody Protein Purification', external_id: 'cho-antibody-protein-purification' },
          { product_name: '293T Antigen Protein Purification', external_id: '293t-antigen-protein-purification' },
        ]
      },
      {
        name: 'Bacterial & Insect Purification',
        products: [
          { product_name: 'Ecoil Protein Purification', external_id: 'ecoil-protein-purification' },
          { product_name: 'Sf9 Protein Purification', external_id: 'sf9-cell-protein-purification' },
        ]
      }
    ];
  }
  if (id === 'vector-construction-services') {
    return [
      {
        name: 'Vector Support',
        products: [
          { product_name: 'Vector Construction Support', external_id: 'vector-construction-support' }
        ]
      }
    ];
  }
  if (id === 'functional-testing-services') {
    return [
      {
        name: 'Functional Validation',
        products: [
          { product_name: 'Functional Testing', external_id: 'functional-testing' }
        ]
      }
    ];
  }
  if (id === 'experiment-services') {
    return [
      {
        name: 'Research Support',
        products: [
          { product_name: 'Experiment Services', external_id: 'experiment-services' }
        ]
      }
    ];
  }
  if (id === 'lab-supplies-services') {
    return [
      {
        name: 'Laboratory Consumables',
        products: [
          { product_name: 'Lab Supplies', external_id: 'lab-supplies' },
          { product_name: 'mRNA LNP packaging Service', external_id: 'mrna-lnp-packaging-service' },
        ]
      }
    ];
  }
  if (id === 'project-consultation-services') {
    return [
      {
        name: 'Consultation Services',
        products: [
          { product_name: 'Project Consultation', external_id: 'project-consultation' }
        ]
      }
    ];
  }
  return [];
};


function SiteHeader({ navigate, currentUser, currentUserProfile, onOpenAuth, onLogout, cartCount }) {
  const [query, setQuery] = useState('');
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [reagentMenuOpen, setReagentMenuOpen] = useState(false);
  const [consumablesMenuOpen, setConsumablesMenuOpen] = useState(false);
  const [aboutMenuOpen, setAboutMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const profileMenuRef = React.useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadCatalogAndProducts = async () => {
      try {
        const data = await apiFetch('/api/products/get-nav-catalog/');
        if (isMounted && Array.isArray(data)) {
          setCatalog(data);
          
          // Auto-select the first product category as default activeCategory
          const firstProd = data.find(c => !c.product_type || c.product_type === 'product');
          if (firstProd) {
            setActiveCategory(firstProd.external_id);
          }
        }
      } catch (err) {
        console.error('Failed to load navigation catalog:', err);
      }
    };

    loadCatalogAndProducts();

    return () => { isMounted = false; };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      closeMenus();
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const closeMenus = useCallback(() => {
    setProductMenuOpen(false);
    setServiceMenuOpen(false);
    setReagentMenuOpen(false);
    setConsumablesMenuOpen(false);
    setAboutMenuOpen(false);
    setProfileMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) {
      return;
    }

    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [profileMenuOpen]);

  const MenuCloseButton = ({ label = 'Close menu' }) => (
    <button className="menu-panel-close" type="button" aria-label={label} onClick={closeMenus}>
      <span aria-hidden="true">×</span>
    </button>
  );

  const activeCatalogEntry = catalog.find((c) => c.external_id === activeCategory);
  const firstName = currentUserProfile?.first_name || currentUser?.split('@')[0] || 'user';
  const profileAltText = `Hi, ${firstName}`;
  const isAdminUser = Boolean(currentUserProfile?.isAdmin || currentUserProfile?.is_admin);

  const productCategories = catalog.filter((c) => !c.product_type || c.product_type === 'product');
  const serviceCategories = catalog.filter((c) => c.product_type === 'service');
  
  // Combine Reagents and Consumables categories, placing Consumables directly below Cell Reagents
  const pureReagents = catalog.filter((c) => c.product_type === 'reagent' && c.external_id !== 'category-1780539818236');
  const consumablesCat = catalog.find((c) => c.product_type === 'consumable' || c.external_id === 'category-1780539818236');
  const reagentCategories = [...pureReagents];
  if (consumablesCat) {
    const cellIdx = reagentCategories.findIndex(c => c.category_name === 'Cell Reagents' || c.external_id === 'category-1765995504911');
    if (cellIdx !== -1) {
      reagentCategories.splice(cellIdx + 1, 0, consumablesCat);
    } else {
      reagentCategories.push(consumablesCat);
    }
  }
  const consumableCategories = consumablesCat ? [consumablesCat] : [];

  const renderMegaMenu = (menuOpenState, menuType, menuCategories, menuCloseLabel) => {
    if (!menuOpenState) return null;

    const activeEntry = menuCategories.find((c) => c.external_id === activeCategory) || menuCategories[0];
    const rawActiveSubcategories = activeEntry ? (activeEntry.subcategories && activeEntry.subcategories.length > 0
      ? activeEntry.subcategories
      : getCategorySubcategories(activeEntry)) : [];
    const activeSubcategories = rawActiveSubcategories.map((subcategory) => ({
      ...subcategory,
      products: sortMenuItemsByCatalogNumber(subcategory.products),
    }));
    
    const totalCount = activeEntry ? (activeEntry.product_count > 0
      ? activeEntry.product_count
      : activeSubcategories.reduce((acc, sub) => acc + (sub.products?.length || 0), 0)) : 0;

    const targetCategoryParam = activeEntry ? (
      activeEntry.product_type === 'product' ? 'products' :
      (activeEntry.product_type === 'service' ? 'services' :
      (activeEntry.product_type === 'consumable' || activeEntry.external_id === 'category-1780539818236' ? 'consumables' : 'reagents'))
    ) : 'products';

    return (
      <div className={`products-mega-menu catalog-mega-menu ${menuType}-mega-menu`} id={`${menuType}-menu`}>
        <MenuCloseButton label={menuCloseLabel} />

        {/* Category sidebar */}
        <div className="catalog-sidebar">
          <div className="catalog-sidebar-title">
            {menuType === 'reagent' ? 'Reagents' : (menuType.charAt(0).toUpperCase() + menuType.slice(1))} Categories
          </div>
          {menuCategories.map((cat) => (
            <button
              key={cat.external_id}
              className={`catalog-category-btn ${activeCategory === cat.external_id ? 'is-active' : ''}`}
              type="button"
              title={cat.category_name}
              onMouseEnter={() => setActiveCategory(cat.external_id)}
              onClick={(e) => {
                e.preventDefault();
                setActiveCategory(cat.external_id);
              }}
            >
              <span className="catalog-category-icon">
                {categoryIcons[cat.category_name] || categoryIcons['Genome Editing']}
              </span>
              <span className="catalog-category-label">{cat.category_name}</span>
              {cat.product_count > 0 && (
                <span className="catalog-category-count">({cat.product_count})</span>
              )}
              <span className="catalog-category-arrow">›</span>
            </button>
          ))}
        </div>

        {/* Detail panel for active category */}
        <div className="catalog-detail">
          {activeEntry && (
            <>
              <div className="catalog-detail-header">
                <a
                  className="catalog-detail-title"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    closeMenus();
                    navigate(`/search?category=${targetCategoryParam}&cat=${activeEntry.external_id}`);
                  }}
                >
                  {activeEntry.category_name}
                  {totalCount > 0 && (
                    <span className="catalog-detail-count">{totalCount} items</span>
                  )}
                </a>
              </div>

              {totalCount === 0 ? (
                <div className="catalog-empty">
                  <div className="catalog-empty-icon">🧬</div>
                  <p>Products coming soon</p>
                  <a
                    href="#"
                    className="catalog-browse-link"
                    onClick={(e) => {
                      e.preventDefault();
                      closeMenus();
                      navigate('/request-quote');
                    }}
                  >
                    Request a quote →
                  </a>
                </div>
              ) : (
                <div className="catalog-subcategories">
                  {activeSubcategories.map((sub) => (
                    <div className="catalog-subcategory" key={sub.name || '__default'}>
                      {sub.name && (
                        <div className="catalog-subcategory-name">
                          <span className="catalog-sub-dot" />
                          {sub.name}
                        </div>
                      )}
                      <div className="catalog-products-list">
                        {(sub.products || []).map((product) => (
                          <a
                            key={product.external_id}
                            className="catalog-product-link"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              closeMenus();
                              navigate(`/product/${product.externalId || product.external_id}`);
                            }}
                          >
                            <span className="catalog-product-name">{product.product_name}</span>
                            {product.catalog_number && (
                              <span className="catalog-product-sku">{product.catalog_number}</span>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="catalog-detail-footer">
                <a
                  href="#"
                  className="catalog-view-all"
                  onClick={(e) => {
                    e.preventDefault();
                    closeMenus();
                    navigate(`/search?category=${targetCategoryParam}&cat=${activeEntry.external_id}`);
                  }}
                >
                  View all {activeEntry.category_name} →
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <header className="site-header">
      <div className="topbar">
        <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} aria-label="Bio Ark Tech home">
          <img src={logo} alt="Bio Ark Tech" />
        </a>

        <form className="search" role="search" onSubmit={handleSearchSubmit}>
          <input 
            aria-label="Search products" 
            placeholder="Search products, categories, or applications..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <div className="header-actions" aria-label="Account and cart">
          {currentUser ? (
            <div className={`profile-menu ${profileMenuOpen ? 'is-open' : ''}`} ref={profileMenuRef}>
              <button
                type="button"
                className="profile-icon-button"
                aria-label={profileAltText}
                title={profileAltText}
                aria-expanded={profileMenuOpen}
                aria-controls="profile-menu"
                onClick={() => {
                  closeMenus();
                  setProfileMenuOpen((isOpen) => !isOpen);
                }}
              >
                <span aria-hidden="true">{firstName.charAt(0).toUpperCase()}</span>
              </button>
              {profileMenuOpen && (
                <div className="profile-dropdown" id="profile-menu">
                  <div className="profile-dropdown-greeting">{profileAltText}</div>
                  <a href="/profile" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/profile'); }}>
                    My Profile
                  </a>
                  <a href="/profile?tab=orders" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/profile?tab=orders'); }}>
                    My Purchases
                  </a>
                  <a href="/profile?tab=quotes" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/profile?tab=quotes'); }}>
                    My Quotes
                  </a>
                  {isAdminUser && (
                    <a href="/admin" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/admin'); }}>
                      Admin Console
                    </a>
                  )}
                  <a href="#" onClick={(e) => { e.preventDefault(); closeMenus(); onLogout(); }}>
                    Sign Out
                  </a>
                </div>
              )}
            </div>
          ) : (
            <a href="#" onClick={(e) => { e.preventDefault(); onOpenAuth(); }}>Sign In</a>
          )}
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/cart'); }}>Cart ({cartCount || 0})</a>
        </div>
      </div>

      <nav className="main-nav" aria-label="Primary navigation">
        <div 
          className={`products-nav ${productMenuOpen ? 'is-open' : ''}`}
          onMouseEnter={() => {
            closeMenus();
            setProductMenuOpen(true);
            const first = catalog.find(c => !c.product_type || c.product_type === 'product');
            if (first) {
              setActiveCategory(first.external_id);
            }
          }}
          onMouseLeave={closeMenus}
        >
          <button
            className="nav-trigger products-trigger"
            type="button"
            aria-expanded={productMenuOpen}
            aria-controls="products-menu"
            onClick={() => {
              closeMenus();
              setProductMenuOpen((isOpen) => !isOpen);
              if (!productMenuOpen) {
                const first = catalog.find(c => !c.product_type || c.product_type === 'product');
                if (first) setActiveCategory(first.external_id);
              }
            }}
          >
            Products
          </button>
          {productMenuOpen && renderMegaMenu(productMenuOpen, 'product', productCategories, 'Close products menu')}
        </div>

        <div 
          className={`products-nav services-nav ${serviceMenuOpen ? 'is-open' : ''}`}
          onMouseEnter={() => {
            closeMenus();
            setServiceMenuOpen(true);
            const first = catalog.find(c => c.product_type === 'service');
            if (first) {
              setActiveCategory(first.external_id);
            }
          }}
          onMouseLeave={closeMenus}
        >
          <button
            className="nav-trigger services-trigger"
            type="button"
            aria-expanded={serviceMenuOpen}
            aria-controls="services-menu"
            onClick={() => {
              closeMenus();
              setServiceMenuOpen((isOpen) => !isOpen);
              if (!serviceMenuOpen) {
                const first = catalog.find(c => c.product_type === 'service');
                if (first) setActiveCategory(first.external_id);
              }
            }}
          >
            Services
          </button>
          {serviceMenuOpen && renderMegaMenu(serviceMenuOpen, 'service', serviceCategories, 'Close services menu')}
        </div>

        <div 
          className={`products-nav reagents-nav ${reagentMenuOpen ? 'is-open' : ''}`}
          onMouseEnter={() => {
            closeMenus();
            setReagentMenuOpen(true);
            const first = catalog.find(c => c.product_type === 'reagent' && c.external_id !== 'category-1780539818236');
            if (first) {
              setActiveCategory(first.external_id);
            }
          }}
          onMouseLeave={closeMenus}
        >
          <button
            className="nav-trigger reagents-trigger"
            type="button"
            aria-expanded={reagentMenuOpen}
            aria-controls="reagents-menu"
            onClick={() => {
              closeMenus();
              setReagentMenuOpen((isOpen) => !isOpen);
              if (!reagentMenuOpen) {
                const first = catalog.find(c => c.product_type === 'reagent' && c.external_id !== 'category-1780539818236');
                if (first) setActiveCategory(first.external_id);
              }
            }}
          >
            Reagents & Kits
          </button>
          {reagentMenuOpen && renderMegaMenu(reagentMenuOpen, 'reagent', reagentCategories, 'Close reagents menu')}
        </div>
        {/* Consumables link is now placed inside Reagents & Kits below Cell Reagents */}

        <a className="nav-link-plain" href="/design" onMouseEnter={closeMenus} onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/design'); }}>Design</a>
        <a className="nav-link-plain" href="/blogs" onMouseEnter={closeMenus} onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/blogs'); }}>Resources & Blogs</a>

        <div 
          className={`nav-dropdown ${aboutMenuOpen ? 'is-open' : ''}`}
          onMouseEnter={() => {
            closeMenus();
            setAboutMenuOpen(true);
          }}
          onMouseLeave={closeMenus}
        >
          <button
            className="nav-trigger"
            type="button"
            aria-expanded={aboutMenuOpen}
            aria-controls="about-menu"
            onClick={() => {
              closeMenus();
              setAboutMenuOpen((isOpen) => !isOpen);
            }}
          >
            About
          </button>
          {aboutMenuOpen && (
            <div className="dropdown-menu" id="about-menu">
              <a href="/investors" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/investors'); }}>Investors</a>
              <a href="/about-bioark" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/about-bioark'); }}>Why BioArk</a>
            </div>
          )}
        </div>
        <a
          className="quote-button"
          onMouseEnter={closeMenus}
          href="/request-quote"
          onClick={(e) => {
            e.preventDefault();
            closeMenus();
            navigate('/request-quote');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          Request a Quote
        </a>
      </nav>
    </header>
  );
}

export default SiteHeader;
