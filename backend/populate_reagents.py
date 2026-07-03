import os
import django
import sys

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product

# Check if reagents are already populated
if Product.objects.filter(source_type='reagent').count() > 5:
    print("Reagents already populated. Skipping population script.")
    sys.exit(0)

print("Populating and categorizing reagents...")

# 1. Update existing reagents categories and groups to ensure alignment
reagent_updates = {
    'DNA 1kb Ladder': ('category-1765063995229', 'DNA Ladders'),
    'DNA 100bp Ladder': ('category-1765063995229', 'DNA Ladders'),
    'Prestained Protein Marker 180KD (10-180KD)': ('category-1766675365489', 'Protein Markers'),
    'Prestained Protein Marker 250KD (10-250KD)': ('category-1766675365489', 'Protein Markers'),
}

for name, (cat_id, group) in reagent_updates.items():
    try:
        p = Product.objects.get(product_name=name)
        p.category_external_id = cat_id
        p.product_group = group
        p.source_type = 'reagent'
        p.save()
        print(f"Updated existing reagent '{name}' to category '{cat_id}' and group '{group}'")
    except Product.DoesNotExist:
        print(f"Product '{name}' not found for update.")

# Consumables updates (ensure all consumables are in category-1780539818236)
consumables = Product.objects.filter(source_type='reagent').exclude(
    category_external_id__in=['category-1765063995229', 'category-1766675365489', 'category-1766675380397', 'category-1765995504911']
)
for c in consumables:
    c.category_external_id = 'category-1780539818236'
    c.save()

