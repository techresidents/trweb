from django.db import models
from django.contrib.auth.models import User

class ResourceType(models.Model):
    class Meta:
        db_table = "resource_type"
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=1024)

class Resource(models.Model):
    class Meta:
        db_table = "resource"
    type = models.ForeignKey(ResourceType)

class TopicManager(models.Manager):

    def topic_tree(self, topic_id):
        topics = self.raw("""with recursive q as 
                            ( select t.*, 1 as level from topic t where id = %s
                              union all
                              select tc.*, level + 1 from q
                              join topic tc on tc.parent_id = q.id
                            )
                            select * from q order by rank
                          """, [topic_id])
        return topics

    def create_topic_tree(self, user, topics):

        if not topics or len(topics) < 2:
            raise ValueError("topic tree must have at least two items")

        root = topics[0]

        if root.parent or root.parent_id:
            raise ValueError("root parent and parent_id must be None")
        
        # Save the root topic first
        root.id = None
        root.save()

        # Map to store all topics that have been sent to the database
        # and now have a proper id that can be used in child topics
        topic_map = { root.id: root }
        
        # Loop through each child topic
        # 1) Replace parent_id with db id from topic_map
        # 2) Save topic to db and add it topic map
        # Note this could be optimized to do a single insert for all
        # topics at the same level.

        for topic in topics[1:]:
            parent_id = topic.parent.id
            
            # Parents must come before children in adjacency list
            # If we have not seen the parent yet raise an execption.
            if parent_id not in topic_map:
                raise ValueError("parent must exist prior to child in adjacency list")
            
            # Django will not automatically update the parent_id 
            # when the attachend parent.id is updated, so do it.
            topic.parent_id = parent_id
            topic.id = None
            topic.save()

            topic_map[topic.id] = topic
    
    def update_topic_tree(self, user, topics):
        pass

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

class TopicResource(models.Model):
    class Meta:
        db_table = "topic_resource"
    topic = models.ForeignKey(Topic)
    resource = models.ForeignKey(Resource)


class Tag(models.Model):
    class Meta:
        db_table = "tag"

    name = models.CharField(max_length=100, unique=True)

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
    is_profile_default = models.BooleanField(default=False)
    #is_profile_default is a flag to indicate if this technology should show up in the default list of technologies
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
    state = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    zip = models.CharField(max_length=25)
    county = models.CharField(max_length=100)
    #TODO add longitude and latitude.  Research how best to store this data within the db.

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
