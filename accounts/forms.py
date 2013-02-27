import base64
import datetime
import hashlib
import hmac
import logging
import struct
import time
import uuid

from django import forms
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import EmailMultiAlternatives
from django.core.urlresolvers import reverse
from django.contrib import auth
from django.db import IntegrityError
from django.template import Context
from django.utils import timezone
User = get_user_model()

from techresidents_web.common.forms import JSONField
from techresidents_web.common.models import ExpertiseType, Skill, Technology, TechnologyType, Location
from techresidents_web.accounts.models import CodeType, Code, OneTimePassword, OneTimePasswordType, Request, Tenant
from techresidents_web.job.models import JobPositionType, JobPositionTypePref, JobTechnologyPref, JobLocationPref


# Some field size constants for this form.
# These lengths are purposefully less than what is permitted at the db layer.
NAME_MAX_LEN = 30
EMAIL_MAX_LEN = 75
PASSWORD_MIN_LEN = 4
PASSWORD_MAX_LEN = 30
JSON_FIELD_MAX_LEN = 2048
COMPANY_MAX_LEN = 75 

TIME_ZONE_CHOICES = [
    ("US/Hawaii", "(GMT-10:00) Hawaii Time"),
    ("US/Alaska", "(GMT-09:00) Alaska Time"),
    ("US/Pacific", "(GMT-08:00) Pacific Time"),
    ("US/Mountain", "(GMT-07:00) Mountain Time"),
    ("US/Arizona", "(GMT-07:00) Mountain Time - Arizona"),
    ("US/Central", "(GMT-06:00) Central Time"),
    ("US/Eastern", "(GMT-05:00) Eastern Time"),
]


class AccountRequestForm(forms.ModelForm):
    class Meta:
        model = Request
        fields = ('first_name', 'last_name', 'email')

    def clean_email(self):
        email = self.cleaned_data['email']
        try:
            Request.objects.get(email=email)
        except Request.DoesNotExist:
            return email
        raise forms.ValidationError("Account already requested")

    def save(self, commit=True):
        request = super(AccountRequestForm, self).save(commit=False)
        if commit:
            request.code = uuid.uuid4().hex
            request.save()
        return request


