from django.db import models
from django.db.models.signals import post_save

from techresidents_web.accounts.models import Tenant

class CompanySize(models.Model):
    """Company size model"""
    class Meta:
        db_table = "company_size"

    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)

class CompanyProfile(models.Model):
    """Company profile model."""
    class Meta:
        db_table = "company_profile"

    tenant = models.OneToOneField(Tenant)
    size = models.ForeignKey(CompanySize, default=1, related_name="+")
    name = models.CharField(max_length=100, null=True)
    description = models.CharField(max_length=4096, null=True)
    location = models.CharField(max_length=255, null=True)
    url = models.CharField(max_length=255, null=True)

def create_company_profile(sender, instance, created, **kwargs):
    if created:
        CompanyProfile.objects.create(tenant=instance, name=instance.name)

# debugging note: if this function is being invoked twice (or more than once)
# the culprit is most likely due to the module being imported multiple times.
# This can be fixed by using consistent import paths.
post_save.connect(create_company_profile, sender=Tenant)
