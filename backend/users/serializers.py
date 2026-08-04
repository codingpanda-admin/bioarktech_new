from rest_framework import serializers
from .models import *

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'

class CustomerShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerShippingAddress
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    shipping_address = AddressSerializer()
    shipping_addresses = CustomerShippingAddressSerializer(many=True, read_only=True)
    isAdmin = serializers.BooleanField(source='is_admin', read_only=True)
    externalId = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'externalId',
            'first_name',
            'last_name',
            'email',
            'title',
            'company',
            'job_title',
            'mobile',
            'telephone',
            'shipping_address',
            'shipping_addresses',
            'is_admin',
            'isAdmin',
            'profile_picture',
        ]
        depth = 1

    def get_externalId(self, obj):
        return getattr(obj, 'external_id', None)


