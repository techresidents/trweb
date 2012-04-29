from django.db import models
from django.contrib.auth.models import User

from techresidents_web.common.models import Location
from techresidents_web.common.models import Organization
from techresidents_web.common.models import Technology


class PositionType(models.Model):
    """Represents a position type such as developer, manager, or architect"""
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=1024)

class Requisition(models.Model):
    """Represents a job requisition"""
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=1024)
    type = models.ForeignKey(PositionType)
    locations = models.ManyToManyField(Location)
    technologies = models.ManyToManyField(Technology)
    salary_start = models.IntegerField()
    salary_end   = models.IntegerField()
    date_posted = models.DateField()
    is_active = models.BooleanField(default=True)

class Prefs(models.Model):
    """Represents a user's job preferences which pertain to all jobs they are seeking"""
    user = models.ForeignKey(User)
    email_new_job_opps = models.BooleanField(default=False)

class LocationPref(models.Model):
    """Represents one of a user's potentially many location preferences """
    user = models.ForeignKey(User)
    location = models.ForeignKey(Location)

class OrganizationPref(models.Model):
    """Represents one of a user's potentially many organization preferences """
    user = models.ForeignKey(User)
    organization = models.ForeignKey(Organization)

class PositionTypePref(models.Model):
    """Represents one of a user's potentially many position type preferences """
    user = models.ForeignKey(User)
    position_type = models.ForeignKey(PositionType)
    salary_start = models.IntegerField(null=True)
    salary_end   = models.IntegerField(null=True)

class TechnologyPref(models.Model):
    """Represents one of a user's potentially many technology preferences """
    user = models.ForeignKey(User)
    technology = models.ForeignKey(Technology)