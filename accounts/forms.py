import datetime
import json
import uuid

from django import forms
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import EmailMultiAlternatives
from django.core.urlresolvers import reverse
from django.contrib import auth
from django.contrib.auth.models import User
from django.template import Context

from techresidents_web.common.forms import JSONField
from techresidents_web.common.models import ExpertiseType, Technology, TechnologyType
from techresidents_web.accounts.models import CodeType, Code, Skill
from techresidents_web.job.models import PositionType, PositionTypePref, TechnologyPref, Prefs


# Some field size constants for this form.
# These lengths are purposefully less than what is permitted at the db layer.
NAME_MAX_LEN = 30
EMAIL_MAX_LEN = 75
PASSWORD_MIN_LEN = 4
PASSWORD_MAX_LEN = 30
JSON_FIELD_MAX_LEN = 2048


class RegisterUserForm(forms.ModelForm):
    first_name = forms.CharField(label="First Name", max_length=NAME_MAX_LEN, required=True)
    last_name = forms.CharField(label="Last Name", max_length=NAME_MAX_LEN, required=True)
    username = forms.EmailField(label="Email", max_length=EMAIL_MAX_LEN, required=True)
    password = forms.CharField(label="Password", min_length=PASSWORD_MIN_LEN, max_length=PASSWORD_MAX_LEN, widget=forms.PasswordInput, required=True)
    password_confirmation  = forms.CharField(label="Re-enter password", min_length=PASSWORD_MIN_LEN,  max_length=PASSWORD_MAX_LEN, widget=forms.PasswordInput, required=True)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'username',)

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        super(RegisterUserForm, self).__init__(*args, **kwargs)
    
    def clean_username(self):
        username = self.cleaned_data['username']
        try:
            User.objects.get(username=username)
        except User.DoesNotExist:
            return username
        raise forms.ValidationError("Username already exists.")


    def clean(self):
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
        if commit:
            user.save()
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
        to = self.cleaned_data['username']

        text_content = text_template.render(context)
        html_content = html_template.render(context)
        msg = EmailMultiAlternatives(subject, text_content, from_email, [to])
        msg.attach_alternative(html_content, 'text/html')
        msg.send()

class RegistrationActivationForm(forms.Form):

    registration_code = forms.CharField(label="Registration Code", max_length=128, required=True)

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
            raise forms.ValidationError("Invalid registration code.")

        return registration_code

    def activate(self):
        if self.errors:
            raise ValueError("Unable to activate invalid registration activation form")
        
        registration_code = self.cleaned_data['registration_code']

        code = Code.objects.get(type__type='REGISTRATION', code=registration_code)

        if not code.used:
            code.used = datetime.datetime.now()
            code.save()

class LoginForm(forms.Form):
    username = forms.EmailField(label="Email", max_length=EMAIL_MAX_LEN, required=True)
    password = forms.CharField(label="Password", max_length=PASSWORD_MAX_LEN, widget=forms.PasswordInput, required=True)
    remember_me = forms.BooleanField(label="Remember me", widget=forms.CheckboxInput, required=False)

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        self.user = None
        super(LoginForm, self).__init__(*args, **kwargs)
    
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

class ForgotPasswordForm(forms.Form):
    username = forms.EmailField(label="Email", max_length=EMAIL_MAX_LEN, required=True)
    username_confirmation = forms.EmailField(label="Re-enter email", max_length=EMAIL_MAX_LEN, required=True)

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        super(ForgotPasswordForm, self).__init__(*args, **kwargs)

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

        code.used = datetime.datetime.now()
        code.save()

