from rest_framework import serializers
from .models import *

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    shipping_address = AddressSerializer()
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
            'is_admin',
            'isAdmin',
        ]
        depth = 1

    def get_externalId(self, obj):
        return getattr(obj, 'external_id', None)

