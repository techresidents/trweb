from django.db import models
from django.contrib.auth.models import User

from techresidents_web.common.managers import TreeManager

class TopicManager(TreeManager):
    def topic_tree(self, topic_id):
        return self.tree_by_rank(topic_id)

    def create_topic_tree(self, user, topics):
        return self.create_tree(topics)


class Concept(models.Model):
    """Concept model."""
    class Meta:
        db_table = "concept"
    
    #Self referential concept hierarchy, root 's parent id must be null
    parent = models.ForeignKey("self", null=True)   
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=1024)

    objects = TreeManager()

class ResourceType(models.Model):
    class Meta:
        db_table = "resource_type"
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=1024)

class Resource(models.Model):
    class Meta:
        db_table = "resource"
    type = models.ForeignKey(ResourceType)


class TopicType(models.Model):
    class Meta:
        db_table = "topic_type"
    
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=1024)

class Topic(models.Model):
    """Topic model.

    Topics are hierarchical and this is represented with a parent
    child relationship. To support the recursive queries for the Topic,
    this model uses the TopicManager model manager.

    """
    class Meta:
        db_table = "topic"
    
    #Self referential topic hierarchy where root's parent must be null
    parent = models.ForeignKey("self", null=True)
    rank = models.IntegerField()
    type = models.ForeignKey(TopicType)
    title = models.CharField(max_length=100)
    description = models.CharField(max_length=2048, blank=True)
    duration = models.IntegerField()
    public = models.BooleanField(default=True)
    user = models.ForeignKey(User)
    resources = models.ManyToManyField(Resource)

    objects = TopicManager()

class Tag(models.Model):
    class Meta:
        db_table = "tag"

    name = models.CharField(max_length=100, unique=True)
    concept = models.ForeignKey(Concept)

class TechnologyType(models.Model):
    """Represents a technology type such as framework, programming language, etc"""
    class Meta:
        db_table = "technology_type"

    name = models.CharField(max_length=100)
    description = models.CharField(max_length=1024)

class Technology(models.Model):
    """Represents a technology such as a specific framework such as Django or Rails"""
    class Meta:
        db_table = "technology"

    name = models.CharField(max_length=100)
    type = models.ForeignKey(TechnologyType)
    description = models.CharField(max_length=1024, blank=True)

class ExpertiseType(models.Model):
    """Represents an expertise level typically associated with a skill"""
    class Meta:
        db_table = "expertise_type"

    name = models.CharField(max_length=100)
    value = models.IntegerField()
    description = models.CharField(max_length=1024)

class Location(models.Model):
    """Represents a user's target job location"""
    class Meta:
        db_table = "location"

    country = models.CharField(max_length=100)
    zip = models.CharField(max_length=50, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    county = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()

class Organization(models.Model):
    """Represents an organization such as RSA or Bloomberg"""
    class Meta:
        db_table = "organization"

    name = models.CharField(max_length=100)
    description = models.CharField(max_length=1024)

class Quality(models.Model):
    """Quality model"""
    class Meta:
        db_table = "quality"

    name = models.CharField(max_length=100)
    description = models.CharField(max_length=1024)

