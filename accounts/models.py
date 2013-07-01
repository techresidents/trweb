import re

from django.db import models
from django.db.models.signals import post_save
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, SiteProfileNotAvailable
from django.core import validators
from django.core.exceptions import ImproperlyConfigured
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.http import urlquote
from django.utils.translation import ugettext_lazy as _

DEVELOPER_TENANT_ID = 1

class Tenant(models.Model):
    """Tenant model"""
    name = models.CharField(max_length=100, unique=True)
    domain = models.CharField(max_length=255, unique=True)

class UserManager(BaseUserManager):

    def create_user(self, username, email=None, password=None, **extra_fields):
        """
        Creates and saves a User with the given username, email and password.
        """
        now = timezone.now()
        if not username:
            raise ValueError('The given username must be set')
        email = UserManager.normalize_email(email)
        user = self.model(username=username, email=email,
                          is_staff=False, is_active=True, is_superuser=False,
                          last_login=now, date_joined=now, **extra_fields)

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password, **extra_fields):
        u = self.create_user(username, email, password, **extra_fields)
        u.is_staff = True
        u.is_active = True
        u.save(using=self._db)
        return u


class User(AbstractBaseUser):
    """User model."""
    username = models.CharField(_('username'), max_length=254, unique=True,
        help_text=_('Required. 254 characters or fewer. Letters, numbers and '
                    '@/./+/-/_ characters'),
        validators=[
            validators.RegexValidator(re.compile('^[\w.@+-]+$'), _('Enter a valid username.'), 'invalid')
        ])
    first_name = models.CharField(_('first name'), max_length=30, blank=True)
    last_name = models.CharField(_('last name'), max_length=30, blank=True)
    email = models.EmailField(_('email address'), max_length=254, blank=True)
    is_staff = models.BooleanField(_('staff status'), default=False,
        help_text=_('Designates whether the user can log into this admin '
                    'site.'))
    is_active = models.BooleanField(_('active'), default=True,
        help_text=_('Designates whether this user should be treated as '
                    'active. Unselect this instead of deleting accounts.'))
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)

    otp_enabled = models.BooleanField(default=False)

    timezone = models.CharField(max_length=255)

    tenant = models.ForeignKey(Tenant, default=DEVELOPER_TENANT_ID, related_name="users")

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']
    
    @property
    def is_developer(self):
        return self.tenant_id == DEVELOPER_TENANT_ID
    
    @property
    def is_employer(self):
        return not self.is_developer

    def get_absolute_url(self):
        return "/users/%s/" % urlquote(self.username)

    def get_full_name(self):
        """
        Returns the first_name plus the last_name, with a space in between.
        """
        full_name = '%s %s' % (self.first_name, self.last_name)
        return full_name.strip()

    def get_short_name(self):
        "Returns the short name for the user."
        return self.first_name

    def email_user(self, subject, message, from_email=None):
        """
        Sends an email to this User.
        """
        send_mail(subject, message, from_email, [self.email])

    def get_profile(self):
        """
        Returns site-specific profile for this user. Raises
        SiteProfileNotAvailable if this site does not allow profiles.
        """
        if not hasattr(self, '_profile_cache'):
            try:
                model = EmployerProfile if self.is_employer else DeveloperProfile
                self._profile_cache = model._default_manager.using(
                                   self._state.db).get(user__id__exact=self.id)
                self._profile_cache.user = self
            except (ImportError, ImproperlyConfigured):
                raise SiteProfileNotAvailable
        return self._profile_cache

class DeveloperProfile(models.Model):
    """User profile model."""
    class Meta:
        db_table = "accounts_developer_profile"

    user = models.OneToOneField(User)
    location = models.CharField(max_length=100, null=True)
    developer_since = models.DateField(null=True)
    email_upcoming_chats = models.BooleanField(default=False)
    email_new_chat_topics = models.BooleanField(default=False)
    email_new_job_opps = models.BooleanField(default=True)

def create_developer_profile(sender, instance, created, **kwargs):
    if created and instance.is_developer:
        DeveloperProfile.objects.create(user=instance)

class EmployerProfile(models.Model):
    """User profile model."""
    class Meta:
        db_table = "accounts_employer_profile"

    user = models.OneToOneField(User)

def create_employer_profile(sender, instance, created, **kwargs):
    if created and instance.is_employer:
        EmployerProfile.objects.create(user=instance)

# debugging note: if this function is being invoked twice (or more than once)
# the culprit is most likely due to the module being imported multiple times.
# This can be fixed by using consistent import paths.
post_save.connect(create_developer_profile, sender=User)
post_save.connect(create_employer_profile, sender=User)


class CodeType(models.Model):
    """Code Types for things like registration and password reset """
    type = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)


class Code(models.Model):
    """Represents code for things like registration and pw reset """
    user = models.ForeignKey(User, related_name="+")
    type = models.ForeignKey(CodeType, related_name="+")
    code = models.CharField(max_length=255)
    created = models.DateTimeField(auto_now_add=True)
    used = models.DateTimeField(null=True)


class Request(models.Model):
    """Request an account"""
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.EmailField(max_length=75, unique=True)
    code = models.CharField(max_length=255)
    created = models.DateTimeField(auto_now_add=True)


class OneTimePasswordType(models.Model):
    """One time password type."""
    class Meta:
        db_table = "accounts_one_time_password_type"

    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)


class OneTimePassword(models.Model):
    """One time password."""
    class Meta:
        db_table = "accounts_one_time_password"
    type = models.ForeignKey(OneTimePasswordType, related_name="+")
    secret = models.CharField(max_length=1024)
    user = models.ForeignKey(User, related_name="+")

class IdentityGrant(models.Model):
    """Identity grant model used to grant a tenant access to a user's identity."""
    class Meta:
        db_table = "accounts_identity_grant"
    
    tenant = models.ForeignKey(Tenant, related_name="+")
    user = models.ForeignKey(User, related_name="+")

