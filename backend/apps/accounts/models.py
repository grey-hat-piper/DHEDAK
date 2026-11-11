from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone


class AccountType(models.TextChoices):
    INDIVIDUAL = "individual", "Individual"
    FACILITY = "facility", "Healthcare facility"
    NGO = "ngo", "NGO or foundation"
    GOVERNMENT = "government", "Government institution"
    RESEARCH = "research", "Research organisation"
    SUPPLIER = "supplier", "Medical supplier"
    EMPLOYER = "employer", "Employer"
    INTERNAL = "internal", "DHEDAK internal staff"  # never selectable at public registration


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email is required.")
        user = self.model(email=self.normalize_email(email).lower(), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra):
        extra.update(is_staff=True, is_superuser=True, account_type=AccountType.INTERNAL)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    country_code = models.CharField(max_length=2, blank=True)  # ISO 3166-1 alpha-2, validated against settings
    account_type = models.CharField(max_length=20, choices=AccountType.choices, default=AccountType.INDIVIDUAL)
    primary_reason = models.CharField(max_length=300, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]
    objects = UserManager()

    def __str__(self):
        return self.email