# 2. Add missing reagents
new_reagents = [
    # --- DNA Reagents ---
    {
        'product_name': 'THUNDERBIRD Probe qPCR Mix',
        'external_id': 'thunderbird-probe-qpcr-mix',
        'catalog_number': 'QPS-101',
        'category_external_id': 'category-1765063995229',
        'product_group': 'qPCR Reagents',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/sybr_green_qpcr_master_mix.jpg',
        'description': 'High-performance 2x master mix designed for real-time PCR using TaqMan probes.'
    },
    {
        'product_name': 'THUNDERBIRD Next Probe qPCR Mix',
        'external_id': 'thunderbird-next-probe-qpcr-mix',
        'catalog_number': 'QPX-101',
        'category_external_id': 'category-1765063995229',
        'product_group': 'qPCR Reagents',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/sybr_green_qpcr_master_mix.jpg',
        'description': 'Next-generation qPCR master mix featuring enhanced resistance to PCR inhibitors and higher sensitivity.'
    },
    {
        'product_name': 'THUNDERBIRD SYBR qPCR Mix',
        'external_id': 'thunderbird-sybr-qpcr-mix',
        'catalog_number': 'QPS-201',
        'category_external_id': 'category-1765063995229',
        'product_group': 'qPCR Reagents',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/sybr_green_qpcr_master_mix.jpg',
        'description': 'High-performance 2x master mix for real-time PCR using SYBR Green I detection.'
    },
    {
        'product_name': 'THUNDERBIRD Next SYBR qPCR Mix',
        'external_id': 'thunderbird-next-sybr-qpcr-mix',
        'catalog_number': 'QPX-201',
        'category_external_id': 'category-1765063995229',
        'product_group': 'qPCR Reagents',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/sybr_green_qpcr_master_mix.jpg',
        'description': 'Next-generation SYBR Green real-time PCR mix with fast cycling capabilities and high specificity.'
    },
    {
        'product_name': 'Taq DNA Polymerase',
        'external_id': 'taq-dna-polymerase',
        'catalog_number': 'TAP-201',
        'category_external_id': 'category-1765063995229',
        'product_group': 'PCR Enzymes',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/dna_polymerase_enzyme.png',
        'description': 'Recombinant Taq DNA Polymerase for standard PCR applications.'
    },
    {
        'product_name': 'rTaq DNA Polymerase',
        'external_id': 'rtaq-dna-polymerase',
        'catalog_number': 'TAP-202',
        'category_external_id': 'category-1765063995229',
        'product_group': 'PCR Enzymes',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/dna_polymerase_enzyme.png',
        'description': 'Highly purified recombinant Taq DNA Polymerase for high-yield PCR.'
    },
    {
        'product_name': 'rTth DNA Polymerase',
        'external_id': 'rtth-dna-polymerase',
        'catalog_number': 'TAP-301',
        'category_external_id': 'category-1765063995229',
        'product_group': 'PCR Enzymes',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/dna_polymerase_enzyme.png',
        'description': 'Thermostable DNA polymerase with reverse transcriptase activity in the presence of manganese ions.'
    },
    {
        'product_name': 'KOD Multi & Epi DNA polymerase',
        'external_id': 'kod-multi-epi-dna-polymerase',
        'catalog_number': 'KOD-401',
        'category_external_id': 'category-1765063995229',
        'product_group': 'PCR Enzymes',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/dna_polymerase_enzyme.png',
        'description': 'High-fidelity DNA polymerase designed for amplification from challenging templates, including epigenetically modified DNA.'
    },
    {
        'product_name': 'Hot Start TTx DNA Polymerase',
        'external_id': 'hot-start-ttx-dna-polymerase',
        'catalog_number': 'TTX-101',
        'category_external_id': 'category-1765063995229',
        'product_group': 'PCR Enzymes',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/dna_polymerase_enzyme.png',
        'description': 'Antibody-mediated hot start DNA polymerase for highly specific PCR.'
    },
    {
        'product_name': 'KOD One PCR Master Mix',
        'external_id': 'kod-one-pcr-master-mix',
        'catalog_number': 'KOD-301',
        'category_external_id': 'category-1765063995229',
        'product_group': 'PCR Master Mixes',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/dna_polymerase_enzyme.png',
        'description': 'Ready-to-use 2x PCR master mix containing KOD One DNA polymerase for ultra-fast PCR.'
    },
    {
        'product_name': 'KOD -Plus- Mutagenesis Kit',
        'external_id': 'kod-plus-mutagenesis-kit',
        'catalog_number': 'KOD-201',
        'category_external_id': 'category-1765063995229',
        'product_group': 'Mutagenesis Kits',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/dna_polymerase_enzyme.png',
        'description': 'High-efficiency site-directed mutagenesis kit utilizing high-fidelity KOD -Plus- DNA polymerase.'
    },
    {
        'product_name': 'KOD One PCR Master Mix -Blue-',
        'external_id': 'kod-one-pcr-master-mix-blue',
        'catalog_number': 'KOD-302',
        'category_external_id': 'category-1765063995229',
        'product_group': 'PCR Master Mixes',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/dna_polymerase_enzyme.png',
        'description': 'KOD One PCR Master Mix pre-mixed with loading dye for direct gel loading.'
    },
    {
        'product_name': 'DNA 100bp Ladder',
        'external_id': 'BADM3367',
        'catalog_number': 'BADM3367',
        'category_external_id': 'category-1765063995229',
        'product_group': 'DNA Ladders',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/dna_1kb_ladder.jpg',
        'description': 'BioArk DNA 100 bp Ladder consists of 10 linear double-stranded DNA fragments (100-1000 bp) premixed with loading buffer for electrophoresis.'
    },
    {
        'product_name': 'DNA 1kb Ladder',
        'external_id': 'BADM3363',
        'catalog_number': 'BADM3363',
        'category_external_id': 'category-1765063995229',
        'product_group': 'DNA Ladders',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/dna_1kb_ladder.jpg',
        'description': 'BioArk DNA 1kb Ladder consists of 10 linear double-stranded DNA bands (300-10000bp) premixed with loading buffer for electrophoresis.'
    },
    {
        'product_name': '1% Precast Agarose Gel, 100bp Ladder, 10pcs/box, All-in-one',
        'external_id': 'precast-agarose-gel-1-100bp',
        'catalog_number': 'PAG-101',
        'category_external_id': 'category-1765063995229',
        'product_group': 'Precast Agarose Gels',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/precast_mini_protein_gel.jpg',
        'description': 'High-resolution 1% precast agarose gel with integrated 100bp DNA ladder for convenient and efficient DNA electrophoresis, 10 pcs per box.'
    },
    {
        'product_name': '1.2% Precast Agarose Gel, 100bp Ladder, 10pcs/box, All-in-one',
        'external_id': 'precast-agarose-gel-12-100bp',
        'catalog_number': 'PAG-102',
        'category_external_id': 'category-1765063995229',
        'product_group': 'Precast Agarose Gels',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/precast_mini_protein_gel.jpg',
        'description': 'High-resolution 1.2% precast agarose gel with integrated 100bp DNA ladder for convenient and efficient DNA electrophoresis, 10 pcs per box.'
    },
    {
        'product_name': '1.5% Precast Agarose Gel, 100bp Ladder, 10pcs/box, All-in-one',
        'external_id': 'precast-agarose-gel-15-100bp',
        'catalog_number': 'PAG-103',
        'category_external_id': 'category-1765063995229',
        'product_group': 'Precast Agarose Gels',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/precast_mini_protein_gel.jpg',
        'description': 'High-resolution 1.5% precast agarose gel with integrated 100bp DNA ladder for convenient and efficient DNA electrophoresis, 10 pcs per box.'
    },
    {
        'product_name': '2% Precast Agarose Gel, 100bp Ladder, 10pcs/box, All-in-one',
        'external_id': 'precast-agarose-gel-2-100bp',
        'catalog_number': 'PAG-104',
        'category_external_id': 'category-1765063995229',
        'product_group': 'Precast Agarose Gels',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/precast_mini_protein_gel.jpg',
        'description': 'High-resolution 2% precast agarose gel with integrated 100bp DNA ladder for convenient and efficient DNA electrophoresis, 10 pcs per box.'
    },
    {
        'product_name': '1% Precast Agarose Gel, 1000bp Ladder, 10pcs/box, All-in-one',
        'external_id': 'precast-agarose-gel-1-1000bp',
        'catalog_number': 'PAG-201',
        'category_external_id': 'category-1765063995229',
        'product_group': 'Precast Agarose Gels',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/precast_mini_protein_gel.jpg',
        'description': 'High-resolution 1% precast agarose gel with integrated 1000bp (1kb) DNA ladder for convenient and efficient DNA electrophoresis, 10 pcs per box.'
    },
    {
        'product_name': '1.2% Precast Agarose Gel, 1000bp Ladder, 10pcs/box, All-in-one',
        'external_id': 'precast-agarose-gel-12-1000bp',
        'catalog_number': 'PAG-202',
        'category_external_id': 'category-1765063995229',
        'product_group': 'Precast Agarose Gels',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/precast_mini_protein_gel.jpg',
        'description': 'High-resolution 1.2% precast agarose gel with integrated 1000bp (1kb) DNA ladder for convenient and efficient DNA electrophoresis, 10 pcs per box.'
    },
    {
        'product_name': '1.5% Precast Agarose Gel, 1000bp Ladder, 10pcs/box, All-in-one',
        'external_id': 'precast-agarose-gel-15-1000bp',
        'catalog_number': 'PAG-203',
        'category_external_id': 'category-1765063995229',
        'product_group': 'Precast Agarose Gels',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/precast_mini_protein_gel.jpg',
        'description': 'High-resolution 1.5% precast agarose gel with integrated 1000bp (1kb) DNA ladder for convenient and efficient DNA electrophoresis, 10 pcs per box.'
    },
    {
        'product_name': '2% Precast Agarose Gel, 1000bp Ladder, 10pcs/box, All-in-one',
        'external_id': 'precast-agarose-gel-2-1000bp',
        'catalog_number': 'PAG-204',
        'category_external_id': 'category-1765063995229',
        'product_group': 'Precast Agarose Gels',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'image_url': 'reagent_images/precast_mini_protein_gel.jpg',
        'description': 'High-resolution 2% precast agarose gel with integrated 1000bp (1kb) DNA ladder for convenient and efficient DNA electrophoresis, 10 pcs per box.'
    },
    
    # --- RNA Reagents ---
    {
        'product_name': 'ReverTra Ace qPCR RT Kit',
        'external_id': 'revertra-ace-qpcr-rt-kit',
        'catalog_number': 'TRT-101',
        'category_external_id': 'category-1766675380397',
        'product_group': 'Reverse Transcription',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'High-efficiency cDNA synthesis kit for qPCR applications using ReverTra Ace reverse transcriptase.'
    },
    {
        'product_name': 'ReverTra Ace qPCR RT Master Mix',
        'external_id': 'revertra-ace-qpcr-rt-master-mix',
        'catalog_number': 'TRT-201',
        'category_external_id': 'category-1766675380397',
        'product_group': 'Reverse Transcription',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'Ready-to-use reverse transcription master mix for quick and simple cDNA synthesis.'
    },
    {
        'product_name': 'ReverTra Ace qPCR RT Master Mix gDNA Remover',
        'external_id': 'revertra-ace-qpcr-rt-master-mix-gdna-remover',
        'catalog_number': 'TRT-202',
        'category_external_id': 'category-1766675380397',
        'product_group': 'Reverse Transcription',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'cDNA synthesis master mix combined with genomic DNA removal reagents to ensure RNA-specific amplification.'
    },
    {
        'product_name': 'SuperPrep II Cell Lysis & RT Kit for qPCR, high throughput',
        'external_id': 'superprep-ii-cell-lysis-rt-kit',
        'catalog_number': 'SCX-101',
        'category_external_id': 'category-1766675380397',
        'product_group': 'Reverse Transcription',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'High-throughput cell lysis and reverse transcription kit to prepare cDNA directly from cultured cells without RNA purification.'
    },
    {
        'product_name': 'THUNDERBIRD Probe One-step qRT-PCR Kit',
        'external_id': 'thunderbird-probe-one-step-qrt-pcr-kit',
        'catalog_number': 'QRH-101',
        'category_external_id': 'category-1766675380397',
        'product_group': 'One-step qRT-PCR',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'High-efficiency one-step real-time RT-PCR kit using TaqMan probe detection.'
    },
    {
        'product_name': 'THUNDERBIRD Next Probe One-step qRT-PCR 4x Mix',
        'external_id': 'thunderbird-next-probe-one-step-qrt-pcr-4x-mix',
        'catalog_number': 'QRX-101',
        'category_external_id': 'category-1766675380397',
        'product_group': 'One-step qRT-PCR',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'Concentrated 4x master mix for highly sensitive one-step real-time RT-PCR using probes.'
    },
    {
        'product_name': 'Thermo T7 RNA polymerase',
        'external_id': 'thermo-t7-rna-polymerase',
        'catalog_number': 'TRN-101',
        'category_external_id': 'category-1766675380397',
        'product_group': 'RNA Transcription',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'T7 RNA Polymerase for in vitro transcription of RNA from DNA templates containing the T7 promoter.'
    },
    {
        'product_name': 'RNase Inhibitor',
        'external_id': 'rnase-inhibitor',
        'catalog_number': 'RIN-101',
        'category_external_id': 'category-1766675380397',
        'product_group': 'RNA Protection',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'Recombinant RNase inhibitor protecting RNA from degradation by pancreatic-type RNases.'
    },
    
    # --- Protein Reagents ---
    {
        'product_name': 'FuturePAGE™ 4-12% Precast Mini Protein Gel, Bis-Tris, 10Pcs/box',
        'external_id': 'futurepage-4-12-precast-mini-protein-gel',
        'catalog_number': 'FPG-412',
        'category_external_id': 'category-1766675365489',
        'product_group': 'Precast Protein Gels',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'High-resolution Bis-Tris precast mini protein gels (4-12% gradient) for SDS-PAGE.'
    },
    {
        'product_name': 'FuturePAGE™ 4-20% Precast Mini Protein Gel, Tris-bis, 10Pcs/Box',
        'external_id': 'futurepage-4-20-precast-mini-protein-gel',
        'catalog_number': 'FPG-420',
        'category_external_id': 'category-1766675365489',
        'product_group': 'Precast Protein Gels',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'High-resolution precast mini protein gels (4-20% gradient) for SDS-PAGE.'
    },
    {
        'product_name': 'FuturePAGE™ 8% Precast Mini Protein Gel, Tris-bis, 10Pcs/Box',
        'external_id': 'futurepage-8-precast-mini-protein-gel',
        'catalog_number': 'FPG-008',
        'category_external_id': 'category-1766675365489',
        'product_group': 'Precast Protein Gels',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'High-resolution precast mini protein gels (8% fixed) for SDS-PAGE.'
    },
    {
        'product_name': 'FuturePAGE™ 10% Precast Mini Protein Gel, Tris-bis, 10Pcs/Box',
        'external_id': 'futurepage-10-precast-mini-protein-gel',
        'catalog_number': 'FPG-010',
        'category_external_id': 'category-1766675365489',
        'product_group': 'Precast Protein Gels',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'High-resolution precast mini protein gels (10% fixed) for SDS-PAGE.'
    },
    {
        'product_name': 'FuturePAGE™ 12% Precast Mini Protein Gel, Tris-bis, 10Pcs/Box',
        'external_id': 'futurepage-12-precast-mini-protein-gel',
        'catalog_number': 'FPG-012',
        'category_external_id': 'category-1766675365489',
        'product_group': 'Precast Protein Gels',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'High-resolution precast mini protein gels (12% fixed) for SDS-PAGE.'
    },
    
    # --- Cell Reagents ---
    {
        'product_name': 'Premium USDA-Origin Fetal Bovine Serum (FBS), Lonsera',
        'external_id': 'premium-usda-origin-fbs-lonsera',
        'catalog_number': 'LNS-FBS-001',
        'category_external_id': 'category-1765995504911',
        'product_group': 'Fetal Bovine Serum (FBS)',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'Premium USDA-Origin Fetal Bovine Serum (FBS) for sensitive cell culture applications.'
    },
    {
        'product_name': 'Standard-Grade Fetal Bovine Serum (FBS), Lonsera',
        'external_id': 'standard-grade-fbs-lonsera',
        'catalog_number': 'LNS-FBS-002',
        'category_external_id': 'category-1765995504911',
        'product_group': 'Fetal Bovine Serum (FBS)',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'Standard-grade Fetal Bovine Serum (FBS) for routine cell culture maintenance.'
    },
    {
        'product_name': 'Stem cells fetal bovine serum (FBS), Lonsera',
        'external_id': 'stem-cells-fbs-lonsera',
        'catalog_number': 'LNS-FBS-003',
        'category_external_id': 'category-1765995504911',
        'product_group': 'Fetal Bovine Serum (FBS)',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'Specialty FBS tested and certified for stem cell culture applications.'
    },
    
    # --- Consumables ---
    {
        'product_name': '15 mL Round-Bottom Culture Tube, Sterile',
        'external_id': '15-ml-round-bottom-culture-tube-sterile',
        'catalog_number': 'CT-15R',
        'category_external_id': 'category-1780539818236',
        'product_group': 'Culture Tubes',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': '15 mL Sterile polystyrene round-bottom culture tubes with dual-position snap caps.'
    },
    {
        'product_name': '5 mL Round-Bottom Culture Tube, Sterile',
        'external_id': '5-ml-round-bottom-culture-tube-sterile',
        'catalog_number': 'CT-05R',
        'category_external_id': 'category-1780539818236',
        'product_group': 'Culture Tubes',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': '5 mL Sterile polystyrene round-bottom culture tubes with dual-position snap caps.'
    },
    {
        'product_name': 'Sterile Cell Spreaders (Individually Packaged)',
        'external_id': 'sterile-cell-spreaders-individually-packaged',
        'catalog_number': 'CS-01I',
        'category_external_id': 'category-1780539818236',
        'product_group': 'Bacterial Culture plate',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'L-shaped sterile cell spreaders, individually wrapped.'
    },
    {
        'product_name': 'Sterile Cell Spreaders (Bulk Packaged)',
        'external_id': 'sterile-cell-spreaders-bulk-packaged',
        'catalog_number': 'CS-01B',
        'category_external_id': 'category-1780539818236',
        'product_group': 'Bacterial Culture plate',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': 'L-shaped sterile cell spreaders, bulk packaged in resealable bags.'
    },
    {
        'product_name': '2.0 mL Sterile Cryogenic Vial (Liquid Nitrogen, -196°C)',
        'external_id': '2-0-ml-sterile-cryogenic-vial-liquid-nitrogen',
        'catalog_number': 'CV-20LN',
        'category_external_id': 'category-1780539818236',
        'product_group': 'Cryogenic Storage',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': '2.0 mL Sterile cryogenic vials designed for liquid nitrogen vapor-phase storage down to -196°C.'
    },
    {
        'product_name': '2.0 mL Sterile Cryogenic Vial (-86℃ to 121℃)',
        'external_id': '2-0-ml-sterile-cryogenic-vial-standard',
        'catalog_number': 'CV-20ST',
        'category_external_id': 'category-1780539818236',
        'product_group': 'Cryogenic Storage',
        'list_price': 'Contact for Quote',
        'availability': 'In Stock',
        'description': '2.0 mL Sterile cryogenic vials for ultra-low temperature freezers (-86°C) up to autoclaving (121°C).'
    }
]

for item in new_reagents:
    p, created = Product.objects.get_or_create(
        external_id=item['external_id'],
        defaults={
            'product_name': item['product_name'],
            'catalog_number': item['catalog_number'],
            'category_external_id': item['category_external_id'],
            'product_group': item['product_group'],
            'list_price': item['list_price'],
            'availability': item['availability'],
            'description': item['description'],
            'source_type': 'reagent',
            'image_url': item.get('image_url') or '/placeholder.svg'
        }
    )
    if created:
        print(f"Created new reagent: '{item['product_name']}' under category '{item['category_external_id']}'")
    else:
        # Update existing parameters if it was already created but needs categorization
        p.category_external_id = item['category_external_id']
        p.product_group = item['product_group']
        p.source_type = 'reagent'
        if 'image_url' in item:
            p.image_url = item['image_url']
        p.save()
        print(f"Updated category/group/image of existing reagent '{item['product_name']}'")

print("Reagents population finished!")
