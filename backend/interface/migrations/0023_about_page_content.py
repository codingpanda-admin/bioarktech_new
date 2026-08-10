from django.db import migrations, models


WHO_WE_ARE = {
    'slug': 'main',
    'page_title': 'Why BioArk',
    'page_subtitle': 'Innovating genome engineering for real-world impact',
    'section_title': 'Who We Are',
    'paragraphs': [
        (
            'BioArk Technologies, established in January 2025 in Rockville, Maryland, is an '
            'innovative biotechnology company dedicated to transforming groundbreaking '
            'scientific discoveries into practical solutions. Our mission is to advance genome '
            'engineering and accelerate its clinical and translational applications.'
        ),
        (
            'We provide a comprehensive suite of services, including molecular cloning, viral '
            'packaging, and stable cell line development, designed to accelerate progress in gene '
            'editing. By integrating advanced AI technologies, we deliver streamlined, customized '
            'solutions that enhance efficiency and improve overall customer experience.'
        ),
        (
            'Our proprietary CRISPR Trinity Platform addresses complex genetic editing challenges '
            'and offers unique advantages in the development of universal CAR-T therapies and '
            'related applications. These capabilities are available through specialized services, '
            'licensing opportunities, and strategic partnerships.'
        ),
        (
            'By bridging cutting-edge research with clinical application, BioArk Technologies is '
            'committed to transforming pioneering scientific discoveries into real-world '
            'healthcare solutions.'
        ),
    ],
}


HIGHLIGHTS = [
    {
        'icon': '▦',
        'title': 'Founded 2025 • Rockville, MD',
        'text': 'Established to advance genome engineering into real-world applications.',
        'display_order': 1,
    },
    {
        'icon': '⚗',
        'title': 'Comprehensive gene editing services',
        'text': 'Molecular cloning, viral packaging, stable cell line development.',
        'display_order': 2,
    },
    {
        'icon': '✣',
        'title': 'Proprietary CRISPR Trinity Platform',
        'text': 'Designed for complex editing and universal CAR-T strategies.',
        'display_order': 3,
    },
    {
        'icon': '⚙',
        'title': 'AI-enhanced, tailored solutions',
        'text': 'Streamlined workflows for efficiency and better experiences.',
        'display_order': 4,
    },
    {
        'icon': '♢',
        'title': 'Clinical & translational focus',
        'text': 'Bridging cutting-edge research with practical healthcare solutions.',
        'display_order': 5,
    },
]


