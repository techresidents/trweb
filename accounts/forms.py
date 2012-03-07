import uuid
from datetime import datetime

from django import forms
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import EmailMultiAlternatives
from django.core.urlresolvers import reverse
from django.contrib import auth
from django.contrib.auth.models import User
from django.template import Context

import models

class RegisterUserForm(forms.ModelForm):
    first_name = forms.CharField(label="First Name", max_length=30, required=True)
    last_name = forms.CharField(label="Last Name", max_length=30, required=True)
    username = forms.EmailField(label="Email", max_length=75, required=True)
    password = forms.CharField(label="Password", min_length=4, max_length=75, widget=forms.PasswordInput, required=True)
    password_confirmation  = forms.CharField(label="Re-enter password", min_length=4,  max_length=75, widget=forms.PasswordInput, required=True)

    class Meta:
        model = User
        fields = ("first_name", "last_name", "username",)

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        super(RegisterUserForm, self).__init__(*args, **kwargs)
    
    def clean_username(self):
        username = self.cleaned_data["username"]
        try:
            User.objects.get(username=username)
        except User.DoesNotExist:
            return username
        raise forms.ValidationError("Username already exists.")


    def clean(self):
        if "password" in self.cleaned_data and "password_confirmation" in self.cleaned_data:
            password = self.cleaned_data["password"]
            password_confirmation = self.cleaned_data["password_confirmation"]
            if password != password_confirmation:
                raise forms.ValidationError("Passwords do not match.")
        return self.cleaned_data
    
    def save(self, commit=True):
        user = super(RegisterUserForm, self).save(commit=False)
        user.email = self.cleaned_data["username"]
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user

    def create_registration_code(self, registration_code=None):
        if self.errors:
            raise ValueError("Unable to create registration code for invalid register form")

        user = User.objects.get(username=self.cleaned_data["username"])
        code_type = models.CodeType.objects.get(type="REGISTRATION")
        registration_code = registration_code or uuid.uuid4().hex
        models.Code.objects.create(user=user, type=code_type, code=registration_code)

        return registration_code

    def get_activation_url(self, registration_code):
        url = self.request.build_absolute_uri(reverse("accounts.views.register_activate", args=[registration_code]))
        return url

    
    def send_activation_email(self, subject, text_template, html_template, from_email=None, context = None, registration_code=None):
        if self.errors:
            raise ValueError("Unable to send email for invalid registration form")
        
        registration_code = registration_code or self.create_registration_code()

        context = context or Context()
        context["activation_url"] = self.get_activation_url(registration_code)
        to = self.cleaned_data["username"]

        text_content = text_template.render(context)
        html_content = html_template.render(context)
        msg = EmailMultiAlternatives(subject, text_content, from_email, [to])
        msg.attach_alternative(html_content, "text/html")
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
            registration_code = self.cleaned_data["registration_code"]

            if self.allow_reactivation:
                models.Code.objects.get(type__type="REGISTRATION", code=registration_code)
            else:
                models.Code.objects.get(type__type="REGISTRATION", code=registration_code, used=None)

        except ObjectDoesNotExist:
            raise forms.ValidationError("Invalid registration code.")

        return registration_code

    def activate(self):
        if self.errors:
            raise ValueError("Unable to activate invalid registration activation form")
        
        registration_code = self.cleaned_data["registration_code"]

        code = models.Code.objects.get(type__type="REGISTRATION", code=registration_code)

        if not code.used:
            code.used = datetime.now()
            code.save()


class LoginForm(forms.Form):
    username = forms.EmailField(label="Email", max_length=75, required=True)
    password = forms.CharField(label="Password", max_length=75, widget=forms.PasswordInput, required=True)
    remember_me = forms.BooleanField(label="Remember me", widget=forms.CheckboxInput, required=False)

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        self.user = None
        super(LoginForm, self).__init__(*args, **kwargs)
    
    def clean(self):
        username = self.cleaned_data.get("username")
        password = self.cleaned_data.get("password")

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
    username = forms.EmailField(label="Email", max_length=75, required=True)
    username_confirmation = forms.EmailField(label="Re-enter email", max_length=75, required=True)

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        super(ForgotPasswordForm, self).__init__(*args, **kwargs)

    def clean(self):
        if "username" in self.cleaned_data and "username_confirmation" in self.cleaned_data:
            username = self.cleaned_data["username"]
            username_confirmation = self.cleaned_data["username_confirmation"]
            if username != username_confirmation:
                raise forms.ValidationError("Email addresses do not match.")
        return self.cleaned_data

    def create_reset_password_code(self):
        if self.errors:
            raise ValueError("Unable to create reset password code for invalid forgot password form")
        
        reset_password_code = None

        try:
            user = User.objects.get(username=self.cleaned_data["username"])
            code_type = models.CodeType.objects.get(type="RESET_PASSWORD")
            reset_password_code = reset_password_code or uuid.uuid4().hex
            models.Code.objects.create(user=user, type=code_type, code=reset_password_code)

        except ObjectDoesNotExist:
            pass

        return reset_password_code

    def get_reset_password_url(self, reset_password_code):
        url = self.request.build_absolute_uri(reverse("accounts.views.reset_password", args=[reset_password_code]))
        return url.replace("http:", "https:")

    
    def send_email(self, subject, text_template, html_template, from_email=None, context = None, reset_password_code=None):
        if self.errors:
            raise ValueError("Unable to send email for invalid forgot password form")
        
        reset_password_code = reset_password_code or self.create_reset_password_code()

        if reset_password_code:
            context = context or Context()
            context["reset_password_url"] = self.get_reset_password_url(reset_password_code)
            to = self.cleaned_data["username"]

            text_content = text_template.render(context)
            html_content = html_template.render(context)
            msg = EmailMultiAlternatives(subject, text_content, from_email, [to])
            msg.attach_alternative(html_content, "text/html")
            msg.send()


class ResetPasswordForm(forms.Form):
    password = forms.CharField(label="Password", min_length=4, max_length=75, widget=forms.PasswordInput, required=True)
    password_confirmation = forms.CharField(label="Re-enter password", min_length=4, max_length=75, widget=forms.PasswordInput, required=True)

    def __init__(self, reset_password_code, *args, **kwargs):
        self.reset_password_code = reset_password_code
        super(ResetPasswordForm, self).__init__(*args, **kwargs)

    def clean(self):
        if "password" in self.cleaned_data and "password_confirmation" in self.cleaned_data:
            password = self.cleaned_data["password"]
            password_confirmation = self.cleaned_data["password_confirmation"]
            if password != password_confirmation:
                raise forms.ValidationError("Passwords do not match.")
        
        #Validate the reset password code
        #If the code is not found in the database raise an exception
        try:
            models.Code.objects.get(type__type="RESET_PASSWORD", code=self.reset_password_code, used=None)
        except ObjectDoesNotExist:
            raise forms.ValidationError("Invalid reset password code.")
        return self.cleaned_data

    def reset_password(self):
        if self.errors:
            raise ValueError("Unable to reset password for invalid reset password form")

        code = models.Code.objects.get(type__type="RESET_PASSWORD", code=self.reset_password_code, used=None)
        code.user.set_password(self.cleaned_data["password"])
        code.user.save()

        code.used = datetime.now()
        code.save()
