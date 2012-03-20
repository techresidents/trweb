from django.db import models
from django.contrib.auth.models import User
from common.models import Technology


class UserProfile(models.Model):
    """ Represents a user's profile"""
    user = models.OneToOneField(User)
    yrs_experience = models.IntegerField()
    email_upcoming_chats = models.BooleanField(default=False)
    email_new_chat_topics = models.BooleanField(default=False)
    email_new_job_opps = models.BooleanField(default=False)


class CodeType(models.Model):
    """Code Types for things like registration and password reset """
    type = models.CharField(max_length=100)
    description = models.CharField(max_length=1024)


class Code(models.Model):
    """Represents code for registration and pw reset """
    user = models.ForeignKey(User)
    type = models.ForeignKey(CodeType)
    code = models.CharField(max_length=255)
    created = models.DateTimeField(auto_now_add=True)
    used = models.DateTimeField(null=True)


class UserSkill(models.Model):
    """Represents one of potentially many user skills """
    user = models.ForeignKey(User)
    technology = models.ForeignKey(Technology)
    yrs_experience = models.IntegerField()
    expertise_level = models.IntegerField() #TODO define custom levels?


class UserJobPrefs(models.Model):
    """Represents a user's job preferences """
    user = models.ForeignKey(User)
    salary_start = models.IntegerField()
    salary_end   = models.IntegerField()