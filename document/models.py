from django.db import models

from techresidents_web.common.models import MimeType

class Document(models.Model):
    class Meta:
        db_table = "document"
    name = models.CharField(max_length=1024)
    path = models.FileField(upload_to="docs", max_length=1024)
    mime_type = models.ForeignKey(MimeType)
