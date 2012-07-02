import json
import re

from django import forms
from django.core.validators import validate_email

class JSONField(forms.CharField):
    def __init__(self, *args, **kwargs):
        super(JSONField, self).__init__(*args, **kwargs)
    
    def clean(self, value):
        value = super(JSONField, self).clean(value)
        try:
            json_data = json.loads(value)
        except Exception:
            raise forms.ValidateError("invalid json")

        return json_data


class EmailListField(forms.CharField):
    #Allowed iwhitespace characters (space, newline, tab, etc...) as well
    #as comma and semicolons as separators.
    SEPARATOR_RE = re.compile(r'[\s,;]+')
    
    widget = forms.Textarea

    def __init__(self, *args, **kwargs):
        super(EmailListField, self).__init__(*args, **kwargs)
    
    def clean(self, value):
        emails = []
        for email in EmailListField.SEPARATOR_RE.split(value):
            #Duplicate separators will result in a blank email.
            #So skip any blanks.
            if email:
                validate_email(email)
                emails.append(email)
        return emails

