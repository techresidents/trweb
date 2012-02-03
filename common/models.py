from django.db import models

class Topic(models.Model):
    class Meta:
        db_table = "topic"

    parent = models.ForeignKey("self", null=True)
    title = models.CharField(max_length=100)

class Tag(models.Model):
    class Meta:
        db_table = "tag"

    name = models.CharField(max_length=100, unique=True)
