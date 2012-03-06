import uuid
from datetime import datetime

from django.core.exceptions import ObjectDoesNotExist
from django import forms
from django.contrib import auth
from django.contrib.auth.models import User

import models

class RegisterUserForm(forms.ModelForm):
    first_name = forms.CharField(label="First Name", max_length=30, required=True)
    last_name = forms.CharField(label="Last Name", max_length=30, required=True)
    username = forms.EmailField(label="Email", max_length=30, required=True)
    password = forms.CharField(label="Password", max_length=75, widget=forms.PasswordInput, required=True)
    password_confirmation  = forms.CharField(label="Re-enter password", max_length=75, widget=forms.PasswordInput, required=True)

    class Meta:
        model = User
        fields = ("first_name", "last_name", "username",)
    
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

class RegisterUserProfileForm(forms.ModelForm):

    class Meta:
        model = models.UserProfile
        exclude = ("user",)
    
    def save(self, commit=True):
        user_profile = super(RegisterUserProfileForm, self).save(commit=False)
        if commit:
            user_profile.save()
        return user_profile


class LoginForm(forms.Form):
    username = forms.EmailField(label="Email", max_length=30, required=True)
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
    username = forms.EmailField(label="Email", max_length=30, required=True)
    username_confirmation = forms.EmailField(label="Re-enter email", max_length=30, required=True)

    def clean(self):
        if "username" in self.cleaned_data and "username_confirmation" in self.cleaned_data:
            username = self.cleaned_data["username"]
            username_confirmation = self.cleaned_data["username_confirmation"]
            if username != username_confirmation:
                raise forms.ValidationError("Email addresses do not match.")
        return self.cleaned_data
    
    def send_email(self, reset_password_code=None):
        if self.errors:
            raise ValueError("Unable to send email for invalid forgot password form")
        
        try:
            user = User.objects.get(username=self.cleaned_data["username"])
            code_type = models.CodeType.objects.get(type="RESET_PASSWORD")
            reset_password_code = reset_password_code or uuid.uuid4().hex
            models.Code.objects.create(user=user, type=code_type, code=reset_password_code)

        except ObjectDoesNotExist:
            pass

class ResetPasswordForm(forms.Form):
    password = forms.CharField(label="Password", max_length=75, widget=forms.PasswordInput, required=True)
    password_confirmation = forms.CharField(label="Re-enter password", max_length=75, widget=forms.PasswordInput, required=True)

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
