from django import forms

from techresidents_web.document.models import Document

class UploadForm(forms.ModelForm):
    class Meta:
        model = Document
    name = forms.CharField(max_length=255)
    path = forms.FileField(label="Select a file")