class RegisterUserForm(forms.ModelForm):
    first_name = forms.CharField(label="First Name", max_length=NAME_MAX_LEN, required=True)
    last_name = forms.CharField(label="Last Name", max_length=NAME_MAX_LEN, required=True)
    username = forms.EmailField(label="Email", max_length=EMAIL_MAX_LEN, required=True)
    password = forms.CharField(label="Password", min_length=PASSWORD_MIN_LEN, max_length=PASSWORD_MAX_LEN, widget=forms.PasswordInput, required=True)
    password_confirmation  = forms.CharField(label="Re-enter password", min_length=PASSWORD_MIN_LEN,  max_length=PASSWORD_MAX_LEN, widget=forms.PasswordInput, required=True)
    timezone = forms.ChoiceField(label="Time zone", choices=TIME_ZONE_CHOICES, required=True)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'username')

    def __init__(self, request=None, account_request_code=None, *args, **kwargs):
        self.request = request
        self.account_request_code = account_request_code
        self.user = None
        super(RegisterUserForm, self).__init__(*args, **kwargs)
        self.fields['first_name'].widget.attrs['autofocus'] = 'autofocus'
    
    def clean_username(self):
        username = self.cleaned_data['username']
        try:
            User.objects.get(username=username)
        except User.DoesNotExist:
            return username
        raise forms.ValidationError("Username already exists.")


    def clean(self):
        #Registeration requires valid account request code
        #only if it's not set to None.
        if self.account_request_code and 'username' in self.cleaned_data:
            try:
                account_request = Request.objects.get(code=self.account_request_code)
                if account_request.email != self.cleaned_data['username']:
                    raise forms.ValidationError("Invalid registration code.")
            except Request.DoesNotExist:
                raise forms.ValidationError("Invalid registration code.")
        
        #Validate that passwords match
        if 'password' in self.cleaned_data and 'password_confirmation' in self.cleaned_data:
            password = self.cleaned_data['password']
            password_confirmation = self.cleaned_data['password_confirmation']
            if password != password_confirmation:
                raise forms.ValidationError("Passwords do not match.")

        return self.cleaned_data
    
    def save(self, commit=True):
        user = super(RegisterUserForm, self).save(commit=False)
        user.email = self.cleaned_data['username']
        user.set_password(self.cleaned_data['password'])
        user.timezone = self.cleaned_data['timezone']
        if commit:
            user.save()
            
            #Authenticate user so they can be logged in using
            #the returned user object.
            user = auth.authenticate(
                    username=self.cleaned_data['username'],
                    password=self.cleaned_data['password'])
        return user

    def create_registration_code(self, registration_code=None):
        if self.errors:
            raise ValueError("Unable to create registration code for invalid register form")

        user = User.objects.get(username=self.cleaned_data['username'])
        code_type = CodeType.objects.get(type='REGISTRATION')
        registration_code = registration_code or uuid.uuid4().hex
        Code.objects.create(user=user, type=code_type, code=registration_code)

        return registration_code

    def get_activation_url(self, registration_code):
        url = self.request.build_absolute_uri(reverse("accounts.views.register_activate", args=[registration_code]))
        return url

    
    def send_activation_email(self, subject, text_template, html_template, from_email=None, context = None, registration_code=None):
        if self.errors:
            raise ValueError("Unable to send email for invalid registration form")
        
        registration_code = registration_code or self.create_registration_code()

        context = context or Context()
        context['activation_url'] = self.get_activation_url(registration_code)
        context['activation_code'] = registration_code
        to = self.cleaned_data['username']

        text_content = text_template.render(context)
        html_content = html_template.render(context)
        msg = EmailMultiAlternatives(subject, text_content, from_email, [to])
        msg.attach_alternative(html_content, 'text/html')
        msg.send()

class RegisterEmployerForm(RegisterUserForm):
    company = forms.CharField(label="Company", max_length=COMPANY_MAX_LEN, required=True)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'username')

    def __init__(self, *args, **kwargs):
        super(RegisterEmployerForm, self).__init__(*args, **kwargs)
        self.fields['company'].widget.attrs['autofocus'] = 'autofocus'
        del self.fields['first_name'].widget.attrs['autofocus']
        self.fields.keyOrder = [
                'company',
                'first_name',
                'last_name',
                'username',
                'password',
                'password_confirmation',
                'timezone'
        ]
    
    def clean_username(self):
        email = super(RegisterEmployerForm, self).clean_username()

        prohibited_domains = [
            'gmail.com',
            'hotmail.com',
            'live.com',
            'outlook.com',
            'yahoo.com'
        ]

        domain = email.split('@')[1]
        if domain in prohibited_domains:
            raise forms.ValidationError('invalid email address domain')
        return email
    
    def get_tenant(self):
        result = None
        company = self.cleaned_data['company']
        email = self.cleaned_data['username']
        domain = email.split('@')[1]
        try:
            result = Tenant.objects.get(domain=domain)
        except Tenant.DoesNotExist:
            try:
                result = Tenant.objects.create(name=company, domain=domain)
            except IntegrityError:
                pass
        except:
            pass
        return result


    def save(self, commit=True):
        user = super(RegisterEmployerForm, self).save(commit=False)
        user.tenant = self.get_tenant()
        #Employers must verify email addresss to activate account.
        user.is_active = False

        if commit:
            user.save()
            #Authenticate user so they can be logged in using
            #the returned user object.
            user = auth.authenticate(
                    username=self.cleaned_data['username'],
                    password=self.cleaned_data['password'])
        return user
    
