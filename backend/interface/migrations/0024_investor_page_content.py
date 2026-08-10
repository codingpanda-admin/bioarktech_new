from django.db import migrations, models


COMPANY_OVERVIEW = {
    'slug': 'main',
    'page_title': 'Our Investors',
    'page_subtitle': (
        'Partnering with visionary supporters to transform gene editing technologies and '
        'advance genetic medicine.'
    ),
    'section_title': 'Company Overview & Vision',
    'paragraphs': [
        (
            'BioArk Technologies is an innovative biotechnology company committed to '
            'translating scientific breakthroughs into real-world healthcare solutions. We '
            'are evolving from a foundational service provider into an integrated medical '
            'solutions company.'
        ),
        (
            'We leverage artificial intelligence (AI) to accelerate service delivery, advance '
            'our proprietary platform, and drive the creation of next-generation therapies.'
        ),
    ],
    'image_url': '',
    'image_alt': 'BioArk company growth and market outlook',
}


STRATEGY_TIERS = [
    {
        'icon': '\u25a3',
        'title': 'Tier I: Solid Foundation',
        'subtitle': 'Services & Products',
        'items': [
            'AI-assisted molecular cloning and construct design',
            'High-quality viral packaging, including lentivirus workflows',
            'Stable cell line development and validation',
            'Related gene editing kits and reagents',
        ],
        'note': (
            'This tier provides a stable revenue base and demonstrates strong technical '
            'execution.'
        ),
        'display_order': 1,
    },
    {
        'icon': '\u25a4',
        'title': 'Tier II: Core Innovation',
        'subtitle': 'CRISPR Trinity Platform (patent-pending)',
        'items': [
            'A unified platform designed to integrate diverse CRISPR functions',
            'Supports complex gene-editing requirements in challenging contexts',
            'Business model: services, licensing, and strategic partnerships',
        ],
        'note': '',
        'display_order': 2,
    },
    {
        'icon': '\u2301',
        'title': 'Tier III: The Future',
        'subtitle': 'Universal Bi-CAR-T Therapy',
        'items': [
            'Engineer universal Bi-CAR-T cells with dual receptors',
            'Addresses high cost and single-target limitations of current CAR-T',
            'Reduces reliance on patient-derived cells with universal templates',
            'Primary applications: cancer and immune-related diseases',
        ],
        'note': '',
        'display_order': 3,
    },
]


ROADMAP_MILESTONES = [
    {
        'phase': 'Phase 1',
        'goal': (
            'CRISPR Trinity product development - a unified platform for complex gene-editing.'
        ),
        'period_and_funding': '1 Year, $300k',
        'display_order': 1,
    },
    {
        'phase': 'Phase 2',
        'goal': (
            'Universal Bi-CAR-T research service - engineer universal CAR-T template cells '
            'using the platform.'
        ),
        'period_and_funding': '2 Years, $1M',
        'display_order': 2,
    },
    {
        'phase': 'Phase 3',
        'goal': (
            'Therapeutic CAR-T service - translate research into therapeutic applications.'
        ),
        'period_and_funding': '3 Years, $3M',
        'display_order': 3,
    },
]


PARTNER_SECTION = {
    'slug': 'main',
    'section_title': 'Partner with BioArk',
    'text': (
        'We are seeking visionary partners to shape the future of genetic medicine. If you are '
        'interested in our business and share our commitment to innovation, we invite you to '
        'connect with us.'
    ),
    'button_text': 'Contact Investor Relations',
    'button_url': '/request-quote',
    'button_target': '_self',
    'button_style': 'primary',
    'contact_email': 'investor@bioarktech.com',
}


def seed_investor_page_content(apps, schema_editor):
    InvestorCompanyOverview = apps.get_model('interface', 'InvestorCompanyOverview')
    InvestorStrategyTier = apps.get_model('interface', 'InvestorStrategyTier')
    InvestorRoadmapMilestone = apps.get_model('interface', 'InvestorRoadmapMilestone')
    InvestorPartnerSection = apps.get_model('interface', 'InvestorPartnerSection')

    InvestorCompanyOverview.objects.update_or_create(
        slug=COMPANY_OVERVIEW['slug'],
        defaults={
            'page_title': COMPANY_OVERVIEW['page_title'],
            'page_subtitle': COMPANY_OVERVIEW['page_subtitle'],
            'section_title': COMPANY_OVERVIEW['section_title'],
            'paragraphs': COMPANY_OVERVIEW['paragraphs'],
            'image_url': COMPANY_OVERVIEW['image_url'],
            'image_alt': COMPANY_OVERVIEW['image_alt'],
            'is_active': True,
        },
    )

    for tier in STRATEGY_TIERS:
        InvestorStrategyTier.objects.update_or_create(
            title=tier['title'],
            defaults={
                'icon': tier['icon'],
                'subtitle': tier['subtitle'],
                'items': tier['items'],
                'note': tier['note'],
                'display_order': tier['display_order'],
                'is_active': True,
            },
        )

    for milestone in ROADMAP_MILESTONES:
        InvestorRoadmapMilestone.objects.update_or_create(
            phase=milestone['phase'],
            defaults={
                'goal': milestone['goal'],
                'period_and_funding': milestone['period_and_funding'],
                'display_order': milestone['display_order'],
                'is_active': True,
            },
        )

    InvestorPartnerSection.objects.update_or_create(
        slug=PARTNER_SECTION['slug'],
        defaults={
            'section_title': PARTNER_SECTION['section_title'],
            'text': PARTNER_SECTION['text'],
            'button_text': PARTNER_SECTION['button_text'],
            'button_url': PARTNER_SECTION['button_url'],
            'button_target': PARTNER_SECTION['button_target'],
            'button_style': PARTNER_SECTION['button_style'],
            'contact_email': PARTNER_SECTION['contact_email'],
            'is_active': True,
        },
    )


