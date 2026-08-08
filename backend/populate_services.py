import os
import sys
import django
import json

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

CATEGORY_MAPPING = {
    'genome-editing-service': {
        'id': 'genome-editing-services',
        'name': 'Genome Editing Services'
    },
    'synthesis-cloning': {
        'id': 'synthesis-cloning-services',
        'name': 'Custom Cloning Services'
    },
    'virus-packaging': {
        'id': 'virus-packaging-services',
        'name': 'Lentivirus Package Services'
    },
    'cell-line-services': {
        'id': 'cell-line-services',
        'name': 'Stable Cell Line Services'
    },
    'category-1764976659245': {
        'id': 'protein-purification-services',
        'name': 'Protein Purification Services'
    }
}

def markdown_to_html(md):
    if not md:
        return ""
    import re
    html = md
    
    # Escaping / Normalize newlines
    html = html.replace('\r\n', '\n').replace('\r', '\n')
    
    # Convert headers: e.g. ## Header -> <h2>Header</h2>
    html = re.sub(r'^###### (.*?)$', r'<h6>\1</h6>', html, flags=re.MULTILINE)
    html = re.sub(r'^##### (.*?)$', r'<h5>\1</h5>', html, flags=re.MULTILINE)
    html = re.sub(r'^#### (.*?)$', r'<h4>\1</h4>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    
    # Convert tables
    lines = html.split('\n')
    in_table = False
    table_html = []
    new_lines = []
    for line in lines:
        if line.strip().startswith('|'):
            if not in_table:
                in_table = True
                table_html.append('<table class="table table-bordered">')
                cols = [c.strip() for c in line.split('|')[1:-1]]
                table_html.append('<thead><tr>' + ''.join(f'<th>{c}</th>' for c in cols) + '</tr></thead>')
                table_html.append('<tbody>')
            else:
                if '---' in line:
                    continue
                cols = [c.strip() for c in line.split('|')[1:-1]]
                table_html.append('<tr>' + ''.join(f'<td>{c}</td>' for c in cols) + '</tr>')
        else:
            if in_table:
                in_table = False
                table_html.append('</tbody></table>')
                new_lines.append('\n'.join(table_html))
                table_html = []
            new_lines.append(line)
    if in_table:
        table_html.append('</tbody></table>')
        new_lines.append('\n'.join(table_html))
    html = '\n'.join(new_lines)
    
    # Bold / Italics
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'__(.*?)__', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
    
    # Unordered list helper
    lines = html.split('\n')
    in_list = False
    list_html = []
    new_lines2 = []
    for line in lines:
        striped = line.strip()
        if striped.startswith('- ') or striped.startswith('* '):
            item = striped[2:]
            if not in_list:
                in_list = True
                list_html.append('<ul>')
            list_html.append(f'<li>{item}</li>')
        else:
            if in_list:
                in_list = False
                list_html.append('</ul>')
                new_lines2.append('\n'.join(list_html))
                list_html = []
            new_lines2.append(line)
    if in_list:
        list_html.append('</ul>')
        new_lines2.append('\n'.join(list_html))
    html = '\n'.join(new_lines2)
    
    # Links
    html = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', html)
    
    # Paragraphs wrapping
    lines = html.split('\n')
    new_lines3 = []
    for line in lines:
        striped = line.strip()
        if not striped:
            continue
        if striped.startswith('<') and (striped.endswith('>') or striped.endswith('</p>')):
            new_lines3.append(striped)
        else:
            new_lines3.append(f'<p>{striped}</p>')
    html = '\n'.join(new_lines3)
    
    return html

def main():
    # Guardrail: this DELETES ALL services before reloading from the static
    # services.json. It used to run on every container restart via
    # docker-compose's startup command and silently destroyed
    # manually-curated data (see incident 2026-08-06). It's no longer wired
    # into any automatic path - if you're running this by hand, you need to
    # mean it.
    if os.environ.get('CONFIRM_DESTRUCTIVE_RESET') != 'yes':
        print(
            "REFUSING TO RUN: this script deletes ALL services, then "
            "reloads only what's in services.json - any service added or "
            "edited outside that file is gone permanently.\n"
            "If you really mean to do this, re-run with "
            "CONFIRM_DESTRUCTIVE_RESET=yes."
        )
        sys.exit(1)

    print("Resetting database to services.json content...")
    from interface.models import ServiceMode
    from products.models import ProductCategory

    # 1. Clear existing ServiceMode
    ServiceMode.objects.all().delete()
    
    # 2. Locate services.json
    possible_paths = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'services.json'),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '../services.json'),
        '/app/services.json',
        'services.json',
    ]
    
    json_path = None
    for path in possible_paths:
        if os.path.exists(path):
            json_path = path
            break
            
    if not json_path:
        print("Error: Could not locate services.json")
        sys.exit(1)
        
    print(f"Loading data from: {json_path}")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    categories_data = data.get("categoriesConfig", {}).get("categories", [])
    overrides = data.get("overrides", {})
    custom = data.get("custom", [])
    groups_config = data.get("groupsConfig", {})
    
    # 3. Create or update categories for services
    for cat in categories_data:
        cat_id = cat['id']
        cat_name = cat['name']
        cat_order = cat.get('order', 1)
        
        # Apply mapping
        if cat_id in CATEGORY_MAPPING:
            m = CATEGORY_MAPPING[cat_id]
            cat_id = m['id']
            cat_name = m['name']
            
        ProductCategory.objects.update_or_create(
            external_id=cat_id,
            defaults={
                'category_name': cat_name,
                'priority': cat_order,
                'product_type': 'service'
            }
        )
        print(f"Service Category: {cat_name} ({cat_id})")
        
    # 4. Parse and Load Services
    services_to_insert = []
    
    # - Process Overrides
    for key, val in overrides.items():
        if val.get('hidden') is True and not val.get('name'):
            # This is a hidden override without content, skip
            continue
            
        link = val.get('link')
        if not link:
            continue
            
        url_slug = link.replace('/services/', '')
        content_html = markdown_to_html(val.get('markdown', ''))
        
        img_url = val.get('imageUrl', '')
        django_image_name = ''
        if img_url:
            filename = os.path.basename(img_url)
            django_image_name = f"service_images/{filename}"
            
        is_featured = val.get('showInHomepageServices', False)
        show_on_screen = not val.get('hidden', False)
        
        cat_id = val.get('category')
        if cat_id in CATEGORY_MAPPING:
            cat_id = CATEGORY_MAPPING[cat_id]['id']
            
        services_to_insert.append({
            'url': url_slug,
            'title': val.get('name', ''),
            'content': content_html,
            'image': django_image_name,
            'category': cat_id,
            'service_group': groups_config.get(key, val.get('groupName')),
            'is_featured': is_featured,
            'show_on_screen': show_on_screen
        })
        
    # - Process Custom List
    for c in custom:
        link = c.get('link')
        if not link:
            continue
            
        url_slug = link.replace('/services/', '')
        content_html = markdown_to_html(c.get('markdown', ''))
        
        img_url = c.get('imageUrl', '')
        django_image_name = ''
        if img_url:
            filename = os.path.basename(img_url)
            django_image_name = f"service_images/{filename}"
            
        is_featured = c.get('showInHomepageServices', False)
        show_on_screen = not c.get('hidden', False)
        
        cat_id = c.get('category')
        if cat_id in CATEGORY_MAPPING:
            cat_id = CATEGORY_MAPPING[cat_id]['id']
            
        services_to_insert.append({
            'url': url_slug,
            'title': c.get('name', ''),
            'content': content_html,
            'image': django_image_name,
            'category': cat_id,
            'service_group': groups_config.get(c.get('id'), c.get('groupName')),
            'is_featured': is_featured,
            'show_on_screen': show_on_screen
        })
        
    # 5. Insert into Database
    for s_data in services_to_insert:
        s_obj = ServiceMode.objects.create(
            url=s_data['url'],
            title=s_data['title'],
            content=s_data['content'],
            image=s_data['image'] if s_data['image'] else None,
            category=s_data['category'],
            service_group=s_data['service_group'],
            is_featured=s_data['is_featured'],
            show_on_screen=s_data['show_on_screen']
        )
        print(f"Service: {s_obj.title} (url={s_obj.url}, show={s_obj.show_on_screen})")
        
    print(f"Successfully populated {len(services_to_insert)} services.")

if __name__ == '__main__':
    main()