class RegistrationActivationForm(forms.Form):

    registration_code = forms.CharField(label="Activation Code", max_length=128, required=True)

    def __init__(self, allow_reactivation, *args, **kwargs):
        self.allow_reactivation = allow_reactivation

        super(RegistrationActivationForm, self).__init__(*args, **kwargs)

    def clean_registration_code(self):
        #Validate the registration code
        #If the code is not found in the database raise an exception
        try:
            registration_code = self.cleaned_data['registration_code']

            if self.allow_reactivation:
                Code.objects.get(type__type='REGISTRATION', code=registration_code)
            else:
                Code.objects.get(type__type='REGISTRATION', code=registration_code, used=None)

        except ObjectDoesNotExist:
            raise forms.ValidationError("Invalid activation code.")

        return registration_code

    def activate(self):
        if self.errors:
            raise ValueError("Unable to activate invalid registration activation form")
        
        registration_code = self.cleaned_data['registration_code']

        code = Code.objects.get(type__type='REGISTRATION', code=registration_code)

        if not code.used:
            code.user.is_active = True
            code.user.save()
            code.used = timezone.now()
            code.save()


class LoginForm(forms.Form):
    username = forms.EmailField(label="Email", max_length=EMAIL_MAX_LEN, required=True)
    password = forms.CharField(label="Password", max_length=PASSWORD_MAX_LEN, widget=forms.PasswordInput, required=True)
    remember_me = forms.BooleanField(label="Remember me", widget=forms.CheckboxInput, required=False)

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        self.user = None
        super(LoginForm, self).__init__(*args, **kwargs)
        self.fields['username'].widget.attrs['autofocus'] = 'autofocus'

    def clean(self):
        username = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')

        if username and password:
            self.user = auth.authenticate(username=username, password=password)
            if self.user is None:
                raise forms.ValidationError("Invalid username or password.")
            elif not self.user.is_active:
                raise forms.ValidationError("Account is inactive.")

        self.check_for_test_cookie()
        
        return self.cleaned_data
    
    def check_for_test_cookie(self):
        if self.request and not self.request.session.test_cookie_worked():
            raise forms.ValidationError("Cookie are required for logging in.")

    def get_user(self):
        return self.user

class LoginOTPForm(forms.Form):
    code = forms.CharField(label="Code", max_length=32, widget=forms.PasswordInput, required=True)

    def __init__(self, one_time_password=None, *args, **kwargs):
        self.otp = one_time_password
        super(LoginOTPForm, self).__init__(*args, **kwargs)
        self.fields['code'].widget.attrs['autofocus'] = 'autofocus'
    
    def _authenticate(self, secret, code):
        #Time based one time password (RFC 6238)
        result = False
        
        if secret is not None and code is not None:
            timestamp = int(time.time() / 30)
            secret = base64.b32decode(secret)

            for index in [-1, 0, 1]:
                timestamp_bytes = struct.pack(">q", timestamp + index)

                hmac_digest = hmac.HMAC(secret, timestamp_bytes, hashlib.sha1).digest()

                offset = ord(hmac_digest[-1]) & 0x0F
                truncated_hmac_digest = hmac_digest[offset:offset+4]

                valid_code = struct.unpack(">L", truncated_hmac_digest)[0]
                valid_code &= 0x7FFFFFFF
                valid_code %= 1000000

                if ("%06d" % valid_code) == str(code):
                    result = True
                    break

        return result

    def clean(self):
        code = self.cleaned_data.get('code')
        if not self._authenticate(self.otp.secret, code):
            raise forms.ValidationError("Invalid code")
        return self.cleaned_data

