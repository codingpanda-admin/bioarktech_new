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