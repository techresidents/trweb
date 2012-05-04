import os

from django import forms

from techresidents_web.document.models import Document, MimeType

class UploadForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = ('name', 'path')

    name = forms.CharField(max_length=255)
    path = forms.FileField(label="Select a file")
    
    def __init__(self, *args, **kwargs):
        super(UploadForm, self).__init__(*args, **kwargs)
        self.mime_type = None

    def clean_path(self, *args, **kwargs):
        cleaned_path = self.cleaned_data['path']
        basename, extension = os.path.splitext(cleaned_path.name)
        try:
            self.mime_type = MimeType.objects.filter(extension=extension).all()[0]
        except Exception:
            raise forms.ValidationError("unsupported file type")

        return cleaned_path

    def save(self, commit=True):
        document = super(UploadForm, self).save(commit=False)
        document.mime_type = self.mime_type
        if commit:
            document.save()
        return document