class ForgotPasswordForm(forms.Form):
    username = forms.EmailField(label="Email", max_length=EMAIL_MAX_LEN, required=True)
    username_confirmation = forms.EmailField(label="Re-enter email", max_length=EMAIL_MAX_LEN, required=True)

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        super(ForgotPasswordForm, self).__init__(*args, **kwargs)
        self.fields['username'].widget.attrs['autofocus'] = 'autofocus'

    def clean(self):
        if 'username' in self.cleaned_data and 'username_confirmation' in self.cleaned_data:
            username = self.cleaned_data['username']
            username_confirmation = self.cleaned_data['username_confirmation']
            if username != username_confirmation:
                raise forms.ValidationError("Email addresses do not match.")
        return self.cleaned_data

    def create_reset_password_code(self):
        if self.errors:
            raise ValueError("Unable to create reset password code for invalid forgot password form")
        
        reset_password_code = None

        try:
            user = User.objects.get(username=self.cleaned_data['username'])
            code_type = CodeType.objects.get(type='RESET_PASSWORD')
            reset_password_code = reset_password_code or uuid.uuid4().hex
            Code.objects.create(user=user, type=code_type, code=reset_password_code)

        except ObjectDoesNotExist:
            pass

        return reset_password_code

    def get_reset_password_url(self, reset_password_code):
        url = self.request.build_absolute_uri(reverse('accounts.views.reset_password', args=[reset_password_code]))
        return url.replace("http:", "https:")

    
    def send_email(self, subject, text_template, html_template, from_email=None, context = None, reset_password_code=None):
        if self.errors:
            raise ValueError("Unable to send email for invalid forgot password form")
        
        reset_password_code = reset_password_code or self.create_reset_password_code()

        if reset_password_code:
            context = context or Context()
            context['reset_password_url'] = self.get_reset_password_url(reset_password_code)
            to = self.cleaned_data['username']

            text_content = text_template.render(context)
            html_content = html_template.render(context)
            msg = EmailMultiAlternatives(subject, text_content, from_email, [to])
            msg.attach_alternative(html_content, 'text/html')
            msg.send()

class ResetPasswordForm(forms.Form):
    password = forms.CharField(label="Password", min_length=PASSWORD_MIN_LEN, max_length=PASSWORD_MAX_LEN, widget=forms.PasswordInput, required=True)
    password_confirmation = forms.CharField(label="Re-enter password", min_length=PASSWORD_MIN_LEN, max_length=PASSWORD_MAX_LEN, widget=forms.PasswordInput, required=True)

    def __init__(self, reset_password_code, *args, **kwargs):
        self.reset_password_code = reset_password_code
        super(ResetPasswordForm, self).__init__(*args, **kwargs)
        self.fields['password'].widget.attrs['autofocus'] = 'autofocus'

    def clean(self):
        if 'password' in self.cleaned_data and 'password_confirmation' in self.cleaned_data:
            password = self.cleaned_data['password']
            password_confirmation = self.cleaned_data['password_confirmation']
            if password != password_confirmation:
                raise forms.ValidationError("Passwords do not match.")
        
        #Validate the reset password code
        #If the code is not found in the database raise an exception
        try:
            Code.objects.get(type__type='RESET_PASSWORD', code=self.reset_password_code, used=None)
        except ObjectDoesNotExist:
            raise forms.ValidationError("Invalid reset password code.")
        return self.cleaned_data

    def reset_password(self):
        if self.errors:
            raise ValueError("Unable to reset password for invalid reset password form")

        code = Code.objects.get(type__type='RESET_PASSWORD', code=self.reset_password_code, used=None)
        code.user.set_password(self.cleaned_data['password'])
        code.user.save()

        code.used = timezone.now()
        code.save()

