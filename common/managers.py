from django.db import models

class TreeManager(models.Manager):

    def tree(self, parent_id):
        table_name = self.model._meta.db_table
        
        query = """with recursive q as 
                 ( select t.*, 1 as level from {0} t where id = %s
                   union all
                   select tc.*, level + 1 from q
                   join {0} tc on tc.parent_id = q.id
                 )
                 select * from q order by level
                """.format(table_name)

        results = self.raw(query, [parent_id])
        return results

    def tree_by_rank(self, parent_id):
        table_name = self.model._meta.db_table
        
        query = """with recursive q as 
                 ( select t.*, 1 as level from {0} t where id = %s
                   union all
                   select tc.*, level + 1 from q
                   join {0} tc on tc.parent_id = q.id
                 )
                 select * from q order by rank
                """.format(table_name)

        results = self.raw(query, [parent_id])
        return results

    def create_tree(self, values):

        if not values or len(values) < 1:
            raise ValueError("tree must have at least one item")

        root = values[0]

        if root.parent or root.parent_id:
            raise ValueError("root parent and parent_id must be None")
        
        # Save the root topic first
        root.id = None
        root.save()

        # Map to store all topics that have been sent to the database
        # and now have a proper id that can be used in child topics
        value_map = { root.id: root }
        
        # Loop through each child topic
        # 1) Replace parent_id with db id from topic_map
        # 2) Save topic to db and add it topic map
        # Note this could be optimized to do a single insert for all
        # topics at the same level.

        for value in values[1:]:
            parent_id = value.parent.id
            
            # Parents must come before children in adjacency list
            # If we have not seen the parent yet raise an execption.
            if parent_id not in value_map:
                raise ValueError("parent must exist prior to child in adjacency list")
            
            # Django will not automatically update the parent_id 
            # when the attachend parent.id is updated, so do it.
            value.parent_id = parent_id
            value.id = None
            value.save()

            value_map[value.id] = value
