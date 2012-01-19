from django import forms
from django.contrib import auth
from django.contrib.auth.models import User

import models

class RegisterUserForm(forms.ModelForm):
    username = forms.EmailField(label="Email", max_length=30, required=True)
    password = forms.CharField(label="Password", widget=forms.PasswordInput, required=True)
    password_confirmation  = forms.CharField(label="Password confirmation", widget=forms.PasswordInput, required=True)

    class Meta:
        model = User
        fields = ("username",)
    
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
    password = forms.CharField(label="Password", max_length=30, widget=forms.PasswordInput, required=True)
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