class OTPForm(forms.Form):
    secret = forms.CharField(label="Secret", max_length=256, required=True)
    enable = forms.BooleanField(label="Enable", widget=forms.CheckboxInput, required=False)

    def __init__(self, request, *args, **kwargs):
        self.request = request
        super(OTPForm, self).__init__(*args, **kwargs)
        self.fields['secret'].widget.attrs['autofocus'] = 'autofocus'
    
    def clean_secret(self):
        secret = self.cleaned_data["secret"]
        if len(secret) != 16:
            raise forms.ValidationError("Invalid secret")

        try:
            base64.b32decode(secret)
        except:
            raise forms.ValidationError("Invalid secret")

        return secret

    def save(self, commit=True):
        #otp model
        try:
            otp = OneTimePassword.objects.get(
                    type__name="TOTP",
                    user=self.request.user)
        except OneTimePassword.DoesNotExist:
            otp_type = OneTimePasswordType.objects.get(
                    name="TOTP")
            otp = OneTimePassword(
                    type=otp_type,
                    user=self.request.user)
        otp.secret = self.cleaned_data['secret']

        #user model
        self.request.user.otp_enabled = self.cleaned_data['enable']

        if commit:
            otp.save()
            self.request.user.save()

        return otp

class ProfileAccountForm(forms.Form):
    # year choices
    # the range 'end' value is not inclusive so we add 1 to the current year
    # create a 50 year span
    years_experience_range = reversed(range(timezone.now().year-50, timezone.now().year+1))
    years_experience_choices = [(year, year) for year in years_experience_range]
    years_experience_choices.insert(0,('', ''))  # insert blank default value

    #fields
    first_name = forms.CharField(label="First Name", max_length=NAME_MAX_LEN, widget=forms.TextInput, required=True)
    last_name = forms.CharField(label="Last Name", max_length=NAME_MAX_LEN, widget=forms.TextInput, required=True)
    email_address = forms.EmailField(label="Email", max_length=EMAIL_MAX_LEN, widget=forms.TextInput, required=False)
    timezone = forms.ChoiceField(label="Time zone", choices=TIME_ZONE_CHOICES, required=True)
    developer_since = forms.ChoiceField(label="Proud Developer Since", choices=years_experience_choices, required=False)

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        super(ProfileAccountForm, self).__init__(*args, **kwargs)

    def save(self, commit=True):
        #user model
        user = self.request.user
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        user.timezone = self.cleaned_data['timezone']
        
        #user profile model
        user_profile = self.request.user.get_profile()
        year = self.cleaned_data['developer_since'] # returns year as a string when not empty
        if year:
            user_profile.developer_since = datetime.date(int(year),1,1)
        else:
            user_profile.developer_since = None

        if commit:
            user.save()
            user_profile.save()
        return user

class ProfilePasswordForm(forms.Form):
    current_password = forms.CharField(label="Current Password", min_length=PASSWORD_MIN_LEN, max_length=PASSWORD_MAX_LEN, widget=forms.PasswordInput, required=True)
    new_password = forms.CharField(label="New Password", min_length=PASSWORD_MIN_LEN, max_length=PASSWORD_MAX_LEN, widget=forms.PasswordInput, required=True)
    password_confirmation = forms.CharField(label="Re-enter Password", min_length=PASSWORD_MIN_LEN, max_length=PASSWORD_MAX_LEN, widget=forms.PasswordInput, required=True)

    def __init__(self, request=None, *args, **kwargs):
        self.user = request.user
        super(ProfilePasswordForm, self).__init__(*args, **kwargs)

    def clean_current_password(self):
        current_password = self.cleaned_data['current_password']
        if not self.user.check_password(current_password):
            raise forms.ValidationError("Incorrect password")
        return current_password

    def clean(self):
        clean_data = super(ProfilePasswordForm, self).clean()
        # Only validate the new password values if both fields are valid so far
        if 'new_password' in clean_data and 'password_confirmation' in clean_data:
            new_password = clean_data['new_password']
            password_confirmation = clean_data['password_confirmation']
            if new_password != password_confirmation:
                raise forms.ValidationError("New password values do not match")
        else:
            raise forms.ValidationError("New password and confirmation password must be provided")
        return clean_data

    def save(self, commit=True):
        self.user.set_password(self.cleaned_data['new_password'])
        if commit:
            self.user.save()
        return self.user