TEAM_MEMBERS = [
    {
        'initials': 'LW',
        'name': 'Dr. Lipeng Wu',
        'role': 'Founder & CEO',
        'image_url': 'media/profile_pics/Headshot-1-Lipeng-300x300.jpg',
        'short_bio': (
            'Dr. Lipeng Wu is the Founder & CEO of BioArk Technologies, an innovative '
            'biotechnology company established in Rockville, Maryland in 2025, specializing in '
            'gene editing services and the proprietary CRISPR Trinity Platform.'
        ),
        'full_bio': [
            (
                'Dr. Lipeng Wu is the Founder & CEO of BioArk Technologies, an innovative '
                'biotechnology company established in Rockville, Maryland in 2025, specializing '
                'in gene editing services and the proprietary CRISPR-Trinity platform. With over '
                '21 years of research experience in molecular biology, cell biology, and cancer '
                'biology across both academic and industry settings, he brings deep expertise in '
                'genome engineering, viral vector systems, and CAR-T therapy development.'
            ),
            (
                'Dr. Wu’s career bridges both academic research and the biotechnology industry. '
                'He held research fellowships at the NIH and the University of Michigan, where he '
                'published multiple high-impact papers in Molecular Cell and Molecular and '
                'Cellular Biology on epigenetics and chromatin biology. He later served as Senior '
                'Scientist and Product Manager at Origene Technologies, where he led the '
                'development of advanced CRISPR technologies including base editing and prime '
                'editing, as well as viral vector production and stable cell line platforms.'
            ),
            (
                'Today, Dr. Wu leverages his expertise in CRISPR genome editing, molecular '
                'cloning, viral vector design, stable cell line engineering, and AI-driven '
                'biotechnology to lead BioArk Technologies. As a scientific innovator and '
                'business leader, he has directed research teams, product pipelines, and '
                'strategic partnerships to bridge fundamental discoveries with real-world '
                'healthcare solutions.'
            ),
        ],
        'display_order': 1,
    },
    {
        'initials': 'JX',
        'name': 'Dr. Jingwen Xu',
        'role': 'Co-Founder & Chief Operating Officer',
        'image_url': 'media/profile_pics/Jingwen-Xu-HeadShot.jpg',
        'short_bio': (
            'Dr. Jingwen Xu, M.D., M.Sc., Ph.D., is a physician-scientist, entrepreneur, and '
            'biotechnology executive with over three decades of experience in clinical medicine, '
            'molecular biology, and translational research.'
        ),
        'full_bio': [
            (
                'Dr. Jingwen Xu, M.D., M.Sc., Ph.D., is a physician-scientist, entrepreneur, and '
                'biotechnology executive with over three decades of experience in clinical '
                'medicine, molecular biology, and translational research. He is the Co-Founder '
                'and Chief Operating Officer of BioArk Technologies and also serves as Chief '
                'Executive Officer of EGFIE, a company specializing in the marketing and '
                'distribution of molecular laboratory consumables, kits, reagents, and equipment.'
            ),
            (
                'Dr. Xu completed his postdoctoral research at the University of Helsinki, '
                'focusing on biomedicine and orthopaedics. He then served as a Senior Research '
                'Scientist at the Albert Einstein College of Medicine, where he conducted studies '
                'in rheumatology, oncology, and molecular signaling pathways. He later joined '
                'Georgetown University as an Instructor and Assistant Professor, advancing '
                'research in molecular biology and immunology.'
            ),
            (
                'In addition to his academic appointments, Dr. Xu has held leadership roles in '
                'both research and industry. As CEO of Himalayan Biotech and later EGFIE, he has '
                'successfully bridged scientific innovation with business development. At BioArk '
                'Technologies, he plays a pivotal role in advancing next-generation CRISPR-based '
                'platforms and CAR-T therapeutic strategies, integrating laboratory management '
                'expertise with commercial strategy.'
            ),
            (
                'Today, Dr. Xu combines deep scientific expertise with entrepreneurial leadership '
                'to drive innovation at the intersection of biotechnology, clinical application, '
                'and commercial development.'
            ),
        ],
        'display_order': 2,
    },
    {
        'initials': 'MS',
        'name': 'Dr. Mei Sun',
        'role': 'Advisor (Neurosensory R&D, Government Funding & Commercialization)',
        'image_url': 'media/profile_pics/Mei-Sun.jpeg',
        'short_bio': (
            'Dr. Mei Sun is an accomplished professional in neurosensory research and '
            'development, with extensive leadership experience in government biomedical '
            'research and technology commercialization.'
        ),
        'full_bio': [
            (
                'Dr. Mei Sun is an accomplished professional in the field of neurosensory '
                'research and development, with extensive leadership experience in government '
                'biomedical research and technology commercialization.'
            ),
            (
                'Most recently, in 2025 Dr. Sun founded Heyma Consulting LLC, a firm dedicated to '
                'helping startups and established companies pursue government funding '
                'opportunities, including DoD, NIH, NSF, and state-level programs. Through this '
                'venture, she provides strategic guidance on securing SBIR, OTA, and BAA funding, '
                'as well as commercialization strategy and proposal development.'
            ),
            (
                'In 2024, Dr. Sun served as Program Manager at the Defense Health Agency (DHA), '
                'where she oversaw the Sensory Program, a Department of Defense research portfolio '
                'advancing innovations in sensory injury prevention, diagnostics, and treatment. '
                'Prior to this role, Dr. Sun was the Neurosensory Portfolio Manager at the US Army '
                'Medical Research and Development Command (USMRDC), where she managed Science & '
                'Technology funding for a broad range of neurosensory research projects. She also '
                'held the role of Program Manager for the Congressionally Directed Medical '
                'Research Program’s (CDMRP) Other Transaction Authority (OTA) program, where she '
                'facilitated the entire funding cycle—from solicitation announcements through '
                'post-award management—enhancing collaboration between agencies and advancing '
                'critical research.'
            ),
            (
                'Dr. Sun’s expertise extends beyond neurosensory research. From 2017 to 2019, she '
                'served as Portfolio Manager for the Medical Simulation and Information Sciences '
                'Research Program (MSISRP), managing an annual budget of over twenty million '
                'dollars in science and technology funding, and leading collaborations across DoD '
                'commands, government agencies, academia, and industry. From 2014 to 2017, Dr. '
                'Sun was Senior Scientist and Principal Investigator at the US Army Medical '
                'Research Institute of Infectious Diseases (USAMRIID). Earlier in her career, she '
                'was a research scientist at the Janelia Research Campus, HHMI (2010–2014), and '
                'completed her post-doctoral training at Genentech, Inc. (2008–2010). Dr. Sun '
                'earned her PhD in Biology and MBA in Management from UCSD in 2007 and trained '
                'with renowned scientists including Nobel laureates Dr. Roger Tsien and Dr. Eric '
                'Betzig, contributing to 20+ publications in Science, Nature Cell Biology, Nature '
                'Methods, and Nature Microbiology. Beyond her professional career, Dr. Sun serves '
                'on the Board of Directors of FITCI, a leading biotech incubator in Frederick, '
                'Maryland.'
            ),
        ],
        'display_order': 3,
    },
    {
        'initials': 'DY',
        'name': 'Dezhong Yin, Ph.D.',
        'role': 'Director of R&D and Product Development',
        'image_url': 'media/profile_pics/Dezhong-Yin.jpg',
        'short_bio': (
            'A biotechnology leader with more than 20 years of experience spanning cell and '
            'molecular biology, stem cells, viral vectors, and product innovation. At BioArk, '
            'Dr. Yin leads R&D and the development of innovative products and technologies.'
        ),
        'full_bio': [
            (
                'Dezhong Yin, Ph.D., is a biotechnology leader with more than 20 years of '
                'experience in cell biology, molecular biology, stem cell biology, viral vector '
                'development, and biotechnology product innovation. At BioArk Technologies, he '
                'leads research and development initiatives and drives the development of '
                'innovative products and technologies.'
            ),
            (
                'Prior to joining BioArk, Dr. Yin served as Director and Department Head of '
                'Molecular Biology at OriGene Technologies, where he led multiple R&D teams '
                'responsible for the development and commercialization of stable cell lines, AAV '
                'and lentiviral products, DNA clones, CAR-T target and effector cells, and '
                'CRISPR-based technologies.'
            ),
            (
                'Before OriGene, Dr. Yin spent 12 years at ATCC as Lead Scientist and Manager of '
                'Stem Cell and Primary Cell R&D. There, he directed multidisciplinary teams in '
                'developing and commercializing human induced pluripotent stem cells (iPSCs), '
                'primary cells, cancer organoids, and exosome products.'
            ),
            (
                'Earlier in his career, Dr. Yin worked at Vericel Corporation, focusing on in '
                'vivo bone marrow mesenchymal stem cell (MSC) tracking and the production of '
                'cGMP-compliant MSCs for clinical applications. He also completed a postdoctoral '
                'fellowship at GSK, where his research focused on microbiology and antibiotic '
                'discovery.'
            ),
            (
                'Dr. Yin earned his Ph.D. from The Pennsylvania State University and has authored '
                '27 peer-reviewed scientific publications.'
            ),
        ],
        'display_order': 4,
    },
]


