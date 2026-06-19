from rest_framework import serializers
from .models import *

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    shipping_address = AddressSerializer()
    isAdmin = serializers.BooleanField(source='is_admin', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'company', 'mobile', 'telephone', 'shipping_address', 'is_admin', 'isAdmin']
        depth = 1

