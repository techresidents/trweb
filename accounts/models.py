from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User)

class CodeType(models.Model):
    type = models.CharField(max_length=100)
    description = models.CharField(max_length=1024)

class Code(models.Model):
    user = models.ForeignKey(User)
    type = models.ForeignKey(CodeType)
    code = models.CharField(max_length=255)
    created = models.DateTimeField(auto_now_add=True)
    used = models.DateTimeField(null=True)