def seed_about_page_content(apps, schema_editor):
    AboutWhoWeAre = apps.get_model('interface', 'AboutWhoWeAre')
    AboutHighlight = apps.get_model('interface', 'AboutHighlight')
    AboutTeamMember = apps.get_model('interface', 'AboutTeamMember')

    AboutWhoWeAre.objects.update_or_create(
        slug=WHO_WE_ARE['slug'],
        defaults={
            'page_title': WHO_WE_ARE['page_title'],
            'page_subtitle': WHO_WE_ARE['page_subtitle'],
            'section_title': WHO_WE_ARE['section_title'],
            'paragraphs': WHO_WE_ARE['paragraphs'],
            'is_active': True,
        },
    )

    for highlight in HIGHLIGHTS:
        AboutHighlight.objects.update_or_create(
            title=highlight['title'],
            defaults={
                'icon': highlight['icon'],
                'text': highlight['text'],
                'display_order': highlight['display_order'],
                'is_active': True,
            },
        )

    for member in TEAM_MEMBERS:
        AboutTeamMember.objects.update_or_create(
            name=member['name'],
            defaults={
                'initials': member['initials'],
                'role': member['role'],
                'image_url': member['image_url'],
                'short_bio': member['short_bio'],
                'full_bio': member['full_bio'],
                'display_order': member['display_order'],
                'is_active': True,
            },
        )