class ProfileChatsForm(forms.Form):
    email_upcoming_chats = forms.BooleanField(label="Notify me 24 hours before the start of registered chats", widget=forms.CheckboxInput, required=False)
    email_new_chat_topics = forms.BooleanField(label="Notify me when new chat topics become available", widget=forms.CheckboxInput, required=False)

    def __init__(self, request=None, *args, **kwargs):
        self.user_profile = request.user.get_profile()
        super(ProfileChatsForm, self).__init__(*args, **kwargs)

    def save(self, commit=True):
        self.user_profile.email_upcoming_chats = self.cleaned_data['email_upcoming_chats']
        self.user_profile.email_new_chat_topics = self.cleaned_data['email_new_chat_topics']
        if commit:
            self.user_profile.save()
        return self.user_profile

class ProfileJobsForm(forms.Form):

    # numerical constants
    SALARY_MIN = 0
    SALARY_MAX = 260000

    # Setup form fields
    notifications_form_data = JSONField(max_length=JSON_FIELD_MAX_LEN, widget=forms.HiddenInput, required=False)
    positions_form_data = JSONField(max_length=JSON_FIELD_MAX_LEN, widget=forms.HiddenInput, required=False)
    technologies_form_data = JSONField(max_length=JSON_FIELD_MAX_LEN, widget=forms.HiddenInput, required=False)
    locations_form_data = JSONField(max_length=JSON_FIELD_MAX_LEN, widget=forms.HiddenInput, required=False)

    def __init__(self, request=None, *args, **kwargs):
        self.user = request.user
        super(ProfileJobsForm, self).__init__(*args, **kwargs)

    def clean_positions_form_data(self):
        cleaned_positions_data = self.cleaned_data.get('positions_form_data')
        if cleaned_positions_data:

            position_type_ids = []
            position_type_pref_ids = []
            # Need to validate positionPrefID, if it has one, the positionTypeID, and minSalary
            for position_data in cleaned_positions_data:

                # Append model ids for later validation
                # Note that position type preferences  will
                # only have  an 'id' if it's been previously saved.
                # Preferences being added for the first time
                # will not have an 'id'.
                if "id" in position_data:
                    position_type_pref_ids.append(position_data['id'])
                position_type_ids.append(position_data['positionTypeId'])

                # Validate the minimum salary data
                position_min_salary = position_data['min_salary']
                if position_min_salary is not None:
                    if type(position_min_salary == int):
                        min_salary = position_min_salary
                    else:
                        min_salary = int(position_min_salary)
                    if min_salary < self.SALARY_MIN or\
                       min_salary > self.SALARY_MAX:
                        raise forms.ValidationError("Position minimum salary value is invalid")
                else:
                    raise forms.ValidationError("Position minimum salary field required")
            
            #Validate position types
            count = JobPositionType.objects\
                    .filter(id__in=position_type_ids)\
                    .count()
            if count != len(position_type_ids):
                raise forms.ValidationError("Position type id value is invalid")

            # Validate position type preference ids are valid
            # and belong to the current user.
            count = JobPositionTypePref.objects\
                    .filter(id__in=position_type_pref_ids, user=self.user)\
                    .count()
            if count != len(position_type_pref_ids):
                raise forms.ValidationError("Position type pref id value is invalid")


        return cleaned_positions_data

    def clean_technologies_form_data(self):
        cleaned_technologies_data = self.cleaned_data.get('technologies_form_data')
        if cleaned_technologies_data:

            technology_ids = []
            for technology_data in cleaned_technologies_data:
                technology_ids.append(technology_data['technologyId'])
            
            count = Technology.objects\
                    .filter(id__in=technology_ids)\
                    .count()

            if count != len(technology_ids):
                raise forms.ValidationError("Technology id value is invalid")

        return cleaned_technologies_data

    def clean_locations_form_data(self):
        cleaned_locations_data = self.cleaned_data.get('locations_form_data')
        if cleaned_locations_data:
            
            location_ids = []
            for location_data in cleaned_locations_data:
                location_ids.append(location_data['locationId'])
            
            count = Location.objects\
                    .filter(id__in=location_ids)\
                    .count()

            if count != len(location_ids):
                raise forms.ValidationError("Location id value is invalid")

        return cleaned_locations_data

    def save(self):
        # Making the assumption that form data is clean and valid (meaning that the position
        # data passed in from the user matches existing positions in the db).


        # Retrieve posted position data
        updated_position_prefs = self.cleaned_data.get('positions_form_data')
        updated_pref_ids = {p['id'] for p in updated_position_prefs if 'id' in p}

        # Before updating the user's position preferences, save the old prefs to check for prefs that may have been deleted
        previous_position_prefs = JobPositionTypePref.objects.filter(user=self.user)
        for previous_pref in previous_position_prefs:
            if not previous_pref.id in updated_pref_ids:
                 previous_pref.delete()

        # Update user's positions based on data posted
        for position in updated_position_prefs:
            if 'id' in position:
                id = position['id']
                rows_updated = JobPositionTypePref.objects.filter(id=id, user=self.user).update(
                    salary_start=position['min_salary']
                )
                if 1 != rows_updated:
                    logging.error('Failed to update PositionTypePreference')
            else:
                JobPositionTypePref(
                    user=self.user,
                    position_type_id=position['positionTypeId'],
                    salary_start=position['min_salary']
                ).save()



        # Retrieve posted technology pref data
        updated_technology_prefs = self.cleaned_data.get('technologies_form_data')
        updated_technology_pref_ids = {t['technologyId'] for t in updated_technology_prefs}

        # Before updating the user's technology preferences, save the old prefs to check for prefs that may have been deleted
        previous_technology_prefs = JobTechnologyPref.objects.filter(user=self.user).select_related('technology')
        for previous_pref in previous_technology_prefs:
            if not previous_pref.technology.id in updated_technology_pref_ids:
                previous_pref.delete()

        # Update user's technology prefs based on data posted
        for technology in updated_technology_prefs:
            # Check if this is a new preference and save it if it is.
            if 'id' not in technology:
                JobTechnologyPref(
                    user=self.user,
                    technology_id=technology['technologyId']
                ).save()




        # Retrieve posted location pref data
        updated_location_prefs = self.cleaned_data.get('locations_form_data')
        updated_location_pref_ids = {l['locationId'] for l in updated_location_prefs}

        # Before updating the user's location preferences, save the old prefs to check for prefs that may have been deleted
        previous_location_prefs = JobLocationPref.objects.filter(user=self.user).select_related('location')
        for previous_pref in previous_location_prefs:
            if not previous_pref.location.id in updated_location_pref_ids:
                previous_pref.delete()

        # Update user's location prefs based on data posted
        for location in updated_location_prefs:
            # Check if this is a new preference and save it if it is.
            if 'id' not in location:
                JobLocationPref(
                    user=self.user,
                    location_id=location['locationId']
                ).save()


        # Update general job prefs
        notification_prefs = self.cleaned_data.get('notifications_form_data')
        profile = self.user.get_profile()
        if notification_prefs['emailNewJobOpps'] is not None:
            profile.email_new_job_opps = notification_prefs['emailNewJobOpps']
        profile.save()

        return

