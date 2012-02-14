import json

from django import forms

class JSONField(forms.CharField):

    def __init__(self, *args, **kwargs):
        super(JSONField, self).__init__(*args, **kwargs)
    
    def clean(self, value):
        value = super(JSONField, self).clean(value)
        try:
            json_data = json.loads(value)
        except Exception as error:
            raise forms.ValidateError("invalid json")

        return json_data
