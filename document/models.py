from django.db import models

from techresidents_web.common.models import MimeType, Resource

class Document(models.Model):
    class Meta:
        db_table = "document"
    name = models.CharField(max_length=1024)
    path = models.FileField(upload_to="docs", max_length=1024)
    mime_type = models.ForeignKey(MimeType)

class DocumentResource(Resource):
    class Meta:
        db_table = "document_resource"
    resource = models.OneToOneField(Resource, parent_link=True, primary_key=True)
    document = models.ForeignKey(Document)
