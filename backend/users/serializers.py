from rest_framework import serializers
from .models import *

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    shipping_address = AddressSerializer()
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'company', 'mobile', 'telephone', 'shipping_address']
        depth = 1

