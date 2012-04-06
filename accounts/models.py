from django.db import models
from django.contrib.auth.models import User
from techresidents_web.common.models import Technology
from techresidents_web.common.models import ExpertiseType
from django.db.models.signals import post_save


class UserProfile(models.Model):
    """ Represents a user's profile"""
    user = models.OneToOneField(User)
    developer_since = models.DateField(null=True)
    email_upcoming_chats = models.BooleanField(default=False)
    email_new_chat_topics = models.BooleanField(default=False)
    email_new_job_opps = models.BooleanField(default=False)

def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

# debugging note: if this function is being invoked twice (or more than once)
# the culprit is most likely due to the module being imported multiple times.
# This can be fixed by using consistent import paths.
post_save.connect(create_user_profile, sender=User)


class CodeType(models.Model):
    """Code Types for things like registration and password reset """
    type = models.CharField(max_length=100)
    description = models.CharField(max_length=1024)


class Code(models.Model):
    """Represents code for things like registration and pw reset """
    user = models.ForeignKey(User)
    type = models.ForeignKey(CodeType)
    code = models.CharField(max_length=255)
    created = models.DateTimeField(auto_now_add=True)
    used = models.DateTimeField(null=True)


class Skill(models.Model):
    """Represents one of potentially many user skills """
    class Meta:
        unique_together = ("user", "technology")

    user = models.ForeignKey(User)
    technology = models.ForeignKey(Technology)
    expertise_type = models.ForeignKey(ExpertiseType)
    yrs_experience = models.IntegerField()