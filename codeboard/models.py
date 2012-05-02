from django.db import models

from techresidents_web.common.models import Resource

class Codeboard(models.Model):
    class Meta:
        db_table = "codeboard"
    name = models.CharField(max_length=1024)

class CodeboardResource(Resource):
    class Meta:
        db_table = "codeboard_resource"
    resource = models.OneToOneField(Resource, parent_link=True, primary_key=True)
    codeboard = models.ForeignKey(Codeboard)
