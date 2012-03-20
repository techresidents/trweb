from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User)
    yrs_experience = models.IntegerField()
    email_upcoming_chats = models.BooleanField(default=False)
    email_new_chat_topics = models.BooleanField(default=False)
    email_new_job_opps = models.BooleanField(default=False)

# Code Types for things like registration and password reset
class CodeType(models.Model):
    type = models.CharField(max_length=100)
    description = models.CharField(max_length=1024)

# Represents codes for registration and pw reset
class Code(models.Model):
    user = models.ForeignKey(User)
    type = models.ForeignKey(CodeType)
    code = models.CharField(max_length=255)
    created = models.DateTimeField(auto_now_add=True)
    used = models.DateTimeField(null=True)

# Class to represent one of many user skills
class UserSkill(models.Model):
    user = models.ForeignKey(User)
    technology = models.ForeignKey(Technology)
    yrs_experience = models.IntegerField()
    expertise_level = models.IntegerField() #TODO define custom levels?


class UserJobPrefs(models.Model):
    user = models.ForeignKey(User)
    salary_start = models.IntegerField()
    salary_end   = models.IntegerField()