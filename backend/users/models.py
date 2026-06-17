from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and return a regular user with the given email and password.
        """
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and return a superuser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if not extra_fields.get('is_staff'):
            raise ValueError("Superuser must have is_staff=True.")
        if not extra_fields.get('is_superuser'):
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


# Create your models here.
class Address(models.Model):
    address_line_1 = models.CharField()
    address_line_2 = models.CharField(blank=True, null=True)
    apt_suite = models.CharField(blank=True, null=True)
    city = models.CharField()
    state = models.CharField()
    country = models.CharField(default='US', blank=True, null=True)
    zipcode = models.CharField()

    class Meta:
        db_table = 'addresses'
    
    def __str__(self):
        return f"{self.address_line_1}, {self.city}, {self.state} {self.zipcode}"


class User(AbstractUser):
    username = None
    email = models.EmailField(max_length=255, unique=True)
    title = models.CharField(blank=True, null=True)
    mobile = models.CharField(blank=True, null=True)
    telephone = models.CharField(blank=True, null=True)
    company = models.CharField(blank=True, null=True)
    job_title = models.CharField(blank=True, null=True)
    address = models.ForeignKey(Address, related_name='address', on_delete=models.PROTECT, null=True, blank=True)
    billing_address = models.ForeignKey(Address, related_name='billing_address', on_delete=models.PROTECT, null=True, blank=True)
    shipping_address = models.ForeignKey(Address, related_name='shipping_address', on_delete=models.PROTECT, null=True, blank=True)
    has_set_password = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    class Meta:
        db_table = 'users'
