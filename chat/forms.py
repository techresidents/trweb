from django import forms
from django.contrib.auth.models import User

class CreateChatForm(forms.Form):
    username = forms.EmailField(label="Email", max_length=30, required=True)

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        super(CreateChatForm, self).__init__(*args, **kwargs)

    def clean_username(self):
        username = self.cleaned_data["username"]
        try:
            User.objects.get(username=username)
            if self.request.user.username == username:
                raise forms.ValidationError("Cannot chat with yourself.")
            return username
        except User.DoesNotExist:
            raise forms.ValidationError("Username does not exist.")
