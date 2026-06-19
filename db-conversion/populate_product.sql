-- Populate public.product from C:\development\bioarktech\data\products.JSON
-- Generated from products, overrides, details, hidden, and groupsConfig.

INSERT INTO public.product (
    external_id,
    product_name,
    description,
    image_url,
    product_link,
    category_external_id,
    product_group,
    source_type,
    display_order,
    source_created_at_ms,
    source_created_at,
    catalog_number,
    availability,
    list_price,
    price_range,
    quote_only,
    is_featured,
    show_in_featured,
    show_in_gene_editing,
    key_features,
    options,
    option_prices,
    storage_stability,
    performance_data,
    data_description,
    manuals,
    manual_urls,
    images,
    store_link,
    content_text,
    hidden,
    raw_product,
    raw_override,
    raw_detail
) VALUES
    ('custom-1757608878053', 'custom-1757608878053', NULL, '/images/products/1-BSY3320_2__SYBR_Green_qPCR_Master_Mix-300x300.jpg', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 'In Stock', '', NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, '', '', NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['/images/products/1-BSY3320_2__SYBR_Green_qPCR_Master_Mix-300x300.jpg']::TEXT[], '', '', FALSE, '{"id":"custom-1757608878053"}'::JSONB, NULL, '{"catalogNumber":"","availability":"In Stock","listPrice":"","options":[],"optionPrices":{},"keyFeatures":[],"storageStability":"","performanceData":"","manuals":[],"manualUrls":[],"storeLink":"","quoteOnly":false,"contentText":"","images":["/images/products/1-BSY3320_2__SYBR_Green_qPCR_Master_Mix-300x300.jpg"]}'::JSONB),
    ('custom-1757609198384', 'custom-1757609198384', NULL, '/images/products/1-BSY3323_2__Fast_SYBR_Green_qPCR_Master_Mix-300x300.jpg', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 'In Stock', '', NULL, TRUE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, '', '', NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['/images/products/1-BSY3323_2__Fast_SYBR_Green_qPCR_Master_Mix-300x300.jpg']::TEXT[], 'https://store.bioarktech.com/cart', '', FALSE, '{"id":"custom-1757609198384"}'::JSONB, NULL, '{"catalogNumber":"","availability":"In Stock","listPrice":"","options":[],"optionPrices":{},"keyFeatures":[],"storageStability":"","performanceData":"","manuals":[],"manualUrls":[],"storeLink":"https://store.bioarktech.com/cart","quoteOnly":true,"contentText":"","images":["/images/products/1-BSY3323_2__Fast_SYBR_Green_qPCR_Master_Mix-300x300.jpg"]}'::JSONB),
    ('custom-1757746922797', 'custom-1757746922797', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 'In Stock', '', NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, '', '', NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'https://store.bioarktech.com/cart', '', FALSE, '{"id":"custom-1757746922797"}'::JSONB, NULL, '{"catalogNumber":"","availability":"In Stock","listPrice":"","options":[],"optionPrices":{},"keyFeatures":[],"storageStability":"","performanceData":"","manuals":[],"manualUrls":[],"storeLink":"https://store.bioarktech.com/cart","quoteOnly":false,"contentText":"","images":[]}'::JSONB),
    ('custom-1757747120684', 'custom-1757747120684', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 'In Stock', '', NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, '', '', NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'https://store.bioarktech.com/cart', '', FALSE, '{"id":"custom-1757747120684"}'::JSONB, NULL, '{"catalogNumber":"","availability":"In Stock","listPrice":"","options":[],"optionPrices":{},"keyFeatures":[],"storageStability":"","performanceData":"","manuals":[],"manualUrls":[],"storeLink":"https://store.bioarktech.com/cart","quoteOnly":false,"contentText":"","images":[]}'::JSONB),
    ('custom-1757747406537', 'custom-1757747406537', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 'In Stock', '', NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, '', '', NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'https://store.bioarktech.com/cart', '', FALSE, '{"id":"custom-1757747406537"}'::JSONB, NULL, '{"catalogNumber":"","availability":"In Stock","listPrice":"","options":[],"optionPrices":{},"keyFeatures":[],"storageStability":"","performanceData":"","manuals":[],"manualUrls":[],"storeLink":"https://store.bioarktech.com/cart","quoteOnly":false,"contentText":"","images":[]}'::JSONB),
    ('custom-1757747796374', 'custom-1757747796374', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 'In Stock', '', NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, '', '', NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'https://store.bioarktech.com/cart', '', FALSE, '{"id":"custom-1757747796374"}'::JSONB, NULL, '{"catalogNumber":"","availability":"In Stock","listPrice":"","options":[],"optionPrices":{},"keyFeatures":[],"storageStability":"","performanceData":"","manuals":[],"manualUrls":[],"storeLink":"https://store.bioarktech.com/cart","quoteOnly":false,"contentText":"","images":[]}'::JSONB),
    ('custom-1757748063327', 'custom-1757748063327', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 'In Stock', '$75.00', NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, '', '', NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'https://store.bioarktech.com/cart', '', FALSE, '{"id":"custom-1757748063327"}'::JSONB, NULL, '{"catalogNumber":"","availability":"In Stock","listPrice":"$75.00","options":[],"optionPrices":{},"keyFeatures":[],"storageStability":"","performanceData":"","manuals":[],"manualUrls":[],"storeLink":"https://store.bioarktech.com/cart","quoteOnly":false,"contentText":"","images":[]}'::JSONB),
    ('custom-1762801437711', 'custom-1762801437711', NULL, NULL, NULL, NULL, '3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"custom-1762801437711"}'::JSONB, NULL, NULL),
    ('custom-1762801582044', 'custom-1762801582044', NULL, NULL, NULL, NULL, '2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"custom-1762801582044"}'::JSONB, NULL, NULL),
    ('custom-1762801601793', 'custom-1762801601793', NULL, NULL, NULL, NULL, '2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"custom-1762801601793"}'::JSONB, NULL, NULL),
    ('custom-1762801947809', 'custom-1762801947809', NULL, NULL, NULL, NULL, '3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"custom-1762801947809"}'::JSONB, NULL, NULL),
    ('custom-1762803603192', 'custom-1762803603192', NULL, NULL, NULL, NULL, 'zyy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"custom-1762803603192"}'::JSONB, NULL, NULL),
    ('custom-1764990947079', 'custom-1764990947079', NULL, NULL, NULL, NULL, 'DNA', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"custom-1764990947079"}'::JSONB, NULL, NULL),
    ('fp-badm3362', 'fp-badm3362', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"fp-badm3362"}'::JSONB, NULL, '{"isFeatured":true}'::JSONB),
    ('fp-badm3363', 'fp-badm3363', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"fp-badm3363"}'::JSONB, NULL, '{"isFeatured":true}'::JSONB),
    ('fp-badm3364', 'fp-badm3364', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"fp-badm3364"}'::JSONB, NULL, '{"isFeatured":false}'::JSONB),
    ('fp-bal100468', 'fp-bal100468', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"fp-bal100468"}'::JSONB, NULL, '{"isFeatured":true}'::JSONB),
    ('fp-bapm2083', 'fp-bapm2083', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"fp-bapm2083"}'::JSONB, NULL, '{"isFeatured":true}'::JSONB),
    ('fp-bsy3320', 'fp-bsy3320', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"fp-bsy3320"}'::JSONB, NULL, '{"isFeatured":false}'::JSONB),
    ('fp-bsy3323', 'fp-bsy3323', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"fp-bsy3323"}'::JSONB, NULL, '{"isFeatured":false}'::JSONB),
    ('gep-05', 'KnockIn Kit at Safe Harbor Sites', 'Precise integration to drive robust gene overexpression at safe-harbor or locus-specific sites.', '/content-api/uploads/originals/fc52e6f9-7ac7-4885-9af4-a371e8b37a37.png', '/products/overexpression-targeted-knock-in', 'genome-editing', 'DNA', 'quote', 0, NULL, NULL, 'GEX-003', 'In Stock', '', '$1199+syn.', TRUE, FALSE, FALSE, TRUE, ARRAY['High-purity components for robust genome editing', 'Complete systems for high-titer virus production', 'Scalable solutions for manufacturing', 'Custom-designed for targeted gene editing']::TEXT[], ARRAY['Standard Kit', 'Pro Kit']::TEXT[], '{}'::JSONB, 'Store components at specified temperatures. See manual for details.', 'Consistently high efficiency and low off-target effects reported in publications.', '', ARRAY['Protocol Guide (PDF)', 'Troubleshooting (PDF)']::TEXT[], ARRAY[]::TEXT[], ARRAY['/content-api/uploads/originals/fc52e6f9-7ac7-4885-9af4-a371e8b37a37.png', '/content-api/uploads/originals/10dab363-fd33-419a-9002-6be439265a5d.jpg', '/content-api/uploads/originals/85dd272f-4a6c-40fa-b9ff-b59b48e972ab.jpg']::TEXT[], 'https://store.bioarktech.com/cart', '# Safe Harbor Site Gene Integration

This technique enables the precise integration of target genes or regulatory cassettes into safe harbor sites—genomic regions where foreign DNA can be inserted without disrupting essential endogenous gene functions or causing adverse cellular effects. These sites are widely used in genome engineering for stable gene insertion, ensuring long-term and predictable transgene expression.

Commonly used safe harbor sites include human AAVS1 and CCR5, as well as the mouse ROSA26 locus. Our standard kit utilizes the AAVS1 site as the default insertion locus. For alternative loci or custom services, please contact us at support@bioarktech.com.

## Technical Background

CRISPR-Cas9-mediated targeted knock-in at safe harbor sites involves:

- **Cas9**: An endonuclease that creates a double-strand break (DSB) at the target site.
- **Guide RNA (gRNA)**: Directs Cas9 to the specific safe harbor locus, such as AAVS1 or the mouse ROSA26 locus.
- **Donor DNA template**: A construct containing the desired transgene flanked by homology arms complementary to sequences adjacent to the AAVS1 site, facilitating targeted insertion via homology-directed repair (HDR).

## Key Features of Our Products

### Streamlined CRISPR and Donor Vectors
Designed for efficient target gene integration, outperforming commercially available alternatives.

### Targeted vs. Random Integration
Many conventional approaches rely on non-targeting lentiviruses, leading to random gene integration, which can pose safety risks and unpredictable outcomes, particularly in gene therapy and clinical research.

Our vector and virus kits enable precise, targeted integration at safe harbor sites, significantly reducing these risks.

### User-Friendly Plasmid Kits for Broad Accessibility
Unlike many market solutions that require electroporation—necessitating specialized equipment and techniques—our plasmid-based kits are optimized for ease of use, making them ideal for adherent cancer cell lines.

## Product Catalog

10 entries per page  
Search:  
Edit

| Major Vector | Donor Vector | Scramble Control Vector |
|--------------|--------------|-------------------------|
| **Class** | **Product Name** | **SKU** | **Information** | **Donor Name** | **SKU** | **Information** | **Scramble Name** | **SKU** | **Information** |
| Non-Viral CDS-P011k | CRISPR KN AIO Kit-Gene AAVS1, Vector type | COT-FXD00A-AAVS1gk | The CRISPR tool specifically designed to target and cut human AAVS1 safe harbor site. | AAVS1 Dnr Std Kit | CDS-FX00PA-XXXXXXk | Insert Customer Gene into human AAVS1 site, please specify your genes by clicking the button | GFP Donor Control AAVS1 Dnr Std Ctrl Kit, vector type | CDS-FX0GPA-000000k | Insert GFP into human AAVS1 site as control |
| Non-Viral CDS-P011k | CRISPR KN AIO Kit-Gene ROSA26, Vector type | COT-FXD00A-ROSA26gk | The CRISPR tool specifically designed to target and cut mouse ROSA26 safe harbor site. | Dnr Std Kit-ROSA26 Site | TBD | Insert Customer Gene into mouse ROSA26 site, please specify your custom gene by clicking the button | GFP Donor Control Dnr Std Kit-ROSA26 Site, vector type | TBD | Insert GFP into mouse ROSA26 site as control |

Showing 1 to 3 of 3 entries

Our design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.
', FALSE, '{"id":"gep-05"}'::JSONB, '{"name":"KnockIn Kit at Safe Harbor Sites","description":"Precise integration to drive robust gene overexpression at safe-harbor or locus-specific sites.","link":"/products/overexpression-targeted-knock-in","category":"genome-editing","order":0,"__type":"quote"}'::JSONB, '{"catalogNumber":"GEX-003","availability":"In Stock","listPrice":"","options":["Standard Kit","Pro Kit"],"optionPrices":{},"keyFeatures":["High-purity components for robust genome editing","Complete systems for high-titer virus production","Scalable solutions for manufacturing","Custom-designed for targeted gene editing"],"storageStability":"Store components at specified temperatures. See manual for details.","performanceData":"Consistently high efficiency and low off-target effects reported in publications.","manuals":["Protocol Guide (PDF)","Troubleshooting (PDF)"],"manualUrls":[],"storeLink":"https://store.bioarktech.com/cart","quoteOnly":true,"contentText":"# Safe Harbor Site Gene Integration\n\nThis technique enables the precise integration of target genes or regulatory cassettes into safe harbor sites—genomic regions where foreign DNA can be inserted without disrupting essential endogenous gene functions or causing adverse cellular effects. These sites are widely used in genome engineering for stable gene insertion, ensuring long-term and predictable transgene expression.\n\nCommonly used safe harbor sites include human AAVS1 and CCR5, as well as the mouse ROSA26 locus. Our standard kit utilizes the AAVS1 site as the default insertion locus. For alternative loci or custom services, please contact us at support@bioarktech.com.\n\n## Technical Background\n\nCRISPR-Cas9-mediated targeted knock-in at safe harbor sites involves:\n\n- **Cas9**: An endonuclease that creates a double-strand break (DSB) at the target site.\n- **Guide RNA (gRNA)**: Directs Cas9 to the specific safe harbor locus, such as AAVS1 or the mouse ROSA26 locus.\n- **Donor DNA template**: A construct containing the desired transgene flanked by homology arms complementary to sequences adjacent to the AAVS1 site, facilitating targeted insertion via homology-directed repair (HDR).\n\n## Key Features of Our Products\n\n### Streamlined CRISPR and Donor Vectors\nDesigned for efficient target gene integration, outperforming commercially available alternatives.\n\n### Targeted vs. Random Integration\nMany conventional approaches rely on non-targeting lentiviruses, leading to random gene integration, which can pose safety risks and unpredictable outcomes, particularly in gene therapy and clinical research.\n\nOur vector and virus kits enable precise, targeted integration at safe harbor sites, significantly reducing these risks.\n\n### User-Friendly Plasmid Kits for Broad Accessibility\nUnlike many market solutions that require electroporation—necessitating specialized equipment and techniques—our plasmid-based kits are optimized for ease of use, making them ideal for adherent cancer cell lines.\n\n## Product Catalog\n\n10 entries per page  \nSearch:  \nEdit\n\n| Major Vector | Donor Vector | Scramble Control Vector |\n|--------------|--------------|-------------------------|\n| **Class** | **Product Name** | **SKU** | **Information** | **Donor Name** | **SKU** | **Information** | **Scramble Name** | **SKU** | **Information** |\n| Non-Viral CDS-P011k | CRISPR KN AIO Kit-Gene AAVS1, Vector type | COT-FXD00A-AAVS1gk | The CRISPR tool specifically designed to target and cut human AAVS1 safe harbor site. | AAVS1 Dnr Std Kit | CDS-FX00PA-XXXXXXk | Insert Customer Gene into human AAVS1 site, please specify your genes by clicking the button | GFP Donor Control AAVS1 Dnr Std Ctrl Kit, vector type | CDS-FX0GPA-000000k | Insert GFP into human AAVS1 site as control |\n| Non-Viral CDS-P011k | CRISPR KN AIO Kit-Gene ROSA26, Vector type | COT-FXD00A-ROSA26gk | The CRISPR tool specifically designed to target and cut mouse ROSA26 safe harbor site. | Dnr Std Kit-ROSA26 Site | TBD | Insert Customer Gene into mouse ROSA26 site, please specify your custom gene by clicking the button | GFP Donor Control Dnr Std Kit-ROSA26 Site, vector type | TBD | Insert GFP into mouse ROSA26 site as control |\n\nShowing 1 to 3 of 3 entries\n\nOur design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.\n","images":["/content-api/uploads/originals/fc52e6f9-7ac7-4885-9af4-a371e8b37a37.png","/content-api/uploads/originals/10dab363-fd33-419a-9002-6be439265a5d.jpg","/content-api/uploads/originals/85dd272f-4a6c-40fa-b9ff-b59b48e972ab.jpg"],"priceRange":"$1199+syn.","dataDescription":"","showInFeatured":false,"showInGeneEditing":true,"isFeatured":false}'::JSONB),
    ('vc-01', 'cDNA Vector Stock', 'Ready-to-use cDNA vector stocks for cloning and expression workflows.', '/content-api/uploads/originals/30248855-528e-46b1-9487-e748b7bbe964.png', '/products/cdna-vector-stock', 'vector-clones', 'Stock', 'quote', 0, NULL, NULL, 'VC-001', 'In Stock', 'Contact for Quote', '', TRUE, TRUE, FALSE, FALSE, ARRAY['High-quality backbone', 'Multiple cloning sites', 'Sequence-verified']::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, 'Store at -20°C. See manual for details.', 'Validated for standard cloning workflows.', '', ARRAY['Vector Handbook (PDF)']::TEXT[], ARRAY[]::TEXT[], ARRAY['/content-api/uploads/originals/30248855-528e-46b1-9487-e748b7bbe964.png']::TEXT[], '', 'This technique enables the precise integration of target genes or regulatory cassettes into safe harbor sites—genomic regions where foreign DNA can be inserted without disrupting essential endogenous gene functions or causing adverse cellular effects. These sites are widely used in genome engineering for stable gene insertion, ensuring long-term and predictable transgene expression.

Commonly used safe harbor sites include human AAVS1 and CCR5, as well as the mouse ROSA26 locus. Our standard kit utilizes the AAVS1 site as the default insertion locus. For alternative loci or custom services, please contact us at [support@bioarktech.com](mailto:support@bioarktech.com).

---

| Main Plasmid | Features | | | | | | Scramble Plasmid | Order |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Class** | **Product Name** | **SKU** | **Accessory** | **Promoter** | **Protein Tag** | **Fluorescence Marker** | **Selection Marker** | **Target Gene** | **Control Sample** | **SKU** |
| Viral | OverExp Lenti Kit | EML-CXD0PC-LARGETk | None | PCMV | MycDDK | None | Puro | LargeT | GFP control | EML-CXDGPC-000000k |
| Viral | OverExp Lenti Kit | EML-CXD0BC-LARGETk | None | PCMV | MycDDK | None | BSD | LargeT | GFP control | EML-CXDGBC-000000k |

*Showing 1 to 3 of 3 entries*

---

Our design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.
```', FALSE, '{"id":"vc-01"}'::JSONB, '{"name":"cDNA Vector Stock","description":"Ready-to-use cDNA vector stocks for cloning and expression workflows.","link":"/products/cdna-vector-stock","category":"vector-clones","order":1,"__type":"quote"}'::JSONB, '{"catalogNumber":"VC-001","availability":"In Stock","listPrice":"Contact for Quote","options":[],"optionPrices":{},"keyFeatures":["High-quality backbone","Multiple cloning sites","Sequence-verified"],"storageStability":"Store at -20°C. See manual for details.","performanceData":"Validated for standard cloning workflows.","manuals":["Vector Handbook (PDF)"],"manualUrls":[],"storeLink":"","quoteOnly":true,"contentText":"This technique enables the precise integration of target genes or regulatory cassettes into safe harbor sites—genomic regions where foreign DNA can be inserted without disrupting essential endogenous gene functions or causing adverse cellular effects. These sites are widely used in genome engineering for stable gene insertion, ensuring long-term and predictable transgene expression.\n\nCommonly used safe harbor sites include human AAVS1 and CCR5, as well as the mouse ROSA26 locus. Our standard kit utilizes the AAVS1 site as the default insertion locus. For alternative loci or custom services, please contact us at [support@bioarktech.com](mailto:support@bioarktech.com).\n\n---\n\n| Main Plasmid | Features | | | | | | Scramble Plasmid | Order |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n| **Class** | **Product Name** | **SKU** | **Accessory** | **Promoter** | **Protein Tag** | **Fluorescence Marker** | **Selection Marker** | **Target Gene** | **Control Sample** | **SKU** |\n| Viral | OverExp Lenti Kit | EML-CXD0PC-LARGETk | None | PCMV | MycDDK | None | Puro | LargeT | GFP control | EML-CXDGPC-000000k |\n| Viral | OverExp Lenti Kit | EML-CXD0BC-LARGETk | None | PCMV | MycDDK | None | BSD | LargeT | GFP control | EML-CXDGBC-000000k |\n\n*Showing 1 to 3 of 3 entries*\n\n---\n\nOur design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.\n```","images":["/content-api/uploads/originals/30248855-528e-46b1-9487-e748b7bbe964.png"],"isFeatured":true,"priceRange":"","dataDescription":"","showInFeatured":false,"showInGeneEditing":false,"order":0}'::JSONB),
    ('vc-02', 'Template Vectors Stock', 'Templates for building functional vector kits with modular components.', '/placeholder.svg', '/products/functional-vectors-kits-template', 'vector-clones', 'Stock', 'quote', 0, NULL, NULL, 'VC-002', 'In Stock', 'Contact for Quote', '', TRUE, FALSE, FALSE, FALSE, ARRAY['Modular design', 'Customizable elements', 'Comprehensive documentation']::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, 'Store at -20°C. See manual for details.', 'Suitable for rapid kit assembly and iteration.', '', ARRAY['Template Guide (PDF)']::TEXT[], ARRAY[]::TEXT[], ARRAY['/placeholder.svg']::TEXT[], '', '# BioArk Technologies

BioArk Technologies offers an extensive inventory of vectors, optimized for automated cloning design and construction. Our pre-assembled templates can be quickly adapted and customized into different kits, tailored for various applications. You can utilize these established systems for your project or design your own system based on your specific preferences.

Below is a list of our current established function kits. Simply click the SKU number to add your preferred gene information or just select the control or scramble vectors.

---

| Major Vector | Features | | | | | Scramble Vector |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Class** | **Product Name** | **SKU** | **Accessory Vector** | **Promoter** | **Tag** | **Fluorescence Marker** | **Selection Marker** | **Control Sample** | **SKU** |
| Non-Viral All-in-One | CRISPRa AIO Kit | CAT-FXD00A-XXXXXXk | None | EF1core | MycDDK | None | None | Scramble Control | CAT-FXD00A-000000k |
| Viral All-in-one | CRISPRa AIO Kit | CAM-FXD0PC-XXXXXXk | None | EF1core | MycDDK | None | Puro | Scramble Control | CAM-FXD0PC-000000k |

*Showing 1 to 3 of 3 entries*

---

Our design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.
```', FALSE, '{"id":"vc-02"}'::JSONB, '{"name":"Template Vectors Stock","description":"Templates for building functional vector kits with modular components.","link":"/products/functional-vectors-kits-template","category":"vector-clones","order":0,"__type":"quote"}'::JSONB, '{"catalogNumber":"VC-002","availability":"In Stock","listPrice":"Contact for Quote","options":[],"optionPrices":{},"keyFeatures":["Modular design","Customizable elements","Comprehensive documentation"],"storageStability":"Store at -20°C. See manual for details.","performanceData":"Suitable for rapid kit assembly and iteration.","manuals":["Template Guide (PDF)"],"manualUrls":[],"storeLink":"","quoteOnly":true,"contentText":"# BioArk Technologies\n\nBioArk Technologies offers an extensive inventory of vectors, optimized for automated cloning design and construction. Our pre-assembled templates can be quickly adapted and customized into different kits, tailored for various applications. You can utilize these established systems for your project or design your own system based on your specific preferences.\n\nBelow is a list of our current established function kits. Simply click the SKU number to add your preferred gene information or just select the control or scramble vectors.\n\n---\n\n| Major Vector | Features | | | | | Scramble Vector |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n| **Class** | **Product Name** | **SKU** | **Accessory Vector** | **Promoter** | **Tag** | **Fluorescence Marker** | **Selection Marker** | **Control Sample** | **SKU** |\n| Non-Viral All-in-One | CRISPRa AIO Kit | CAT-FXD00A-XXXXXXk | None | EF1core | MycDDK | None | None | Scramble Control | CAT-FXD00A-000000k |\n| Viral All-in-one | CRISPRa AIO Kit | CAM-FXD0PC-XXXXXXk | None | EF1core | MycDDK | None | Puro | Scramble Control | CAM-FXD0PC-000000k |\n\n*Showing 1 to 3 of 3 entries*\n\n---\n\nOur design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.\n```","images":["/placeholder.svg"],"isFeatured":false,"priceRange":"","dataDescription":"","showInFeatured":false,"showInGeneEditing":false}'::JSONB),
    ('fp-bal100688', 'fp-bal100688', NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"fp-bal100688"}'::JSONB, NULL, '{"isFeatured":false,"order":1}'::JSONB),
    ('gep-01', 'Gene Tagging Kit', 'Precision services for endogenous gene tagging and reporter knock-in.', '/content-api/uploads/originals/3b93f03a-4932-4a55-a0be-0acfc63a9b42.png', '/products/gene-knock-in', 'genome-editing', 'DNA', 'quote', 1, NULL, NULL, 'GEX-004', 'In Stock', '$640.37', '$1199+syn.', TRUE, FALSE, FALSE, TRUE, ARRAY['High-purity components for robust genome editing', 'Complete systems for high-titer virus production', 'Scalable solutions for manufacturing', 'Custom-designed for targeted gene editing']::TEXT[], ARRAY['Standard Kit', 'Pro Kit']::TEXT[], '{}'::JSONB, 'Store components at specified temperatures. See manual for details.', 'Consistently high efficiency and low off-target effects reported in publications.', '', ARRAY['Protocol Guide (PDF)', 'Troubleshooting (PDF)']::TEXT[], ARRAY[]::TEXT[], ARRAY['/content-api/uploads/originals/3b93f03a-4932-4a55-a0be-0acfc63a9b42.png']::TEXT[], 'https://store.bioarktech.com/cart', 'This technique provides versatile options for attaching selected tags to the 3′ or 5′ ends of customer-specified target genes, enabling precise tracking and functional analysis. Gene knock-in tagging can be applied across a broad range of research areas, including investigating protein localization, studying protein-protein interactions, analyzing gene function and regulation, creating transgenic models, and facilitating drug discovery efforts.

## Technical Background

The CRISPR-Cas9 system is the core technology behind gene knock-in tagging. It utilizes a guide RNA (gRNA) to direct the Cas9 endonuclease to a specific genomic site, where it generates a double-strand break (DSB). This break is then repaired by either non-homologous end joining (NHEJ) or homology-directed repair (HDR). For knock-in tagging, HDR is the preferred method, where a donor template containing the desired tag, flanked by homology arms, facilitates the precise insertion of the tag at the target locus.

## Key Components

- **Cas9 protein**: Creates a DSB at the target site.
- **Guide RNA (gRNA)**: Directs Cas9 to the desired genomic locus.
- **Donor template**: Contains the tag (e.g., GFP, HA tag) along with homology arms to facilitate HDR-mediated knock-in.

## Features of Our Products

- **AI-Assisted Design**: Our CRISPR and donor vectors are AI-assisted, designed to streamline and optimize the process for efficient target gene integration.
- **User-Friendly Techniques**: Our plasmid kits utilize lab-friendly methods that avoid the need for electroporation, making them easy to use in most labs. They are particularly well-suited for adherent cancer cell lines.

Our design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.', FALSE, '{"id":"gep-01"}'::JSONB, '{"name":"Gene Tagging Kit","description":"Precision services for endogenous gene tagging and reporter knock-in.","link":"/products/gene-knock-in","category":"genome-editing","order":1,"__type":"quote"}'::JSONB, '{"catalogNumber":"GEX-004","availability":"In Stock","listPrice":"$640.37","options":["Standard Kit","Pro Kit"],"optionPrices":{},"keyFeatures":["High-purity components for robust genome editing","Complete systems for high-titer virus production","Scalable solutions for manufacturing","Custom-designed for targeted gene editing"],"storageStability":"Store components at specified temperatures. See manual for details.","performanceData":"Consistently high efficiency and low off-target effects reported in publications.","manuals":["Protocol Guide (PDF)","Troubleshooting (PDF)"],"manualUrls":[],"storeLink":"https://store.bioarktech.com/cart","quoteOnly":true,"contentText":"This technique provides versatile options for attaching selected tags to the 3′ or 5′ ends of customer-specified target genes, enabling precise tracking and functional analysis. Gene knock-in tagging can be applied across a broad range of research areas, including investigating protein localization, studying protein-protein interactions, analyzing gene function and regulation, creating transgenic models, and facilitating drug discovery efforts.\n\n## Technical Background\n\nThe CRISPR-Cas9 system is the core technology behind gene knock-in tagging. It utilizes a guide RNA (gRNA) to direct the Cas9 endonuclease to a specific genomic site, where it generates a double-strand break (DSB). This break is then repaired by either non-homologous end joining (NHEJ) or homology-directed repair (HDR). For knock-in tagging, HDR is the preferred method, where a donor template containing the desired tag, flanked by homology arms, facilitates the precise insertion of the tag at the target locus.\n\n## Key Components\n\n- **Cas9 protein**: Creates a DSB at the target site.\n- **Guide RNA (gRNA)**: Directs Cas9 to the desired genomic locus.\n- **Donor template**: Contains the tag (e.g., GFP, HA tag) along with homology arms to facilitate HDR-mediated knock-in.\n\n## Features of Our Products\n\n- **AI-Assisted Design**: Our CRISPR and donor vectors are AI-assisted, designed to streamline and optimize the process for efficient target gene integration.\n- **User-Friendly Techniques**: Our plasmid kits utilize lab-friendly methods that avoid the need for electroporation, making them easy to use in most labs. They are particularly well-suited for adherent cancer cell lines.\n\nOur design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.","images":["/content-api/uploads/originals/3b93f03a-4932-4a55-a0be-0acfc63a9b42.png"],"priceRange":"$1199+syn.","dataDescription":"","showInFeatured":false,"showInGeneEditing":true}'::JSONB),
    ('fp-bapm2086', 'fp-bapm2086', NULL, NULL, NULL, NULL, NULL, NULL, 2, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"fp-bapm2086"}'::JSONB, NULL, '{"isFeatured":true,"order":2}'::JSONB),
    ('gep-03', 'Gene Deletion Kit', 'Expertly remove large genomic regions to study gene function.', '/content-api/uploads/originals/d650e3bb-1045-4bef-abcd-d9baf2e92493.png', '/products/gene-deletion', 'genome-editing', 'DNA', 'quote', 2, NULL, NULL, 'GEX-002', 'In Stock', '$320.67', '$1499', TRUE, FALSE, FALSE, TRUE, ARRAY['High-purity components for robust genome editing', 'Complete systems for high-titer virus production', 'Scalable solutions for manufacturing', 'Custom-designed for targeted gene editing']::TEXT[], ARRAY['Standard Kit', 'Pro Kit']::TEXT[], '{}'::JSONB, 'Store components at specified temperatures. See manual for details.', 'Consistently high efficiency and low off-target effects reported in publications.', '', ARRAY['Protocol Guide (PDF)', 'Troubleshooting (PDF)']::TEXT[], ARRAY[]::TEXT[], ARRAY['/content-api/uploads/originals/d650e3bb-1045-4bef-abcd-d9baf2e92493.png']::TEXT[], 'https://store.bioarktech.com/cart', 'CRISPR Genome Knockout Deletion provides an efficient method for deleting genomic fragments of various sizes, ranging from short deletions to large deletions exceeding 10 kb. It is a valuable tool for studying the functions of non-coding regions of the genome, creating disease models such as Huntington’s disease, exploring gene cluster complexities, investigating chromatin architecture, and examining the role of pathogenic copy number variations (CNVs).

 
Technical Background
Key Components:

Cas9 Protein: A nuclease that creates double-strand breaks (DSBs) at specified genomic locations, guided by a complementary RNA sequence.
Guide RNA (gRNA): A synthetic RNA molecule designed to bind to a specific target sequence in the genome, directing the Cas9 protein to the desired site.
DNA Repair Mechanisms: After the DSB is introduced by Cas9, the cell’s natural repair mechanisms take over. The primary repair pathways involved are:
Non-Homologous End Joining (NHEJ): The predominant pathway for gene knockout, NHEJ can lead to insertions or deletions (indels) at the break site, causing frameshifts or premature stop codons that result in gene knockout.
Homology-Directed Repair (HDR): Although not commonly used for knockout deletions, HDR can be applied for precise gene editing when a donor template is provided.
 
Features of Our Products
Flexible Cloning Options: We offer three different cloning methods for the CRISPR deletion kit:
Cas9 vector with a separate gRNA vector.
Two distinct Cas9 + gRNA All-in-one vectors. Each vector carries one gRNA.
A specialized vector designed for the simultaneous delivery of two gRNAs, allowing for the efficient removal of target genomic fragments.
User-Friendly Techniques: Our plasmid kits are designed to be lab-friendly, eliminating the need for electroporation and making them easy to use in most lab settings. These kits are particularly well-suited for adherent cancer cell lines.

Our design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.', FALSE, '{"id":"gep-03"}'::JSONB, '{"name":"Gene Deletion Kit","description":"Expertly remove large genomic regions to study gene function.","link":"/products/gene-deletion","category":"genome-editing","order":2,"__type":"quote"}'::JSONB, '{"catalogNumber":"GEX-002","availability":"In Stock","listPrice":"$320.67","options":["Standard Kit","Pro Kit"],"optionPrices":{},"keyFeatures":["High-purity components for robust genome editing","Complete systems for high-titer virus production","Scalable solutions for manufacturing","Custom-designed for targeted gene editing"],"storageStability":"Store components at specified temperatures. See manual for details.","performanceData":"Consistently high efficiency and low off-target effects reported in publications.","manuals":["Protocol Guide (PDF)","Troubleshooting (PDF)"],"manualUrls":[],"storeLink":"https://store.bioarktech.com/cart","quoteOnly":true,"contentText":"CRISPR Genome Knockout Deletion provides an efficient method for deleting genomic fragments of various sizes, ranging from short deletions to large deletions exceeding 10 kb. It is a valuable tool for studying the functions of non-coding regions of the genome, creating disease models such as Huntington’s disease, exploring gene cluster complexities, investigating chromatin architecture, and examining the role of pathogenic copy number variations (CNVs).\n\n \nTechnical Background\nKey Components:\n\nCas9 Protein: A nuclease that creates double-strand breaks (DSBs) at specified genomic locations, guided by a complementary RNA sequence.\nGuide RNA (gRNA): A synthetic RNA molecule designed to bind to a specific target sequence in the genome, directing the Cas9 protein to the desired site.\nDNA Repair Mechanisms: After the DSB is introduced by Cas9, the cell’s natural repair mechanisms take over. The primary repair pathways involved are:\nNon-Homologous End Joining (NHEJ): The predominant pathway for gene knockout, NHEJ can lead to insertions or deletions (indels) at the break site, causing frameshifts or premature stop codons that result in gene knockout.\nHomology-Directed Repair (HDR): Although not commonly used for knockout deletions, HDR can be applied for precise gene editing when a donor template is provided.\n \nFeatures of Our Products\nFlexible Cloning Options: We offer three different cloning methods for the CRISPR deletion kit:\nCas9 vector with a separate gRNA vector.\nTwo distinct Cas9 + gRNA All-in-one vectors. Each vector carries one gRNA.\nA specialized vector designed for the simultaneous delivery of two gRNAs, allowing for the efficient removal of target genomic fragments.\nUser-Friendly Techniques: Our plasmid kits are designed to be lab-friendly, eliminating the need for electroporation and making them easy to use in most lab settings. These kits are particularly well-suited for adherent cancer cell lines.\n\nOur design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.","images":["/content-api/uploads/originals/d650e3bb-1045-4bef-abcd-d9baf2e92493.png"],"priceRange":"$1499","dataDescription":"","showInFeatured":false,"showInGeneEditing":true}'::JSONB),
    ('fp-bal100668', 'fp-bal100668', NULL, NULL, NULL, NULL, NULL, NULL, 3, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, NULL, NULL, NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, NULL, FALSE, '{"id":"fp-bal100668"}'::JSONB, NULL, '{"isFeatured":true,"order":3}'::JSONB),
    ('gep-04', 'CRISPR Knockdown Kit', 'Modulate gene expression with our reliable RNA interference services.', '/content-api/uploads/originals/aba9a3b2-8f86-40bb-8668-30a1686f4b13.png', '/products/crispr-knock-down', 'genome-editing', 'RNA', 'quote', 3, NULL, NULL, 'GEX-007', 'In Stock', '$384.90', '$799', TRUE, FALSE, TRUE, FALSE, ARRAY['High-purity components for robust genome editing', 'Complete systems for high-titer virus production', 'Scalable solutions for manufacturing', 'Custom-designed for targeted gene editing']::TEXT[], ARRAY['Standard Kit', 'Pro Kit']::TEXT[], '{}'::JSONB, 'Store components at specified temperatures. See manual for details.', 'Consistently high efficiency and low off-target effects reported in publications.', '', ARRAY['Protocol Guide (PDF)', 'Troubleshooting (PDF)']::TEXT[], ARRAY[]::TEXT[], ARRAY['/content-api/uploads/originals/aba9a3b2-8f86-40bb-8668-30a1686f4b13.png']::TEXT[], 'https://store.bioarktech.com/cart', '# CRISPR RNA Knockdown (KD) Technique

This technique offers a more specific and efficient alternative to traditional RNAi methods for knocking down RNA expression levels. CRISPR RNA knockdown using Cas13 provides a powerful and precise approach to regulate gene expression at the RNA level. Its ability to selectively degrade mRNA transcripts makes it a versatile tool for studying gene function and developing therapeutic strategies across diverse fields, including basic research, applied biotechnology, and medicine.

CRISPR RNA knockdown (KD) is particularly useful for studying gene roles by reducing RNA transcript levels. It can be applied in:
- Disease models
- Therapeutic development
- RNA regulatory mechanisms
- Customized RNA therapies
- Antiviral applications
- High-throughput genetic screening

## Technical Background

### Key Components:

- **RfxCas13d (CasRx) Protein**: A member of the CRISPR family that specifically targets RNA rather than DNA. RfxCas13d is derived from the bacterium *Rhodococcus fascians*.
- **Guide RNA (gRNA)**: A synthetic RNA molecule designed to bind to the target mRNA. It contains a sequence complementary to the target RNA, guiding Cas13 to the specific mRNA for cleavage.

## Features of Our Products

- **Reduced Off-Target Effects**: Compared to traditional RNA interference (RNAi), this method significantly minimizes off-target activity in cultured cells, offering greater specificity.
- **Customizable Kits**: We provide two distinct kits—vector kits designed for use with cancer cell lines and virus kits tailored for hard-to-transfect cells.

---

## Product Catalog

10 entries per page  
Search:  
Edit

| Major Vector | Scramble Control Vector |  |  |  |
| :--- | :--- | :--- | :--- | :--- |
| **Class** | **Product Name** | **SKU** | **Information** | **Scramble Name** | **SKU** | **Information** |
| Non-Viral All-In-one | COT-P031k | CRISPR KN AIO Kit | COT-FXD0PA-XXXXXXk | The non-viral CRISPR kit includes three AI-designed gRNA sites tailored to target the customer-specified genes. Please click button to design the target genes. | Scramble Control CRISPR KN AIO Ctrl Kit, Vector type | COT-FXD0PA-000000k | The scramble sequence are used as non-specific cutting control |
| Viral All-in-one | COM-P032k | CRISPR KN Lenti-AIO Kit | COM-FXD0PA-XXXXXXl | The CRISPR lentivirus kit packages three AI-designed gRNA sites into a single mixture tube for precise targeting and cutting of customer-specified genes. Please click button to design the target genes. | Scramble Control CRISPR KN Lenti-AIO Ctrl Kit, lentivirus type | COM-FXD0PA-000000l | The scramble sequence are used as non-specific cutting control |

Showing 1 to 3 of 3 entries

Our design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.
', FALSE, '{"id":"gep-04"}'::JSONB, '{"name":"CRISPR Knockdown Kit","description":"Modulate gene expression with our reliable RNA interference services.","link":"/products/crispr-knock-down","category":"genome-editing","order":3,"__type":"quote"}'::JSONB, '{"catalogNumber":"GEX-007","availability":"In Stock","listPrice":"$384.90","options":["Standard Kit","Pro Kit"],"optionPrices":{},"keyFeatures":["High-purity components for robust genome editing","Complete systems for high-titer virus production","Scalable solutions for manufacturing","Custom-designed for targeted gene editing"],"storageStability":"Store components at specified temperatures. See manual for details.","performanceData":"Consistently high efficiency and low off-target effects reported in publications.","manuals":["Protocol Guide (PDF)","Troubleshooting (PDF)"],"manualUrls":[],"storeLink":"https://store.bioarktech.com/cart","quoteOnly":true,"contentText":"# CRISPR RNA Knockdown (KD) Technique\n\nThis technique offers a more specific and efficient alternative to traditional RNAi methods for knocking down RNA expression levels. CRISPR RNA knockdown using Cas13 provides a powerful and precise approach to regulate gene expression at the RNA level. Its ability to selectively degrade mRNA transcripts makes it a versatile tool for studying gene function and developing therapeutic strategies across diverse fields, including basic research, applied biotechnology, and medicine.\n\nCRISPR RNA knockdown (KD) is particularly useful for studying gene roles by reducing RNA transcript levels. It can be applied in:\n- Disease models\n- Therapeutic development\n- RNA regulatory mechanisms\n- Customized RNA therapies\n- Antiviral applications\n- High-throughput genetic screening\n\n## Technical Background\n\n### Key Components:\n\n- **RfxCas13d (CasRx) Protein**: A member of the CRISPR family that specifically targets RNA rather than DNA. RfxCas13d is derived from the bacterium *Rhodococcus fascians*.\n- **Guide RNA (gRNA)**: A synthetic RNA molecule designed to bind to the target mRNA. It contains a sequence complementary to the target RNA, guiding Cas13 to the specific mRNA for cleavage.\n\n## Features of Our Products\n\n- **Reduced Off-Target Effects**: Compared to traditional RNA interference (RNAi), this method significantly minimizes off-target activity in cultured cells, offering greater specificity.\n- **Customizable Kits**: We provide two distinct kits—vector kits designed for use with cancer cell lines and virus kits tailored for hard-to-transfect cells.\n\n---\n\n## Product Catalog\n\n10 entries per page  \nSearch:  \nEdit\n\n| Major Vector | Scramble Control Vector |  |  |  |\n| :--- | :--- | :--- | :--- | :--- |\n| **Class** | **Product Name** | **SKU** | **Information** | **Scramble Name** | **SKU** | **Information** |\n| Non-Viral All-In-one | COT-P031k | CRISPR KN AIO Kit | COT-FXD0PA-XXXXXXk | The non-viral CRISPR kit includes three AI-designed gRNA sites tailored to target the customer-specified genes. Please click button to design the target genes. | Scramble Control CRISPR KN AIO Ctrl Kit, Vector type | COT-FXD0PA-000000k | The scramble sequence are used as non-specific cutting control |\n| Viral All-in-one | COM-P032k | CRISPR KN Lenti-AIO Kit | COM-FXD0PA-XXXXXXl | The CRISPR lentivirus kit packages three AI-designed gRNA sites into a single mixture tube for precise targeting and cutting of customer-specified genes. Please click button to design the target genes. | Scramble Control CRISPR KN Lenti-AIO Ctrl Kit, lentivirus type | COM-FXD0PA-000000l | The scramble sequence are used as non-specific cutting control |\n\nShowing 1 to 3 of 3 entries\n\nOur design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.\n","images":["/content-api/uploads/originals/aba9a3b2-8f86-40bb-8668-30a1686f4b13.png"],"priceRange":"$799","dataDescription":"","showInFeatured":true,"showInGeneEditing":false}'::JSONB),
    ('gep-02', 'CRISPR KnockOut Kit', 'Generate complete loss-of-function models using CRISPR-Cas9 technology.', '/content-api/uploads/originals/ddbc6621-4c4f-470c-8730-6ccdcd6c1c1a.png', '/products/gene-knock-out', 'genome-editing', 'DNA', 'quote', 4, NULL, NULL, 'GEX-001', 'In Stock', '$546.36', '$799', TRUE, FALSE, FALSE, TRUE, ARRAY['High-purity components for robust genome editing', 'Complete systems for high-titer virus production', 'Scalable solutions for manufacturing', 'Custom-designed for targeted gene editing']::TEXT[], ARRAY['Standard Kit', 'Pro Kit']::TEXT[], '{}'::JSONB, 'Store components at specified temperatures. See manual for details.', 'Consistently high efficiency and low off-target effects reported in publications.', '', ARRAY['Protocol Guide (PDF)', 'Troubleshooting (PDF)']::TEXT[], ARRAY[]::TEXT[], ARRAY['/content-api/uploads/originals/ddbc6621-4c4f-470c-8730-6ccdcd6c1c1a.png', '/content-api/uploads/originals/e517607f-dde5-4e77-96ba-ad123c4b3ea8.png']::TEXT[], 'https://store.bioarktech.com/cart', '# CRISPR Knockout (KO) Technique

CRISPR knockout (KO) is a revolutionary gene-editing technique that allows researchers to disrupt or "knock out" specific genes within an organism’s genome. The CRISPR-Cas9 system is the most widely used tool for this purpose, harnessing a natural bacterial defense mechanism against viral infections. Our technique provides a rapid and efficient approach to disrupt gene expression for both research and therapeutic applications.

## Technical Background

### Description:

- **spCas9 Protein**: An endonuclease that induces double-strand breaks (DSBs) in DNA at specific genomic loci.
- **Guide RNA (gRNA)**: A short RNA sequence that guides the Cas9 protein to the target gene through complementary base pairing.
- **Repair Pathways**: Following the creation of a DSB, the cell’s repair machinery is activated. The primary repair pathways are:
  - **Non-Homologous End Joining (NHEJ)**: This repair mechanism often results in insertions or deletions (indels) at the break site, leading to frameshift mutations that can disrupt gene function.
  - **Homology-Directed Repair (HDR)**: Typically used for precise edits, HDR can also be employed when a donor template is provided. Although HDR is less common for knockout purposes, it can be leveraged to integrate exogenous DNA into the genome, facilitating quick screening for knockout stable cell lines.

By utilizing the NHEJ repair pathway, researchers can efficiently create gene knockouts, resulting in the loss of gene function. On the other hand, using HDR allows for precise integration of exogenous DNA fragments into the genome.

## Features of Our Products

- **Dual Repair Pathways**: Our CRISPR knockout (KN) tool supports both NHEJ and HDR, offering flexibility depending on customer preferences and project requirements.
- **Two Delivery Options**: We provide two versions of our CRISPR KN tool: lentivirus and regular plasmid, allowing customers to choose the most suitable option for their needs.
- **Superior Knockout Efficiency**: Our tools deliver enhanced knockout efficiency, leveraging the latest advancements in CRISPR technology, including optimized gRNA scaffold structures and improved gRNA sequence selection.

Our design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.

---

## Product Catalog

10 entries per page  
Search:  
Edit

| Major Vector | Scramble Control Vector |  |  |  |
| :--- | :--- | :--- | :--- | :--- |
| **Class** | **Product Name** | **SKU** | **Information** | **Scramble Name** | **SKU** | **Information** |
| Non-Viral All-In-one | COT-P031k | CRISPR KN AIO Kit | COT-FXD0PA-XXXXXXk | The non-viral CRISPR kit includes three AI-designed gRNA sites tailored to target the customer-specified genes. Please click button to design the target genes. | Scramble Control CRISPR KN AIO Ctrl Kit, Vector type | COT-FXD0PA-000000k | The scramble sequence are used as non-specific cutting control |
| Viral All-in-one | COM-P032k | CRISPR KN Lenti-AIO Kit | COM-FXD0PA-XXXXXXl | The CRISPR lentivirus kit packages three AI-designed gRNA sites into a single mixture tube for precise targeting and cutting of customer-specified genes. Please click button to design the target genes. | Scramble Control CRISPR KN Lenti-AIO Ctrl Kit, lentivirus type | COM-FXD0PA-000000l | The scramble sequence are used as non-specific cutting control |
', FALSE, '{"id":"gep-02"}'::JSONB, '{"name":"CRISPR KnockOut Kit","description":"Generate complete loss-of-function models using CRISPR-Cas9 technology.","link":"/products/gene-knock-out","category":"genome-editing","order":4,"__type":"quote"}'::JSONB, '{"catalogNumber":"GEX-001","availability":"In Stock","listPrice":"$546.36","options":["Standard Kit","Pro Kit"],"optionPrices":{},"keyFeatures":["High-purity components for robust genome editing","Complete systems for high-titer virus production","Scalable solutions for manufacturing","Custom-designed for targeted gene editing"],"storageStability":"Store components at specified temperatures. See manual for details.","performanceData":"Consistently high efficiency and low off-target effects reported in publications.","manuals":["Protocol Guide (PDF)","Troubleshooting (PDF)"],"manualUrls":[],"storeLink":"https://store.bioarktech.com/cart","quoteOnly":true,"contentText":"# CRISPR Knockout (KO) Technique\n\nCRISPR knockout (KO) is a revolutionary gene-editing technique that allows researchers to disrupt or \"knock out\" specific genes within an organism’s genome. The CRISPR-Cas9 system is the most widely used tool for this purpose, harnessing a natural bacterial defense mechanism against viral infections. Our technique provides a rapid and efficient approach to disrupt gene expression for both research and therapeutic applications.\n\n## Technical Background\n\n### Description:\n\n- **spCas9 Protein**: An endonuclease that induces double-strand breaks (DSBs) in DNA at specific genomic loci.\n- **Guide RNA (gRNA)**: A short RNA sequence that guides the Cas9 protein to the target gene through complementary base pairing.\n- **Repair Pathways**: Following the creation of a DSB, the cell’s repair machinery is activated. The primary repair pathways are:\n  - **Non-Homologous End Joining (NHEJ)**: This repair mechanism often results in insertions or deletions (indels) at the break site, leading to frameshift mutations that can disrupt gene function.\n  - **Homology-Directed Repair (HDR)**: Typically used for precise edits, HDR can also be employed when a donor template is provided. Although HDR is less common for knockout purposes, it can be leveraged to integrate exogenous DNA into the genome, facilitating quick screening for knockout stable cell lines.\n\nBy utilizing the NHEJ repair pathway, researchers can efficiently create gene knockouts, resulting in the loss of gene function. On the other hand, using HDR allows for precise integration of exogenous DNA fragments into the genome.\n\n## Features of Our Products\n\n- **Dual Repair Pathways**: Our CRISPR knockout (KN) tool supports both NHEJ and HDR, offering flexibility depending on customer preferences and project requirements.\n- **Two Delivery Options**: We provide two versions of our CRISPR KN tool: lentivirus and regular plasmid, allowing customers to choose the most suitable option for their needs.\n- **Superior Knockout Efficiency**: Our tools deliver enhanced knockout efficiency, leveraging the latest advancements in CRISPR technology, including optimized gRNA scaffold structures and improved gRNA sequence selection.\n\nOur design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.\n\n---\n\n## Product Catalog\n\n10 entries per page  \nSearch:  \nEdit\n\n| Major Vector | Scramble Control Vector |  |  |  |\n| :--- | :--- | :--- | :--- | :--- |\n| **Class** | **Product Name** | **SKU** | **Information** | **Scramble Name** | **SKU** | **Information** |\n| Non-Viral All-In-one | COT-P031k | CRISPR KN AIO Kit | COT-FXD0PA-XXXXXXk | The non-viral CRISPR kit includes three AI-designed gRNA sites tailored to target the customer-specified genes. Please click button to design the target genes. | Scramble Control CRISPR KN AIO Ctrl Kit, Vector type | COT-FXD0PA-000000k | The scramble sequence are used as non-specific cutting control |\n| Viral All-in-one | COM-P032k | CRISPR KN Lenti-AIO Kit | COM-FXD0PA-XXXXXXl | The CRISPR lentivirus kit packages three AI-designed gRNA sites into a single mixture tube for precise targeting and cutting of customer-specified genes. Please click button to design the target genes. | Scramble Control CRISPR KN Lenti-AIO Ctrl Kit, lentivirus type | COM-FXD0PA-000000l | The scramble sequence are used as non-specific cutting control |\n","images":["/content-api/uploads/originals/ddbc6621-4c4f-470c-8730-6ccdcd6c1c1a.png","/content-api/uploads/originals/e517607f-dde5-4e77-96ba-ad123c4b3ea8.png"],"priceRange":"$799","dataDescription":"","showInFeatured":false,"showInGeneEditing":true}'::JSONB),
    ('custom-1759624148236', 'CRISPR Activation Kit', 'Our CRISPR activation (CRISPRa) kits enable precise, reversible upregulation of endogenous genes without altering DNA sequences. Powered by nuclease-deactivated Cas9 (dCas9) fused to potent transcriptional activators, the platform offers a robust solution for functional genomics, pathway analysis, and therapeutic research. Each kit includes three target-specific gRNA vectors (all-in-one or standalone format) and one scramble control.', '/content-api/uploads/originals/aa6a0b48-05c6-47d2-8764-87d73b4c7824.png', '/products/crispr-activation', 'genome-editing', 'DNA', 'quote', 5, 1759624148236, to_timestamp(1759624148236 / 1000.0), 'GEX-006', 'In Stock', '', '$799', TRUE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, '', '', '', ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['/content-api/uploads/originals/aa6a0b48-05c6-47d2-8764-87d73b4c7824.png']::TEXT[], 'https://store.bioarktech.com/cart', '
**CRISPR activation (CRISPRa)** is an advanced gene-regulation technology that enables researchers to **upregulate or activate the expression** of target genes **without altering the underlying DNA sequence**.  

Unlike CRISPR knockout, which disrupts gene function, CRISPRa employs a **nuclease-deactivated Cas9 (dCas9)** fused to **transcriptional activators**, allowing **precise control of gene expression**.  

Our system provides a **rapid, efficient, and reversible** approach to enhance gene expression—ideal for **functional genomics**, **pathway analysis**, and **therapeutic research**.

Each kit includes **three target-specific gRNA vectors** (available in **all-in-one** or **standalone** format) and **one scramble control vector**, offering flexibility for both experimental validation and control design.

---

## Technical Background

1. **dCas9 Protein**  
   A catalytically inactive Cas9 variant that binds to specific genomic loci guided by gRNA, without inducing double-strand breaks.  

2. **Guide RNA (gRNA)**  
   A short RNA sequence that directs dCas9 to the promoter or enhancer region of a target gene, enabling site-specific activation.  

3. **Transcriptional Activators**  
   - **VP64, p65, Rta, or VPR fusions**: Potent activator domains that recruit the cell’s transcriptional machinery to drive robust gene expression.  
   - **MS2 or SAM system (optional)**: Enhanced multi-component activation systems that further amplify transcriptional output.  

By precisely positioning **dCas9-activator complexes** near promoter regions, researchers can **turn on endogenous gene expression**, enabling **fine-tuned control** for mechanistic studies or phenotype screening.

---

## Features of Our Products

1. **High Activation Efficiency**  
   Our CRISPRa platform integrates optimized gRNA design and advanced activator domains to achieve **strong and consistent gene upregulation**.

2. **Multiple Delivery Options**  
   Available in both **lentiviral** and **plasmid** formats, allowing **flexible delivery** to a wide range of cell types, including difficult-to-transfect cells.

3. **All-in-One or Standalone Configurations**  
   Choose between **all-in-one** and **standalone** formats to suit your experimental needs:  
   - **All-in-One**: Cas9 activator and gRNA cassettes are integrated into a single vector for streamlined transfection and stable expression.  
   - **Standalone**: Cas9 activator and gRNA are provided on separate plasmids, offering greater modularity and experimental control.

4. **Comprehensive Kit Design**  
   Each kit contains **three gRNA vectors** targeting the gene of interest and **one scramble control**, ensuring reliable results with appropriate experimental controls.
', FALSE, '{"id":"custom-1759624148236","name":"CRISPR Activation Kit","description":"Our CRISPR activation (CRISPRa) kits enable precise, reversible upregulation of endogenous genes without altering DNA sequences. Powered by nuclease-deactivated Cas9 (dCas9) fused to potent transcriptional activators, the platform offers a robust solution for functional genomics, pathway analysis, and therapeutic research. Each kit includes three target-specific gRNA vectors (all-in-one or standalone format) and one scramble control.","imageUrl":"","link":"/products/crispr-activation","category":"genome-editing","createdAt":1759624148236,"__type":"quote","order":5}'::JSONB, NULL, '{"images":["/content-api/uploads/originals/aa6a0b48-05c6-47d2-8764-87d73b4c7824.png"],"quoteOnly":true,"createdAt":1759624148236,"catalogNumber":"GEX-006","availability":"In Stock","listPrice":"","options":[],"optionPrices":{},"keyFeatures":[],"storageStability":"","performanceData":"","manuals":[],"manualUrls":[],"storeLink":"https://store.bioarktech.com/cart","contentText":"\n**CRISPR activation (CRISPRa)** is an advanced gene-regulation technology that enables researchers to **upregulate or activate the expression** of target genes **without altering the underlying DNA sequence**.  \n\nUnlike CRISPR knockout, which disrupts gene function, CRISPRa employs a **nuclease-deactivated Cas9 (dCas9)** fused to **transcriptional activators**, allowing **precise control of gene expression**.  \n\nOur system provides a **rapid, efficient, and reversible** approach to enhance gene expression—ideal for **functional genomics**, **pathway analysis**, and **therapeutic research**.\n\nEach kit includes **three target-specific gRNA vectors** (available in **all-in-one** or **standalone** format) and **one scramble control vector**, offering flexibility for both experimental validation and control design.\n\n---\n\n## Technical Background\n\n1. **dCas9 Protein**  \n   A catalytically inactive Cas9 variant that binds to specific genomic loci guided by gRNA, without inducing double-strand breaks.  \n\n2. **Guide RNA (gRNA)**  \n   A short RNA sequence that directs dCas9 to the promoter or enhancer region of a target gene, enabling site-specific activation.  \n\n3. **Transcriptional Activators**  \n   - **VP64, p65, Rta, or VPR fusions**: Potent activator domains that recruit the cell’s transcriptional machinery to drive robust gene expression.  \n   - **MS2 or SAM system (optional)**: Enhanced multi-component activation systems that further amplify transcriptional output.  \n\nBy precisely positioning **dCas9-activator complexes** near promoter regions, researchers can **turn on endogenous gene expression**, enabling **fine-tuned control** for mechanistic studies or phenotype screening.\n\n---\n\n## Features of Our Products\n\n1. **High Activation Efficiency**  \n   Our CRISPRa platform integrates optimized gRNA design and advanced activator domains to achieve **strong and consistent gene upregulation**.\n\n2. **Multiple Delivery Options**  \n   Available in both **lentiviral** and **plasmid** formats, allowing **flexible delivery** to a wide range of cell types, including difficult-to-transfect cells.\n\n3. **All-in-One or Standalone Configurations**  \n   Choose between **all-in-one** and **standalone** formats to suit your experimental needs:  \n   - **All-in-One**: Cas9 activator and gRNA cassettes are integrated into a single vector for streamlined transfection and stable expression.  \n   - **Standalone**: Cas9 activator and gRNA are provided on separate plasmids, offering greater modularity and experimental control.\n\n4. **Comprehensive Kit Design**  \n   Each kit contains **three gRNA vectors** targeting the gene of interest and **one scramble control**, ensuring reliable results with appropriate experimental controls.\n","priceRange":"$799","dataDescription":"","showInFeatured":false,"showInGeneEditing":false}'::JSONB),
    ('custom-1759625091045', 'CRISPR Inhibition Kit', 'The CRISPR Inhibition (CRISPRi) Kit enables precise, reversible downregulation of target gene expression without altering DNA sequences. Utilizing a nuclease-deactivated Cas9 (dCas9) fused with potent transcriptional repressors, this system offers a robust tool for functional genomics, pathway analysis, and loss-of-function studies. Each kit includes three target-specific gRNA vectors and one scramble control, available in all-in-one or standalone formats for flexible experimental design.', '/content-api/uploads/originals/d93c6340-fa2f-4545-b855-e1d8744cf268.png', '/products/crispr-inhibition', 'genome-editing', 'DNA', 'quote', 6, 1759625091045, to_timestamp(1759625091045 / 1000.0), 'GEX-005', 'In Stock', '', '$799', TRUE, FALSE, FALSE, TRUE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, '', '', '', ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['/content-api/uploads/originals/d93c6340-fa2f-4545-b855-e1d8744cf268.png']::TEXT[], 'https://store.bioarktech.com/cart', '
**CRISPR inhibition (CRISPRi)** is an advanced gene-regulation technology that enables researchers to **downregulate or silence the expression** of target genes **without altering the underlying DNA sequence**.  

Unlike CRISPR knockout, which introduces double-strand breaks to disrupt gene function, CRISPRi employs a **nuclease-deactivated Cas9 (dCas9)** fused to **transcriptional repressors**, allowing **precise and reversible suppression of gene expression**.  

Our system provides a **rapid, efficient, and reversible** approach to inhibit gene expression—ideal for **functional genomics**, **pathway analysis**, and **loss-of-function studies** in therapeutic research.

---

## Technical Background

1. **dCas9 Protein**  
   A catalytically inactive Cas9 variant that binds to specific genomic loci guided by gRNA, without inducing double-strand breaks.  

2. **Guide RNA (gRNA)**  
   A short RNA sequence that directs dCas9 to the **promoter or regulatory region** of a target gene, enabling **site-specific transcriptional repression**.  

3. **Transcriptional Repressors**  
   - **KRAB or SID domains**: Potent repressor domains that recruit chromatin-modifying complexes to inhibit transcriptional initiation.  
   - **Combinatorial systems (optional)**: Enhanced multi-component repression systems (e.g., **dCas9-KRAB-MeCP2**) for stronger gene silencing.  

By precisely positioning **dCas9-repressor complexes** near promoter regions, researchers can **block transcription initiation or elongation**, enabling **fine-tuned control** of endogenous gene suppression for mechanistic studies or phenotype screening.

---

## Features of Our Products

1. **High Repression Efficiency**  
   Our CRISPRi platform integrates optimized gRNA design and advanced repressor domains to achieve **strong and consistent gene downregulation**.  

2. **Multiple Delivery Options**  
   Available in both **lentiviral** and **plasmid** formats, allowing **flexible delivery** to a wide range of cell types, including difficult-to-transfect cells.  

3. **All-in-One or Standalone Configurations**  
   Choose between **all-in-one** and **standalone** formats to suit your experimental needs:  
   - **All-in-One**: Cas9 repressor and gRNA cassettes are integrated into a single vector for streamlined transfection and stable expression.  
   - **Standalone**: Cas9 repressor and gRNA are provided on separate plasmids, offering greater modularity and experimental control.  

4. **Comprehensive Kit Design**  
   Each kit contains **three gRNA vectors** targeting the gene of interest and **one scramble control**, ensuring **reliable results** with appropriate experimental controls.
', FALSE, '{"id":"custom-1759625091045","name":"CRISPR Inhibition Kit","description":"The CRISPR Inhibition (CRISPRi) Kit enables precise, reversible downregulation of target gene expression without altering DNA sequences. Utilizing a nuclease-deactivated Cas9 (dCas9) fused with potent transcriptional repressors, this system offers a robust tool for functional genomics, pathway analysis, and loss-of-function studies. Each kit includes three target-specific gRNA vectors and one scramble control, available in all-in-one or standalone formats for flexible experimental design.","imageUrl":"","link":"/products/crispr-inhibition","category":"genome-editing","createdAt":1759625091045,"__type":"quote","order":6}'::JSONB, NULL, '{"images":["/content-api/uploads/originals/d93c6340-fa2f-4545-b855-e1d8744cf268.png"],"quoteOnly":true,"createdAt":1759625091045,"catalogNumber":"GEX-005","availability":"In Stock","listPrice":"","options":[],"optionPrices":{},"keyFeatures":[],"storageStability":"","performanceData":"","manuals":[],"manualUrls":[],"storeLink":"https://store.bioarktech.com/cart","contentText":"\n**CRISPR inhibition (CRISPRi)** is an advanced gene-regulation technology that enables researchers to **downregulate or silence the expression** of target genes **without altering the underlying DNA sequence**.  \n\nUnlike CRISPR knockout, which introduces double-strand breaks to disrupt gene function, CRISPRi employs a **nuclease-deactivated Cas9 (dCas9)** fused to **transcriptional repressors**, allowing **precise and reversible suppression of gene expression**.  \n\nOur system provides a **rapid, efficient, and reversible** approach to inhibit gene expression—ideal for **functional genomics**, **pathway analysis**, and **loss-of-function studies** in therapeutic research.\n\n---\n\n## Technical Background\n\n1. **dCas9 Protein**  \n   A catalytically inactive Cas9 variant that binds to specific genomic loci guided by gRNA, without inducing double-strand breaks.  \n\n2. **Guide RNA (gRNA)**  \n   A short RNA sequence that directs dCas9 to the **promoter or regulatory region** of a target gene, enabling **site-specific transcriptional repression**.  \n\n3. **Transcriptional Repressors**  \n   - **KRAB or SID domains**: Potent repressor domains that recruit chromatin-modifying complexes to inhibit transcriptional initiation.  \n   - **Combinatorial systems (optional)**: Enhanced multi-component repression systems (e.g., **dCas9-KRAB-MeCP2**) for stronger gene silencing.  \n\nBy precisely positioning **dCas9-repressor complexes** near promoter regions, researchers can **block transcription initiation or elongation**, enabling **fine-tuned control** of endogenous gene suppression for mechanistic studies or phenotype screening.\n\n---\n\n## Features of Our Products\n\n1. **High Repression Efficiency**  \n   Our CRISPRi platform integrates optimized gRNA design and advanced repressor domains to achieve **strong and consistent gene downregulation**.  \n\n2. **Multiple Delivery Options**  \n   Available in both **lentiviral** and **plasmid** formats, allowing **flexible delivery** to a wide range of cell types, including difficult-to-transfect cells.  \n\n3. **All-in-One or Standalone Configurations**  \n   Choose between **all-in-one** and **standalone** formats to suit your experimental needs:  \n   - **All-in-One**: Cas9 repressor and gRNA cassettes are integrated into a single vector for streamlined transfection and stable expression.  \n   - **Standalone**: Cas9 repressor and gRNA are provided on separate plasmids, offering greater modularity and experimental control.  \n\n4. **Comprehensive Kit Design**  \n   Each kit contains **three gRNA vectors** targeting the gene of interest and **one scramble control**, ensuring **reliable results** with appropriate experimental controls.\n","priceRange":"$799","dataDescription":"","showInFeatured":false,"showInGeneEditing":true}'::JSONB),
    ('lv-01', 'Lentivirus ORF Stock', 'cDNA-expressing lentiviral stocks for gene delivery.', '/placeholder.svg', '/products/cdna-lentivirus-stock', 'lentivirus', 'LentiVirus', 'quote', 7, NULL, NULL, 'LV-001', 'In Stock', 'Contact for Quote', '', TRUE, FALSE, FALSE, FALSE, ARRAY['High titer', 'Sterile filtered', 'QC validated']::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, 'Store at -80°C. Avoid repeated freeze-thaw cycles.', 'Infectivity verified in standard cell lines.', '', ARRAY['Lentivirus User Guide (PDF)']::TEXT[], ARRAY[]::TEXT[], ARRAY['/placeholder.svg']::TEXT[], '', '# BioArk Technologies

BioArk Technologies is continuously expanding its collection of cDNA lentivirus stocks, offering an ever-growing selection of specific genes and targets. Our mission is to provide high-quality, pre-packaged lentiviruses at an affordable price while promoting scientific collaboration and resource sharing.

Explore our expanding list of cost-effective, pre-constructed lentiviruses here.

---

| Major Vector | | | Donor Vector | | | Scramble Control Vector | | |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Class** | **Product Name** | **SKU** | **Information** | **Donor Name** | **SKU** | **Information** | **Scramble Name** | **SKU** | **Information** |
| Non-Viral CDS-P011k | CRISPR KN AIO Kit-Gene AAVS1, Vector type | COT-FXD00A-AAVS1gk | The CRISPR tool specifically designed to target and cut human AAVS1 safe harbor site. | AAVS1 Dnr Std Kit | CDS-FX00PA-XXXXXXk | Insert Customer Gene into human AAVS1 site, please specify your genes by clicking the button | GFP Donor Control AAVS1 Dnr Std Ctrl Kit, vector type | CDS-FX0GPA-000000k | Insert GFP into human AAVS1 site as control |
| Non-Viral CDS-P011k | CRISPR KN AIO Kit-Gene ROSA26, Vector type | COT-FXD00A-ROSA26gk | The CRISPR tool specifically designed to target and cut mouse ROSA26 safe harbor site. | Dnr Std Kit-ROSA26 Site | TBD | Insert Customer Gene into mouse ROSA26 site, please specify your custom gene by clicking the button | GFP Donor Control Dnr Std Kit-ROSA26 Site, vector type | TBD | Insert GFP into mouse ROSA26 site as control |

*Showing 1 to 3 of 3 entries*

---

Our design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.
```', FALSE, '{"id":"lv-01"}'::JSONB, '{"name":"Lentivirus ORF Stock","description":"cDNA-expressing lentiviral stocks for gene delivery.","link":"/products/cdna-lentivirus-stock","category":"lentivirus","order":7,"__type":"quote"}'::JSONB, '{"catalogNumber":"LV-001","availability":"In Stock","listPrice":"Contact for Quote","options":[],"optionPrices":{},"keyFeatures":["High titer","Sterile filtered","QC validated"],"storageStability":"Store at -80°C. Avoid repeated freeze-thaw cycles.","performanceData":"Infectivity verified in standard cell lines.","manuals":["Lentivirus User Guide (PDF)"],"manualUrls":[],"storeLink":"","quoteOnly":true,"contentText":"# BioArk Technologies\n\nBioArk Technologies is continuously expanding its collection of cDNA lentivirus stocks, offering an ever-growing selection of specific genes and targets. Our mission is to provide high-quality, pre-packaged lentiviruses at an affordable price while promoting scientific collaboration and resource sharing.\n\nExplore our expanding list of cost-effective, pre-constructed lentiviruses here.\n\n---\n\n| Major Vector | | | Donor Vector | | | Scramble Control Vector | | |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n| **Class** | **Product Name** | **SKU** | **Information** | **Donor Name** | **SKU** | **Information** | **Scramble Name** | **SKU** | **Information** |\n| Non-Viral CDS-P011k | CRISPR KN AIO Kit-Gene AAVS1, Vector type | COT-FXD00A-AAVS1gk | The CRISPR tool specifically designed to target and cut human AAVS1 safe harbor site. | AAVS1 Dnr Std Kit | CDS-FX00PA-XXXXXXk | Insert Customer Gene into human AAVS1 site, please specify your genes by clicking the button | GFP Donor Control AAVS1 Dnr Std Ctrl Kit, vector type | CDS-FX0GPA-000000k | Insert GFP into human AAVS1 site as control |\n| Non-Viral CDS-P011k | CRISPR KN AIO Kit-Gene ROSA26, Vector type | COT-FXD00A-ROSA26gk | The CRISPR tool specifically designed to target and cut mouse ROSA26 safe harbor site. | Dnr Std Kit-ROSA26 Site | TBD | Insert Customer Gene into mouse ROSA26 site, please specify your custom gene by clicking the button | GFP Donor Control Dnr Std Kit-ROSA26 Site, vector type | TBD | Insert GFP into mouse ROSA26 site as control |\n\n*Showing 1 to 3 of 3 entries*\n\n---\n\nOur design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.\n```","images":["/placeholder.svg"],"priceRange":"","dataDescription":"","showInFeatured":false,"showInGeneEditing":false}'::JSONB),
    ('sc-01', 'Stable Cell Line Stock', 'Ready-to-use stable cell line stocks for research applications.', '/placeholder.svg', '/products/stable-cell-line-stock', 'stable-cell-lines', NULL, 'quote', 8, NULL, NULL, 'SC-001', 'In Stock', 'Contact for Quote', NULL, TRUE, FALSE, FALSE, FALSE, ARRAY['Authenticated', 'Mycoplasma-tested', 'Application-ready']::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, 'Store in liquid nitrogen or as specified.', 'QC documentation available upon request.', NULL, ARRAY['Cell Line Handling Guide (PDF)']::TEXT[], ARRAY[]::TEXT[], ARRAY['/placeholder.svg']::TEXT[], '', '# BioArk Technologies

BioArk Technologies is continuously expanding its stable cell line stock, offering an ever-growing selection of gene-specific modifications. Our mission is to provide high-quality, pre-validated stable cell lines at an affordable price while fostering scientific collaboration and resource sharing.

Explore our expanding list of cost-effective, pre-constructed stable cell lines here.

---

| Stable Cell Line | | | Gene Editing Feature | | | | |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Product Name** | **SKU** | **Description** | **Promoter** | **Protein Tag** | **Fluorescence Marker** | **Selection Marker** | **Target Gene** | **Cell Background** |
| OverExp Lenti Kit | EML-CXD0PC-LARGETc | The large T antigen is integrated by lentivirus | PCMV | MycDDK | None | Puro | LargeT | Fibroblast Cells |

*Showing 1 to 2 of 2 entries*

---

Our design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.

If you have any further inquiries regarding your project, please click the button to contact us. We are fully equipped to accommodate a wide range of your requirements.
```', FALSE, '{"id":"sc-01"}'::JSONB, '{"name":"Stable Cell Line Stock","description":"Ready-to-use stable cell line stocks for research applications.","link":"/products/stable-cell-line-stock","category":"stable-cell-lines","order":8,"__type":"quote"}'::JSONB, '{"catalogNumber":"SC-001","availability":"In Stock","listPrice":"Contact for Quote","options":[],"optionPrices":{},"keyFeatures":["Authenticated","Mycoplasma-tested","Application-ready"],"storageStability":"Store in liquid nitrogen or as specified.","performanceData":"QC documentation available upon request.","manuals":["Cell Line Handling Guide (PDF)"],"manualUrls":[],"storeLink":"","quoteOnly":true,"contentText":"# BioArk Technologies\n\nBioArk Technologies is continuously expanding its stable cell line stock, offering an ever-growing selection of gene-specific modifications. Our mission is to provide high-quality, pre-validated stable cell lines at an affordable price while fostering scientific collaboration and resource sharing.\n\nExplore our expanding list of cost-effective, pre-constructed stable cell lines here.\n\n---\n\n| Stable Cell Line | | | Gene Editing Feature | | | | |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n| **Product Name** | **SKU** | **Description** | **Promoter** | **Protein Tag** | **Fluorescence Marker** | **Selection Marker** | **Target Gene** | **Cell Background** |\n| OverExp Lenti Kit | EML-CXD0PC-LARGETc | The large T antigen is integrated by lentivirus | PCMV | MycDDK | None | Puro | LargeT | Fibroblast Cells |\n\n*Showing 1 to 2 of 2 entries*\n\n---\n\nOur design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.\n\nIf you have any further inquiries regarding your project, please click the button to contact us. We are fully equipped to accommodate a wide range of your requirements.\n```","images":["/placeholder.svg"]}'::JSONB),
    ('custom-1759879837546', 'Non-Viral RNAi Vector', 'A high-efficiency, non-viral RNAi plasmid designed for customizable, stable, or transient gene silencing in mammalian cells.', '/content-api/uploads/originals/c5ac4a80-c1b8-4a65-bfd6-2cff30793e96.png', '/products/nonviral-rnai-template', 'vector-clones', 'Non-Viral', 'quote', 9, 1759879837546, to_timestamp(1759879837546 / 1000.0), 'SHS-UX00PA', 'Ready To Order', '', '$299', TRUE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, '', '', 'Support Documents', ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['/content-api/uploads/originals/c5ac4a80-c1b8-4a65-bfd6-2cff30793e96.png', '/content-api/uploads/originals/5a8011d4-06aa-45d6-ab93-9ae692c8f9d6.png', '/content-api/uploads/originals/ae36de5d-e9fe-4dbb-837d-cb8198b45646.png', '/content-api/uploads/originals/9c956c8c-5f7c-45e2-a3e5-87807324aea3.png', '/content-api/uploads/originals/0c525c15-a111-4c49-9d2c-c80046c7cf79.png', '/content-api/uploads/originals/dbd48ede-551b-491d-99ea-aa75f96d11c8.png', '/content-api/uploads/originals/eb9cef4a-5e19-4224-a6fc-adcc03ad13a1.png', '/content-api/uploads/originals/f3740117-de84-456d-bce5-c2e8191c5d6e.png']::TEXT[], 'https://store.bioarktech.com/cart', '# Product Description

Our **Non-Viral RNAi Plasmid** provides a **flexible and efficient solution** for **stable or transient gene silencing** in mammalian cells.  
Designed for **high-efficiency RNA interference (RNAi)**, this plasmid enables researchers to easily **clone**, **express**, and **evaluate shRNA or miRNA constructs** targeting genes of interest—**without the use of viral vectors**.  

The system supports a wide range of **functional genomics** and **molecular biology** applications, including **loss-of-function studies**, **pathway analysis**, and **phenotypic screening**.  

---

# Key Features

- 🔹 **High-Efficiency Gene Silencing**  
  Optimized expression of **shRNA or miRNA sequences** under strong **U6** or **H1 promoters** ensures robust and consistent knockdown of target genes.  

- 🔹 **Customizable Promoter Options**  
  Combine **RNA Pol III promoters (U6/H1)** with **constitutive Pol II promoters** (e.g., **CMV**, **EF1α**, **CAG**) for **dual-expression systems** or **regulated knockdown**.  

- 🔹 **Selectable Markers**  
  Available with **Puromycin**, **Neomycin (G418)**, **Blasticidin**, or **Hygromycin** resistance cassettes for **stable cell selection** in various cell types.  

- 🔹 **Fluorescent Reporter Integration**  
  Optional **GFP**, **RFP**, **BFP**, or **mCherry** reporters allow easy monitoring of **transfection efficiency** and **cell selection**.  

- 🔹 **Cloning Flexibility**  
  Supports **multiple cloning sites (MCS)** and is compatible with **Gateway®** or **Gibson Assembly®**, streamlining the insertion of **custom RNAi sequences**.  

- 🔹 **Non-Viral and Safe**  
  Completely **non-viral**, avoiding biosafety concerns, and ideal for **in vitro** and **preclinical research applications**.  

---

# Applications

- **Gene knockdown** and **loss-of-function** studies  
- **Functional genomics** and **pathway dissection**  
- **Target validation** and **drug screening**  
- **Phenotypic screening** for gene function analysis  
- **Reporter-based assays** for silencing efficiency evaluation
', FALSE, '{"id":"custom-1759879837546","name":"Non-Viral RNAi Vector","description":"A high-efficiency, non-viral RNAi plasmid designed for customizable, stable, or transient gene silencing in mammalian cells.","imageUrl":"","link":"/products/nonviral-rnai-template","category":"vector-clones","createdAt":1759879837546,"__type":"quote","order":9}'::JSONB, NULL, '{"images":["/content-api/uploads/originals/c5ac4a80-c1b8-4a65-bfd6-2cff30793e96.png","/content-api/uploads/originals/5a8011d4-06aa-45d6-ab93-9ae692c8f9d6.png","/content-api/uploads/originals/ae36de5d-e9fe-4dbb-837d-cb8198b45646.png","/content-api/uploads/originals/9c956c8c-5f7c-45e2-a3e5-87807324aea3.png","/content-api/uploads/originals/0c525c15-a111-4c49-9d2c-c80046c7cf79.png","/content-api/uploads/originals/dbd48ede-551b-491d-99ea-aa75f96d11c8.png","/content-api/uploads/originals/eb9cef4a-5e19-4224-a6fc-adcc03ad13a1.png","/content-api/uploads/originals/f3740117-de84-456d-bce5-c2e8191c5d6e.png"],"quoteOnly":true,"createdAt":1759879837546,"catalogNumber":"SHS-UX00PA","availability":"Ready To Order","listPrice":"","options":[],"optionPrices":{},"keyFeatures":[],"storageStability":"","performanceData":"","manuals":[],"manualUrls":[],"storeLink":"https://store.bioarktech.com/cart","contentText":"# Product Description\n\nOur **Non-Viral RNAi Plasmid** provides a **flexible and efficient solution** for **stable or transient gene silencing** in mammalian cells.  \nDesigned for **high-efficiency RNA interference (RNAi)**, this plasmid enables researchers to easily **clone**, **express**, and **evaluate shRNA or miRNA constructs** targeting genes of interest—**without the use of viral vectors**.  \n\nThe system supports a wide range of **functional genomics** and **molecular biology** applications, including **loss-of-function studies**, **pathway analysis**, and **phenotypic screening**.  \n\n---\n\n# Key Features\n\n- 🔹 **High-Efficiency Gene Silencing**  \n  Optimized expression of **shRNA or miRNA sequences** under strong **U6** or **H1 promoters** ensures robust and consistent knockdown of target genes.  \n\n- 🔹 **Customizable Promoter Options**  \n  Combine **RNA Pol III promoters (U6/H1)** with **constitutive Pol II promoters** (e.g., **CMV**, **EF1α**, **CAG**) for **dual-expression systems** or **regulated knockdown**.  \n\n- 🔹 **Selectable Markers**  \n  Available with **Puromycin**, **Neomycin (G418)**, **Blasticidin**, or **Hygromycin** resistance cassettes for **stable cell selection** in various cell types.  \n\n- 🔹 **Fluorescent Reporter Integration**  \n  Optional **GFP**, **RFP**, **BFP**, or **mCherry** reporters allow easy monitoring of **transfection efficiency** and **cell selection**.  \n\n- 🔹 **Cloning Flexibility**  \n  Supports **multiple cloning sites (MCS)** and is compatible with **Gateway®** or **Gibson Assembly®**, streamlining the insertion of **custom RNAi sequences**.  \n\n- 🔹 **Non-Viral and Safe**  \n  Completely **non-viral**, avoiding biosafety concerns, and ideal for **in vitro** and **preclinical research applications**.  \n\n---\n\n# Applications\n\n- **Gene knockdown** and **loss-of-function** studies  \n- **Functional genomics** and **pathway dissection**  \n- **Target validation** and **drug screening**  \n- **Phenotypic screening** for gene function analysis  \n- **Reporter-based assays** for silencing efficiency evaluation\n","priceRange":"$299","dataDescription":"Support Documents","showInFeatured":false,"showInGeneEditing":false}'::JSONB),
    ('custom-1759628557002', 'Non-Viral CDS Vector', 'he Non-Viral Overexpression Plasmid System enables efficient, customizable expression of target genes in mammalian cells without the use of viral vectors. Designed for flexibility, the plasmids support multiple promoters (CMV, EF1α, CAG), selection markers (Puromycin, Neomycin, Blasticidin, Hygromycin), fluorescent reporters (GFP, RFP, mCherry), and epitope tags (FLAG, HA, Myc, His), providing a versatile solution for gene function studies, protein production, and pathway analysis.', '/content-api/uploads/originals/25856f6f-df8b-42cb-8790-08f8091b19eb.png', '/products/non-viral-gene-overexpression-plasmid-template', 'vector-clones', 'Non-Viral', 'quote', 10, 1759628557002, to_timestamp(1759628557002 / 1000.0), 'EMS-FXD0PA', 'Ready To Order', '$299+syn.', '$299', TRUE, FALSE, FALSE, FALSE, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, '', '', 'Support Documents', ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['/content-api/uploads/originals/25856f6f-df8b-42cb-8790-08f8091b19eb.png', '/content-api/uploads/originals/9d798728-5315-48cf-bed6-83c1de4feddc.png', '/content-api/uploads/originals/caa1b243-6768-417c-9131-8c7e8f967f3a.png', '/content-api/uploads/originals/795dcbd2-9c3b-491c-9118-e2d7525948f5.png', '/content-api/uploads/originals/70d782c7-d888-44ba-94f4-40416e698028.png', '/content-api/uploads/originals/6891d83d-8628-40f2-bcec-67adc4a2e61d.png', '/content-api/uploads/originals/cd084f52-788c-46df-b93e-9e884cbbbedd.png', '/content-api/uploads/originals/319edd09-18f2-4299-961d-fc1deca74c6d.png']::TEXT[], 'https://store.bioarktech.com/cart', '# Non-Viral Overexpression Plasmid

Our **Non-Viral Overexpression Plasmid** provides a **flexible and efficient solution** for **stable or transient expression** of genes of interest in mammalian cells.  
Designed for **high-level, customizable gene expression**, this plasmid enables researchers to easily **clone, express, and analyze** target genes **without the use of viral vectors**.  

The system supports a wide range of **molecular biology** and **functional genomics applications**, including **protein production**, **pathway studies**, **phenotypic screening**, and **functional validation**.

---

## Key Features

- 🔹 **Versatile Expression Control**  
  Choose from **strong constitutive promoters** (e.g., CMV, EF1α, CAG, or PGK) for customized regulation of target gene expression.  

- 🔹 **Customizable Selection Markers**  
  Available with a variety of **antibiotic resistance genes**, including **Puromycin**, **Neomycin (G418)**, **Blasticidin**, or **Hygromycin**, for flexible selection across cell types.  

- 🔹 **Fluorescent Reporter Options**  
  Integrated **fluorescent markers** (e.g., GFP, miniGFP, RFP, BFP, mCherry) facilitate **real-time tracking** of transfection efficiency and expression.  

- 🔹 **Tag Integration**  
  Support for **epitope tags** such as **FLAG**, **HA**, **Myc**, or **His**, enabling downstream **detection**, **purification**, or **localization** studies.  

- 🔹 **Multiple Cloning and Compatibility**  
  Engineered with **multiple cloning sites (MCS)** and optional **Gateway®** or **Gibson Assembly®** compatibility for efficient gene insertion.  

- 🔹 **Non-Viral and Safe**  
  Eliminates **biosafety concerns** associated with viral delivery, suitable for both **in vitro** and **preclinical** research applications.  

---

## Applications

- Gene and protein overexpression studies  
- Functional genomics and pathway analysis  
- Recombinant protein production  
- Drug screening and target validation  
- Fluorescence-based cell tracking


', FALSE, '{"id":"custom-1759628557002","name":"Non-Viral CDS Vector","description":"he Non-Viral Overexpression Plasmid System enables efficient, customizable expression of target genes in mammalian cells without the use of viral vectors. Designed for flexibility, the plasmids support multiple promoters (CMV, EF1α, CAG), selection markers (Puromycin, Neomycin, Blasticidin, Hygromycin), fluorescent reporters (GFP, RFP, mCherry), and epitope tags (FLAG, HA, Myc, His), providing a versatile solution for gene function studies, protein production, and pathway analysis.","imageUrl":"","link":"/products/non-viral-gene-overexpression-plasmid-template","category":"vector-clones","createdAt":1759628557002,"__type":"quote","order":10}'::JSONB, NULL, '{"images":["/content-api/uploads/originals/25856f6f-df8b-42cb-8790-08f8091b19eb.png","/content-api/uploads/originals/9d798728-5315-48cf-bed6-83c1de4feddc.png","/content-api/uploads/originals/caa1b243-6768-417c-9131-8c7e8f967f3a.png","/content-api/uploads/originals/795dcbd2-9c3b-491c-9118-e2d7525948f5.png","/content-api/uploads/originals/70d782c7-d888-44ba-94f4-40416e698028.png","/content-api/uploads/originals/6891d83d-8628-40f2-bcec-67adc4a2e61d.png","/content-api/uploads/originals/cd084f52-788c-46df-b93e-9e884cbbbedd.png","/content-api/uploads/originals/319edd09-18f2-4299-961d-fc1deca74c6d.png"],"quoteOnly":true,"createdAt":1759628557002,"catalogNumber":"EMS-FXD0PA","availability":"Ready To Order","listPrice":"$299+syn.","options":[],"optionPrices":{},"keyFeatures":[],"storageStability":"","performanceData":"","manuals":[],"manualUrls":[],"storeLink":"https://store.bioarktech.com/cart","contentText":"# Non-Viral Overexpression Plasmid\n\nOur **Non-Viral Overexpression Plasmid** provides a **flexible and efficient solution** for **stable or transient expression** of genes of interest in mammalian cells.  \nDesigned for **high-level, customizable gene expression**, this plasmid enables researchers to easily **clone, express, and analyze** target genes **without the use of viral vectors**.  \n\nThe system supports a wide range of **molecular biology** and **functional genomics applications**, including **protein production**, **pathway studies**, **phenotypic screening**, and **functional validation**.\n\n---\n\n## Key Features\n\n- 🔹 **Versatile Expression Control**  \n  Choose from **strong constitutive promoters** (e.g., CMV, EF1α, CAG, or PGK) for customized regulation of target gene expression.  \n\n- 🔹 **Customizable Selection Markers**  \n  Available with a variety of **antibiotic resistance genes**, including **Puromycin**, **Neomycin (G418)**, **Blasticidin**, or **Hygromycin**, for flexible selection across cell types.  \n\n- 🔹 **Fluorescent Reporter Options**  \n  Integrated **fluorescent markers** (e.g., GFP, miniGFP, RFP, BFP, mCherry) facilitate **real-time tracking** of transfection efficiency and expression.  \n\n- 🔹 **Tag Integration**  \n  Support for **epitope tags** such as **FLAG**, **HA**, **Myc**, or **His**, enabling downstream **detection**, **purification**, or **localization** studies.  \n\n- 🔹 **Multiple Cloning and Compatibility**  \n  Engineered with **multiple cloning sites (MCS)** and optional **Gateway®** or **Gibson Assembly®** compatibility for efficient gene insertion.  \n\n- 🔹 **Non-Viral and Safe**  \n  Eliminates **biosafety concerns** associated with viral delivery, suitable for both **in vitro** and **preclinical** research applications.  \n\n---\n\n## Applications\n\n- Gene and protein overexpression studies  \n- Functional genomics and pathway analysis  \n- Recombinant protein production  \n- Drug screening and target validation  \n- Fluorescence-based cell tracking\n\n\n","priceRange":"$299","dataDescription":"Support Documents","showInFeatured":false,"showInGeneEditing":false}'::JSONB),
    ('lv-02', 'Lentivirus Control Stock', 'Control lentiviral stocks for assay validation and benchmarking.', '/placeholder.svg', '/products/lentivirus-control-stock', 'lentivirus', 'LentiVirus', 'quote', 12, NULL, NULL, 'LV-002', 'In Stock', 'Contact for Quote', '', TRUE, FALSE, FALSE, FALSE, ARRAY['Positive/negative controls', 'Consistent titers', 'Ready-to-use']::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB, 'Store at -80°C. Avoid repeated freeze-thaw cycles.', 'Validated for use across common cell lines.', '', ARRAY['Control Stock Guide (PDF)']::TEXT[], ARRAY[]::TEXT[], ARRAY['/placeholder.svg']::TEXT[], '', '# BioArk Technologies

BioArk Technologies is continuously expanding its collection of cDNA lentivirus stocks, offering a growing selection of control lentiviruses for various research applications. Our mission is to provide high-quality, pre-packaged lentiviruses at an affordable price while fostering scientific collaboration and resource sharing.

Explore our expanding list of cost-effective, pre-constructed lentivirus controls [here](#).

---

## Lentivirus Controls Catalog

| Category        | Class               | Product Name                              | SKU                     | Accessory Virus | Promoter   | Protein Tag | Fluorescence Marker | Selection Marker |
|-----------------|---------------------|-------------------------------------------|-------------------------|-----------------|------------|-------------|---------------------|------------------|
| Overexpression  | Viral All-in-one    | OverExp Lenti Ctrl Kit, lentivirus type   | EML-CXDG0C-000000l      | None            | PCMV       | MycDDK      | GFP                 | None             |
| Inducible       | Viral All-in-one    | Inducible Lenti-AIO Ctrl Kit, lentivirus type | IMM-DXDGPC-000000l  | None            | Inducible  | MycDDK      | GFP                 | Puro             |

*Showing 1 to 3 of 3 entries*  
*10 entries per page*  
*Search functionality available*

---

Our design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.
```', FALSE, '{"id":"lv-02"}'::JSONB, '{"name":"Lentivirus Control Stock","description":"Control lentiviral stocks for assay validation and benchmarking.","link":"/products/lentivirus-control-stock","category":"lentivirus","order":12,"__type":"quote"}'::JSONB, '{"catalogNumber":"LV-002","availability":"In Stock","listPrice":"Contact for Quote","options":[],"optionPrices":{},"keyFeatures":["Positive/negative controls","Consistent titers","Ready-to-use"],"storageStability":"Store at -80°C. Avoid repeated freeze-thaw cycles.","performanceData":"Validated for use across common cell lines.","manuals":["Control Stock Guide (PDF)"],"manualUrls":[],"storeLink":"","quoteOnly":true,"contentText":"# BioArk Technologies\n\nBioArk Technologies is continuously expanding its collection of cDNA lentivirus stocks, offering a growing selection of control lentiviruses for various research applications. Our mission is to provide high-quality, pre-packaged lentiviruses at an affordable price while fostering scientific collaboration and resource sharing.\n\nExplore our expanding list of cost-effective, pre-constructed lentivirus controls [here](#).\n\n---\n\n## Lentivirus Controls Catalog\n\n| Category        | Class               | Product Name                              | SKU                     | Accessory Virus | Promoter   | Protein Tag | Fluorescence Marker | Selection Marker |\n|-----------------|---------------------|-------------------------------------------|-------------------------|-----------------|------------|-------------|---------------------|------------------|\n| Overexpression  | Viral All-in-one    | OverExp Lenti Ctrl Kit, lentivirus type   | EML-CXDG0C-000000l      | None            | PCMV       | MycDDK      | GFP                 | None             |\n| Inducible       | Viral All-in-one    | Inducible Lenti-AIO Ctrl Kit, lentivirus type | IMM-DXDGPC-000000l  | None            | Inducible  | MycDDK      | GFP                 | Puro             |\n\n*Showing 1 to 3 of 3 entries*  \n*10 entries per page*  \n*Search functionality available*\n\n---\n\nOur design program assists customers in adjusting vector components and developing specific functions tailored to their unique requirements.\n```","images":["/placeholder.svg"],"priceRange":"","dataDescription":"","showInFeatured":false,"showInGeneEditing":false}'::JSONB)
ON CONFLICT (external_id)
DO UPDATE SET
    product_name = EXCLUDED.product_name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    product_link = EXCLUDED.product_link,
    category_external_id = EXCLUDED.category_external_id,
    product_group = EXCLUDED.product_group,
    source_type = EXCLUDED.source_type,
    display_order = EXCLUDED.display_order,
    source_created_at_ms = EXCLUDED.source_created_at_ms,
    source_created_at = EXCLUDED.source_created_at,
    catalog_number = EXCLUDED.catalog_number,
    availability = EXCLUDED.availability,
    list_price = EXCLUDED.list_price,
    price_range = EXCLUDED.price_range,
    quote_only = EXCLUDED.quote_only,
    is_featured = EXCLUDED.is_featured,
    show_in_featured = EXCLUDED.show_in_featured,
    show_in_gene_editing = EXCLUDED.show_in_gene_editing,
    key_features = EXCLUDED.key_features,
    options = EXCLUDED.options,
    option_prices = EXCLUDED.option_prices,
    storage_stability = EXCLUDED.storage_stability,
    performance_data = EXCLUDED.performance_data,
    data_description = EXCLUDED.data_description,
    manuals = EXCLUDED.manuals,
    manual_urls = EXCLUDED.manual_urls,
    images = EXCLUDED.images,
    store_link = EXCLUDED.store_link,
    content_text = EXCLUDED.content_text,
    hidden = EXCLUDED.hidden,
    raw_product = EXCLUDED.raw_product,
    raw_override = EXCLUDED.raw_override,
    raw_detail = EXCLUDED.raw_detail,
    updated_at = NOW();
