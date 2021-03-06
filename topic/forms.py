from django import forms

from common.forms import JSONField
from common.models import Topic

class TopicForm(forms.Form):
    topics = JSONField(max_length=8192, widget=forms.HiddenInput, required=True)

    def __init__(self, request, *args, **kwargs):
        self.request = request
        super(TopicForm, self).__init__(*args, **kwargs)

    def clean(self):
        super(TopicForm, self).clean()

        topics = self.cleaned_data.get("topics")

        # Ensure we have a root topic:
        if not topics or len(topics) < 1:
            raise forms.ValidationError("Invalid topic")

        # Ensure root title exists
        root = topics[0]
        if not root["title"]:
            raise forms.ValidationError("Topic title field required")

        # Ensure root title is unique.
        # This constraint exists to make versioning topics
        # easier to maintain over time, as the topic heirarchies
        # will surely change over time based upon user feedback.
        # This is especially important in the case where a user
        # completed v1 of a topic, but not v2.
        root_topic_titles = {}
        all_root_topics = Topic.objects.filter(rank=0).all()
        for root_topic in all_root_topics:
            root_topic_titles[root_topic.title] = root_topic
        if root["title"] in root_topic_titles:
            raise forms.ValidationError("Root topic title must be unique")

        # Construct map of topic IDs to topic data
        topic_map = { root["id"]: root }
        for topic in topics[1:]:

            parent_topic_id = topic["parentId"]
            parent_topic = topic_map[parent_topic_id]

            if not topic["title"]:
                raise forms.ValidationError("Topic title field required")

            if parent_topic_id not in topic_map:
                raise forms.ValidationError("Topic parents must preceed children in adjacency list")

            if topic["level"] - parent_topic["level"] != 1:
                raise forms.ValidationError("The level of topic children must be exactly one level greater than their parent")

            # Need to ensure that any topics that are between parent & child have a level > parent
            parent_topic_level = parent_topic["level"]
            parent_topic_rank = parent_topic["rank"]
            topic_rank = topic["rank"]
            num_topics_between_parent_and_child = topic_rank - parent_topic_rank
            if num_topics_between_parent_and_child > 1:
                for t in topic_map.values():
                    rank = t["rank"]
                    if rank > parent_topic_rank and rank < topic_rank:
                        # Topic is between parent and child
                        if not t["level"] > parent_topic_level:
                            raise forms.ValidationError("Invalid parent-child hierarchy")

            topic_map[topic["id"]] = topic

        return self.cleaned_data

    def save(self, commit=True):
        if self.errors:
            raise ValueError("Unable to save invalid topic")

        result = []
        topics = self.cleaned_data.get("topics")

        # Create root Topic
        root_topic = topics[0]
        root = Topic(
                id=root_topic["id"],
                title=root_topic["title"],
                description=root_topic["description"],
                duration=root_topic["duration"],
                recommended_participants=root_topic["recommendedParticipants"],
                rank=root_topic["rank"],
                type_id = 1,      #TODO fix topic type hard code
                user = self.request.user
                )
        topic_map = { root.id : root }
        result.append(root)

        # Create sub Topics
        for topic in topics[1:]:
            parent = topic_map[topic["parentId"]]
            model = Topic(
                    id=topic["id"],
                    title=topic["title"],
                    rank=topic["rank"],
                    description=topic["description"],
                    duration=topic["duration"],
                    recommended_participants=topic["recommendedParticipants"],
                    type_id = 1,
                    user = self.request.user
                    )
            model.parent = parent
            topic_map[model.id] = model
            result.append(model)
        
        if commit:
            Topic.objects.create_topic_tree(self.request.user, result)

        return result