def remove_seeded_about_page_content(apps, schema_editor):
    AboutWhoWeAre = apps.get_model('interface', 'AboutWhoWeAre')
    AboutHighlight = apps.get_model('interface', 'AboutHighlight')
    AboutTeamMember = apps.get_model('interface', 'AboutTeamMember')

    AboutTeamMember.objects.filter(
        name__in=[member['name'] for member in TEAM_MEMBERS]
    ).delete()
    AboutHighlight.objects.filter(
        title__in=[highlight['title'] for highlight in HIGHLIGHTS]
    ).delete()
    AboutWhoWeAre.objects.filter(slug=WHO_WE_ARE['slug']).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('interface', '0022_servicemode_price'),
    ]

    operations = [
        migrations.CreateModel(
            name='AboutWhoWeAre',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('slug', models.SlugField(default='main', max_length=50, unique=True)),
                ('page_title', models.CharField(default='Why BioArk', max_length=255)),
                ('page_subtitle', models.CharField(blank=True, default='', max_length=255)),
                ('section_title', models.CharField(default='Who We Are', max_length=255)),
                ('paragraphs', models.JSONField(blank=True, default=list)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'about_who_we_are',
                'verbose_name_plural': 'About: Who We Are',
            },
        ),
        migrations.CreateModel(
            name='AboutHighlight',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('icon', models.CharField(blank=True, default='', max_length=50)),
                ('title', models.CharField(max_length=255)),
                ('text', models.TextField()),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'about_highlight',
                'ordering': ['display_order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='AboutTeamMember',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('initials', models.CharField(blank=True, default='', max_length=10)),
                ('name', models.CharField(max_length=255)),
                ('role', models.CharField(max_length=255)),
                ('image_url', models.TextField(blank=True, default='')),
                ('short_bio', models.TextField(blank=True, default='')),
                ('full_bio', models.JSONField(blank=True, default=list)),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'about_team_member',
                'ordering': ['display_order', 'id'],
            },
        ),
        migrations.AddIndex(
            model_name='abouthighlight',
            index=models.Index(
                fields=['is_active', 'display_order'],
                name='about_highlight_active_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='aboutteammember',
            index=models.Index(
                fields=['is_active', 'display_order'],
                name='about_team_active_idx',
            ),
        ),
        migrations.RunPython(
            seed_about_page_content,
            remove_seeded_about_page_content,
        ),
    ]
