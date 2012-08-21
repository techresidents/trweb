from django.db import models

from techresidents_web.common.models import Resource

class Whiteboard(models.Model):
    class Meta:
        db_table = "whiteboard"
    name = models.CharField(max_length=1024, unique=True)

class WhiteboardResource(Resource):
    class Meta:
        db_table = "whiteboard_resource"
    resource = models.OneToOneField(Resource, parent_link=True, primary_key=True)
    whiteboard = models.ForeignKey(Whiteboard)
