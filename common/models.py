from django.db import models
from django.contrib.auth.models import User

class TopicManager(models.Manager):

    def topic_tree(self, topic_id):
        topics = self.raw("""with recursive q as 
                            ( select id, parent_id, title, description, rank, user_id from topic where id = %s
                              union all
                              select t.id, t.parent_id, t.title, t.description, t.rank, t.user_id from q
                              join topic t on t.parent_id = q.id
                            )
                            select * from q order by rank
                          """, [topic_id])
        return topics

    def create_topic_tree(self, user, topics):

        if not topics or len(topics) < 2:
            raise ValueError("topic tree must have at least two items")

        root = topics.pop(0)

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

        for topic in topics:
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

class Topic(models.Model):
    class Meta:
        db_table = "topic"

    parent = models.ForeignKey("self", null=True)
    title = models.CharField(max_length=100)
    description = models.CharField(max_length=2048, null=True)
    rank = models.IntegerField()
    user = models.ForeignKey(User)
    objects = TopicManager()

class Tag(models.Model):
    class Meta:
        db_table = "tag"

    name = models.CharField(max_length=100, unique=True)