class ProfileAccountForm(forms.Form):
    years_experience_range = reversed(range(datetime.datetime.now().year - 50, datetime.datetime.now().year))
    years_experience_choices = [(year, year) for year in years_experience_range]
    years_experience_choices.insert(0,('', ''))  # insert blank default value

    first_name = forms.CharField(label="First Name", max_length=NAME_MAX_LEN, widget=forms.TextInput, required=True)
    last_name = forms.CharField(label="Last Name", max_length=NAME_MAX_LEN, widget=forms.TextInput, required=True)
    email_address = forms.EmailField(label="Email", max_length=EMAIL_MAX_LEN, widget=forms.TextInput, required=False)
    developer_since = forms.ChoiceField(label="Proud Developer Since", choices=years_experience_choices, required=False)

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        super(ProfileAccountForm, self).__init__(*args, **kwargs)

    def save(self, commit=True):
        user = self.request.user
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
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
    SALARY_MIN = 50000
    SALARY_MAX = 260000

    # Setup form fields
    # email_new_job_opps = JSONField(max_length=JSON_FIELD_MAX_LEN, widget=forms.HiddenInput, required=False)
    positions_form_data = JSONField(max_length=JSON_FIELD_MAX_LEN, widget=forms.HiddenInput, required=False)
    technologies_form_data = JSONField(max_length=JSON_FIELD_MAX_LEN, widget=forms.HiddenInput, required=False)

    def __init__(self, request=None, *args, **kwargs):
        self.user = request.user
        super(ProfileJobsForm, self).__init__(*args, **kwargs)

    def clean_positions_form_data(self):
        cleaned_positions_data = self.cleaned_data.get('positions_form_data')
        if cleaned_positions_data:

            valid_position_types = PositionType.objects.all()
            valid_position_type_ids = [p.id for p in valid_position_types]

            # Need to validate positionPrefID, if it has one, the positionTypeID, and minSalary
            for position in cleaned_positions_data:

                # Validate the PositionPrefID, if it has one
                # The PositionPrefID is validated via the save() method.
                # When save() is called this ID (if provided) will be used to update
                # the user's PositionPreferences.  If this update fails, an exception
                # will be thrown.  If the user is adding a new preference, then this
                # PositionPrefID will be generated when save() compeletes.

                # Validate the positionTypeID
                position_type_id = position['positionTypeId']
                if position_type_id:
                    if not position_type_id in valid_position_type_ids:
                        raise forms.ValidationError("PositionType id value is invalid")
                else:
                    raise forms.ValidationError("PositionType id field required")

                # Validate the minimum salary data
                position_min_salary = position['min_salary']
                if position_min_salary is not None:
                    if not type(position_min_salary == int):
                        min_salary = int(position_min_salary)
                    else:
                        min_salary = position_min_salary
                    if min_salary < self.SALARY_MIN or\
                       min_salary > self.SALARY_MAX:
                        raise forms.ValidationError("Position minimum salary value is invalid")
                else:
                    raise forms.ValidationError("Position minimum salary field required")

        return cleaned_positions_data

    def clean_technologies_form_data(self):
        cleaned_technologies_data = self.cleaned_data.get('technologies_form_data')
        return cleaned_technologies_data

    def save(self):
        # Making the assumption that form data is clean and valid (meaning that the position
        # data passed in from the user matches existing positions in the db).


        # Retrieve posted position data
        updated_position_prefs = self.cleaned_data.get('positions_form_data')
        updated_pref_ids = {p['id'] for p in updated_position_prefs if 'id' in p}

        # Before updating the user's position preferences, save the old prefs to check for prefs that may have been deleted
        previous_position_prefs = PositionTypePref.objects.filter(user=self.user)
        for previous_pref in previous_position_prefs:
            if not previous_pref.id in updated_pref_ids:
                 previous_pref.delete()

        # Update user's positions based on data posted
        for position in updated_position_prefs:
            if 'id' in position:
                rows_updated = PositionTypePref.objects.filter(user=self.user).update(
                    salary_start=position['min_salary']
                )
                if 1 != rows_updated:
                    pass
                    # TODO log error
            else:
                PositionTypePref(
                    user=self.user,
                    position_type_id=position['positionTypeId'],
                    salary_start=position['min_salary']
                ).save()


        # Retrieve posted technology pref data
        updated_technology_prefs = self.cleaned_data.get('technologies_form_data')
        updated_technology_pref_ids = {t['technologyId'] for t in updated_technology_prefs}

        # Before updating the user's technology preferences, save the old prefs to check for prefs that may have been deleted
        previous_technology_prefs = TechnologyPref.objects.filter(user=self.user).select_related('technology')
        for previous_pref in previous_technology_prefs:
            if not previous_pref.technology.id in updated_technology_pref_ids:
                previous_pref.delete()

        # Update user's technology prefs based on data posted
        for technology in updated_technology_prefs:
            try:
                technology = Technology.objects.get(id=technology['technologyId'])
                TechnologyPref.objects.get(user=self.user, technology=technology)
            except TechnologyPref.DoesNotExist:
                tech_pref = TechnologyPref(
                    user=self.user,
                    technology=technology
                ).save()

        # Update general job prefs
        #job_prefs, created = Prefs.objects.get_or_create(user=self.user)
        #job_prefs.email_new_job_opps=self.cleaned_data['email_new_job_opps']
        #job_prefs.save()

        return

class ProfileSkillsForm(forms.Form):
    skills_form_data = JSONField(max_length=2048, widget=forms.HiddenInput, required=True)

    # JSON keys
    JSON_SKILL_NAME = 'name'
    JSON_EXPERTISE = 'expertise'
    JSON_YRS_EXPERIENCE = 'yrs_experience'

    # numerical constants
    MAX_YRS_EXPERIENCE = 21 #This represents the 20+ yrs experience selection in the UI.
                            #TODO is this too coupled to value in the UI?

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

        # Perform two db queries up front to prevent calling into the
        # the db to validate each skill in the form data
        valid_technologies = Technology.objects.filter(type__name=self.technology_type_name)
        valid_technology_names = [t.name for t in valid_technologies]
        valid_expertise = ExpertiseType.objects.all()
        valid_expertise_names = [e.name for e in valid_expertise]

        for skill in cleaned_skills_data:
            # Verify we have a name attribute
            skill_name = skill[self.JSON_SKILL_NAME]
            if skill_name:
                # if we have a name attribute, verify that it's valid
                if not skill_name in valid_technology_names:
                    raise forms.ValidationError("Skill name value is invalid")
            else:
                raise forms.ValidationError("Skill name field required")

            # Verify we have an expertise level attribute
            skill_expertise = skill[self.JSON_EXPERTISE]
            if skill_expertise:
                # if we have an expertise attribute, verify that it's valid
                if not skill_expertise in valid_expertise_names:
                    raise forms.ValidationError("Skill expertise value is invalid")
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
                    expertise_type=ExpertiseType.objects.get(name='None'),
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
