def remove_seeded_investor_page_content(apps, schema_editor):
    InvestorCompanyOverview = apps.get_model('interface', 'InvestorCompanyOverview')
    InvestorStrategyTier = apps.get_model('interface', 'InvestorStrategyTier')
    InvestorRoadmapMilestone = apps.get_model('interface', 'InvestorRoadmapMilestone')
    InvestorPartnerSection = apps.get_model('interface', 'InvestorPartnerSection')

    InvestorPartnerSection.objects.filter(slug=PARTNER_SECTION['slug']).delete()
    InvestorRoadmapMilestone.objects.filter(
        phase__in=[milestone['phase'] for milestone in ROADMAP_MILESTONES]
    ).delete()
    InvestorStrategyTier.objects.filter(
        title__in=[tier['title'] for tier in STRATEGY_TIERS]
    ).delete()
    InvestorCompanyOverview.objects.filter(slug=COMPANY_OVERVIEW['slug']).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('interface', '0023_about_page_content'),
    ]

    operations = [
        migrations.CreateModel(
            name='InvestorCompanyOverview',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('slug', models.SlugField(default='main', max_length=50, unique=True)),
                ('page_title', models.CharField(default='Our Investors', max_length=255)),
                ('page_subtitle', models.TextField(blank=True, default='')),
                (
                    'section_title',
                    models.CharField(default='Company Overview & Vision', max_length=255),
                ),
                ('paragraphs', models.JSONField(blank=True, default=list)),
                ('image_url', models.TextField(blank=True, default='')),
                ('image_alt', models.CharField(blank=True, default='', max_length=255)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'investor_company_overview',
                'verbose_name_plural': 'Investors: Company Overview & Vision',
            },
        ),
        migrations.CreateModel(
            name='InvestorStrategyTier',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('icon', models.CharField(blank=True, default='', max_length=50)),
                ('title', models.CharField(max_length=255)),
                ('subtitle', models.CharField(blank=True, default='', max_length=255)),
                ('items', models.JSONField(blank=True, default=list)),
                ('note', models.TextField(blank=True, default='')),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'investor_strategy_tier',
                'ordering': ['display_order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='InvestorRoadmapMilestone',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('phase', models.CharField(max_length=100)),
                ('goal', models.TextField()),
                (
                    'period_and_funding',
                    models.CharField(blank=True, default='', max_length=255),
                ),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'investor_roadmap_milestone',
                'ordering': ['display_order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='InvestorPartnerSection',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('slug', models.SlugField(default='main', max_length=50, unique=True)),
                (
                    'section_title',
                    models.CharField(default='Partner with BioArk', max_length=255),
                ),
                ('text', models.TextField(blank=True, default='')),
                ('button_text', models.CharField(blank=True, default='', max_length=100)),
                ('button_url', models.CharField(blank=True, default='', max_length=500)),
                (
                    'button_target',
                    models.CharField(
                        choices=[('_self', 'Same tab'), ('_blank', 'New tab')],
                        default='_self',
                        max_length=20,
                    ),
                ),
                (
                    'button_style',
                    models.CharField(blank=True, default='primary', max_length=50),
                ),
                ('contact_email', models.EmailField(blank=True, default='', max_length=254)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'investor_partner_section',
                'verbose_name_plural': 'Investors: Partner with BioArk',
            },
        ),
        migrations.AddIndex(
            model_name='investorstrategytier',
            index=models.Index(
                fields=['is_active', 'display_order'],
                name='invest_strategy_active_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='investorroadmapmilestone',
            index=models.Index(
                fields=['is_active', 'display_order'],
                name='invest_roadmap_active_idx',
            ),
        ),
        migrations.RunPython(
            seed_investor_page_content,
            remove_seeded_investor_page_content,
        ),
    ]
