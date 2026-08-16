from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from rest_framework.decorators import api_view

from .models import *
from .serializers import *

# Create your views here.
@api_view(['GET'])
def get_product_page(request, url):
    page = ProductMode.objects.get(url=url)
    serializer = ProductModeSerializer(page)

    return JsonResponse(serializer.data)

@api_view(['GET'])
def get_service_page(request, url):
    page = get_object_or_404(ServiceMode, url=url, hidden=False)
    serializer = ServiceModeSerializer(page)

    return JsonResponse(serializer.data)

@api_view(['GET'])
def get_homepage_slides(request):
    slides = HomepageSlide.objects.filter(is_active=True).order_by('display_order', 'id')
    serializer = HomepageSlideSerializer(slides, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(['GET'])
def get_featured_services(request):
    services = ServiceMode.objects.filter(presented_service=True, hidden=False).order_by('title')
    serializer = ServiceModeSerializer(services, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(['GET'])
def get_homepage_services(request):
    services = ServiceMode.objects.filter(show_on_screen=True, hidden=False).order_by('title')
    serializer = ServiceModeSerializer(services, many=True)
    return JsonResponse(serializer.data, safe=False)


@api_view(['GET'])
def get_about_page_content(request):
    overview = AboutWhoWeAre.objects.filter(is_active=True).order_by('id').first()
    highlights = AboutHighlight.objects.filter(is_active=True).order_by('display_order', 'id')
    team_members = AboutTeamMember.objects.filter(is_active=True).order_by('display_order', 'id')

    return JsonResponse({
        'overview': AboutWhoWeAreSerializer(overview).data if overview else None,
        'highlights': AboutHighlightSerializer(highlights, many=True).data,
        'team_members': AboutTeamMemberSerializer(team_members, many=True).data,
    })


@api_view(['GET'])
def get_investor_page_content(request):
    overview = InvestorCompanyOverview.objects.filter(is_active=True).order_by('id').first()
    strategy_tiers = InvestorStrategyTier.objects.filter(is_active=True).order_by(
        'display_order',
        'id',
    )
    milestones = InvestorRoadmapMilestone.objects.filter(is_active=True).order_by(
        'display_order',
        'id',
    )
    partner = InvestorPartnerSection.objects.filter(is_active=True).order_by('id').first()

    return JsonResponse({
        'overview': InvestorCompanyOverviewSerializer(overview).data if overview else None,
        'strategy_tiers': InvestorStrategyTierSerializer(strategy_tiers, many=True).data,
        'milestones': InvestorRoadmapMilestoneSerializer(milestones, many=True).data,
        'partner': InvestorPartnerSectionSerializer(partner).data if partner else None,
    })
