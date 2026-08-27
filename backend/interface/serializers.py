from .models import *
from rest_framework import serializers

class ProductModeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductMode
        fields = '__all__'

class ServiceModeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceMode
        fields = '__all__'

class HomepageSlideSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomepageSlide
        fields = '__all__'


class AboutWhoWeAreSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutWhoWeAre
        fields = '__all__'


class AboutHighlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutHighlight
        fields = '__all__'


class AboutTeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutTeamMember
        fields = '__all__'


class InvestorCompanyOverviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestorCompanyOverview
        fields = '__all__'


class InvestorStrategyTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestorStrategyTier
        fields = '__all__'


class InvestorRoadmapMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestorRoadmapMilestone
        fields = '__all__'


class InvestorPartnerSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestorPartnerSection
        fields = '__all__'
