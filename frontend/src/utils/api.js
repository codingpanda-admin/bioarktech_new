export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const logo = '/img/logo_homepage_1.png';

export const mockCategories = [
  { category_name: 'Gene Editing Tools', icon: 'dna' },
  { category_name: 'PCR & qPCR Reagents', icon: 'molecule' },
  { category_name: 'Electrophoresis Gel Imaging', icon: 'scope' },
  { category_name: 'Cell Culture Viability', icon: 'cell' },
  { category_name: 'Enzymes & Proteins', icon: 'nodes' },
  { category_name: 'Tags & Reporters', icon: 'tag' },
  { category_name: 'Kits & Buffers', icon: 'bottle' },
  { category_name: 'All Products', icon: 'arrow' },
]

export const mockProducts = [
  { product_name: 'BioArk Agarose LE (Low EEO) High Strength', unit_price: 29.00, visual: 'bottle', reviews: '129' },
  { product_name: 'Premium dNTP Mix (2.5 mM each)', unit_price: 29.00, visual: 'vial', reviews: '94' },
  { product_name: 'Cas9 Nuclease (S. pyogenes) Recombinant', unit_price: 89.00, visual: 'dna', reviews: '76' },
  { product_name: 'NEB CutSmart Buffer (10X)', unit_price: 19.00, visual: 'buffer', reviews: '110' },
  { product_name: 'Protein Ladder (10-250 kDa) Ready-to-Use', unit_price: 29.00, visual: 'tubes', reviews: '63' },
  { product_name: '1 kb Plus DNA Ladder (0.1-10 kb)', unit_price: 25.00, visual: 'ladder', reviews: '88' },
  { product_name: 'Plasmid Mini Prep Kit (50 preps)', unit_price: 49.00, visual: 'kit', reviews: '54' },
  { product_name: 'BioArkTech Gel Documentation System (1200W)', unit_price: 3299.00, visual: 'device', reviews: '41' },
]

export const mockResources = [
  { tag: 'Application Note', title: 'CRISPR Knockout Workflow: A Step-by-Step Guide', date: 'May 8, 2024', readTime: '3 min read' },
  { tag: 'Technical Guide', title: 'qPCR Best Practices for Reliable Gene Expression Analysis', date: 'April 24, 2024', readTime: '4 min read' },
  { tag: 'Product Spotlight', title: 'BioArk Agarose LE: High Resolution You Can Trust', date: 'April 10, 2024', readTime: '2 min read' },
]

// API Fetch Helper with CSRF & Credentials support
export const apiFetch = async (endpoint, options = {}) => {
  if (options.method && options.method !== 'GET') {
    let csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    if (!csrfToken) {
      try {
        const csrfRes = await fetch(`${API_URL}/api/csrf/`, { credentials: 'include' });
        const csrfData = await csrfRes.json();
        csrfToken = csrfData.csrftoken;
      } catch (err) {
        console.error("Could not fetch CSRF token", err);
      }
    }
    
    if (csrfToken) {
      options.headers = {
        ...options.headers,
        'X-CSRFToken': csrfToken,
      };
    }
  }

  options.credentials = 'include';

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    options.body = JSON.stringify(options.body);
    options.headers = {
      ...options.headers,
      'Content-Type': 'application/json',
    };
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const responseText = await response.text().catch(() => '');
    let errorData = {};
    try {
      errorData = responseText ? JSON.parse(responseText) : {};
    } catch (err) {
      errorData = {};
    }

    throw new Error(errorData.detail || errorData.message || responseText || `The request failed with status ${response.status}.`);
  }

  return response.json();
};

// Map category symbols to icons
export const getCategoryIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes('edit') || n.includes('dna')) return 'dna';
  if (n.includes('pcr') || n.includes('molecule')) return 'molecule';
  if (n.includes('gel') || n.includes('scope') || n.includes('electrophoresis')) return 'scope';
  if (n.includes('cell') || n.includes('culture')) return 'cell';
  if (n.includes('enzyme') || n.includes('protein')) return 'nodes';
  if (n.includes('tag')) return 'tag';
  if (n.includes('kit') || n.includes('buffer')) return 'bottle';
  return 'arrow';
};

export const getProductShippingCost = (product) => {
  if (!product) return 40;
  
  // Use backend provided shipping cost if available
  if (product.shipping_cost !== undefined && product.shipping_cost !== null) {
    return Number(product.shipping_cost);
  }
  
  const category = (product.category || "").toLowerCase();
  if (category === 'consumables' || category === 'consumibles') {
    return 100;
  }
  
  const name = (product.product_name || "").toLowerCase();
  const sku = (product.product_sku || product.catalog_number || "").toLowerCase();
  const description = (product.description || "").toLowerCase();
  const categoryName = (product.category_name || product.product_category || "").toLowerCase();

  // Consumables ($100 shipping) match items containing keywords: system, device, cell line, cell type, cloning, vector
  const consumableKeywords = ['system', 'device', 'cell line', 'cell type', 'cloning', 'vector'];
  const hasConsumableKeyword = consumableKeywords.some(kw => 
    name.includes(kw) || 
    sku.includes(kw) || 
    description.includes(kw) || 
    categoryName.includes(kw)
  );

  if (hasConsumableKeyword) {
    return 100;
  }

  // If it is a featured product (catalog_number) and has empty ship_info or ship_info doesn't contain wet ice, it's a consumable
  if (product.catalog_number) {
    const shipInfo = (product.ship_info || "").toLowerCase();
    if (!shipInfo || !shipInfo.includes("wet ice")) {
      return 100;
    }
  }

  return 40;
};

// Formats file URLs safely, avoiding double-protocol prefix issues and relative media directory issues
export const formatAssetUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  let cleanUrl = url;
  
  // If it points to the legacy content-api uploads path, map it to media root
  if (cleanUrl.startsWith('/content-api/uploads/originals/')) {
    cleanUrl = '/media/' + cleanUrl.substring('/content-api/uploads/originals/'.length);
  } else if (cleanUrl.startsWith('content-api/uploads/originals/')) {
    cleanUrl = '/media/' + cleanUrl.substring('content-api/uploads/originals/'.length);
  }
  
  // If it starts with /images/products/, map it to /media/product_images/
  if (cleanUrl.startsWith('/images/products/')) {
    let filename = cleanUrl.substring('/images/products/'.length);
    filename = filename.replace('-300x300', '');
    cleanUrl = `/media/product_images/${filename}`;
  } else if (cleanUrl.startsWith('images/products/')) {
    let filename = cleanUrl.substring('images/products/'.length);
    filename = filename.replace('-300x300', '');
    cleanUrl = `/media/product_images/${filename}`;
  }
  
  // If it's a relative path that doesn't start with media/ or /media/, prepend /media/
  if (!cleanUrl.startsWith('/') && !cleanUrl.startsWith('media/')) {
    cleanUrl = `/media/${cleanUrl}`;
  } else if (cleanUrl.startsWith('/') && !cleanUrl.startsWith('/media/')) {
    // If it starts with / but not /media/, e.g. /product_images/...
    cleanUrl = `/media${cleanUrl}`;
  } else if (cleanUrl.startsWith('media/')) {
    cleanUrl = `/${cleanUrl}`;
  }

  // Prepend API_URL
  if (cleanUrl.startsWith('/')) {
    return `${API_URL}${cleanUrl}`;
  }
  return `${API_URL}/${cleanUrl}`;
};
