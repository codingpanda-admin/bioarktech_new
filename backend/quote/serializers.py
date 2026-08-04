from rest_framework import serializers

from .models import Quote


class QuoteSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source='user_id', read_only=True)
    externalId = serializers.CharField(source='external_id', read_only=True)
    firstName = serializers.CharField(source='first_name', read_only=True)
    lastName = serializers.CharField(source='last_name', read_only=True)
    serviceType = serializers.CharField(source='service_type', read_only=True)
    projectDescription = serializers.CharField(source='project_description', read_only=True)
    additionalInfo = serializers.CharField(source='additional_info', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Quote
        fields = [
            'id',
            'userId',
            'external_id',
            'externalId',
            'first_name',
            'firstName',
            'last_name',
            'lastName',
            'email',
            'phone',
            'company',
            'department',
            'service_type',
            'serviceType',
            'timeline',
            'budget',
            'project_description',
            'projectDescription',
            'additional_info',
            'additionalInfo',
            'created_at',
            'createdAt',
            'read',
        ]