class ProfileSkillsForm(forms.Form):
    skills_form_data = JSONField(max_length=2048, widget=forms.HiddenInput, required=True)

    # JSON keys
    JSON_SKILL_NAME = 'name'
    JSON_EXPERTISE = 'expertise'
    JSON_YRS_EXPERIENCE = 'yrs_experience'

    # numerical constants
    MAX_YRS_EXPERIENCE = 21 #This represents the 20+ yrs experience selection in the UI.


    def __init__(self, request=None, technology_type_name=None, *args, **kwargs):
        self.request = request
        self.technology_type_name = technology_type_name
        super(ProfileSkillsForm, self).__init__(*args, **kwargs)

    def clean(self):
        super(ProfileSkillsForm, self).clean()
        cleaned_skills_data = self.cleaned_data.get('skills_form_data')

        # Verify we have some data to validate
        if cleaned_skills_data is None:
            raise forms.ValidationError("Invalid Skill data")
        
        technology_names = []
        expertise_names = []
        for skill in cleaned_skills_data:
            
            # Verify we have a name attribute
            skill_name = skill[self.JSON_SKILL_NAME]
            if skill_name:
                #append name for later validation
                technology_names.append(skill_name)
            else:
                raise forms.ValidationError("Skill name field required")

            # Verify we have an expertise level attribute
            skill_expertise = skill[self.JSON_EXPERTISE]
            if skill_expertise:
                #append name for later validation
                expertise_names.append(skill_expertise)
            else:
                raise forms.ValidationError("Skill expertise field required")

            # Verify we have a years_experience attribute
            skill_yrs_experience = skill[self.JSON_YRS_EXPERIENCE]
            if skill_yrs_experience is not None:
                # if we have a years_experience attribute, verify that it's valid
                if not type(skill_yrs_experience == int):
                    yrs = int(skill_yrs_experience)
                else:
                    yrs = skill_yrs_experience
                if yrs < 0 or yrs > self.MAX_YRS_EXPERIENCE:
                    raise forms.ValidationError("Skill years experience value is invalid")
            else:
                raise forms.ValidationError("Skill years experience field required")
        
        #Validate technology names
        count = Technology.objects\
                .filter(type__name=self.technology_type_name,
                        name__in=technology_names)\
                .count()
        if count != len(technology_names):
            raise forms.ValidationError("Technology name value is invalid")
        
        #validate expertise name
        expertise_names = list(set(expertise_names)) #remove duplicates
        count = ExpertiseType.objects\
                .filter(name__in=expertise_names)\
                .count()
        if count != len(expertise_names):
            raise forms.ValidationError("Expertise name value is invalid")

        return self.cleaned_data

    def save(self, commit=True):
        # Making the assumption that form data is clean and valid (meaning that the skill
        # data passed in from the user matches existing skills in the db).

        # retrieve posted data
        updated_skills = self.cleaned_data.get('skills_form_data')

        # Before updating the user's language skills, save the old skills to check for deleted skills
        updated_skill_names = {s[self.JSON_SKILL_NAME] for s in updated_skills}
        skill_technology_type = TechnologyType.objects.get(name=self.technology_type_name)
        previous_skills = Skill.objects.filter(user=self.request.user, technology__type=skill_technology_type).select_related('technology')

        # Update user's skills based on data posted
        for skill in updated_skills:

            # retrieve the existing skill, or create a new skill if one doesn't exist
            user_skill = None
            try:
                technology = Technology.objects.get(name=skill[self.JSON_SKILL_NAME])
                user_skill = Skill.objects.get(user=self.request.user, technology=technology)
            except Skill.DoesNotExist:
                user_skill = Skill(
                    user=self.request.user,
                    technology=technology,
                    expertise_type=ExpertiseType.objects.get(name='Novice'),
                    yrs_experience=0
                )

            # update skill object with posted data
            if user_skill is not None:
                user_skill.yrs_experience = skill[self.JSON_YRS_EXPERIENCE]
                user_skill.expertise_type = ExpertiseType.objects.get(name=skill[self.JSON_EXPERTISE])
                if commit:
                    user_skill.save()

        # if we've made it this far, then we go ahead and delete any obsolete skills
        if commit:
            for previous_skill in previous_skills:
                if not previous_skill.technology.name in updated_skill_names:
                    previous_skill.delete()

        return updated_skills
