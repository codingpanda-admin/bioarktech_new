from django.db import models

from users.models import User
from django.utils.crypto import get_random_string
from django.utils.timezone import now
from datetime import timedelta

# Create your models here.

class EmailVerificationToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return now() < self.created_at + timedelta(hours=24)  # Valid for 24 hours

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = get_random_string(64)
        super().save(*args, **kwargs)


class Quote(models.Model):
    id = models.BigAutoField(primary_key=True)
    external_id = models.CharField(max_length=64, blank=True, null=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True, null=True)
    company = models.CharField(max_length=255, blank=True, null=True)
    department = models.CharField(max_length=255, blank=True, null=True)
    service_type = models.CharField(max_length=100, blank=True, null=True)
    timeline = models.CharField(max_length=255, blank=True, null=True)
    budget = models.CharField(max_length=255, blank=True, null=True)
    project_description = models.TextField(blank=True, null=True)
    additional_info = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    class Meta:
        db_table = 'quote'
        managed = False

    def __str__(self):
        return f"{self.first_name} {self.last_name} <{self.email}>"
