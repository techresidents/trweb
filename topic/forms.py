from django import forms

from common.forms import JSONField
from common.models import Topic

class TopicForm(forms.Form):
    topics = JSONField(max_length=2048, widget=forms.HiddenInput, required=True)

    def __init__(self, request, *args, **kwargs):
        self.request = request
        super(TopicForm, self).__init__(*args, **kwargs)

    def clean(self):
        super(TopicForm, self).clean()

        topics = self.cleaned_data.get("topics")

        if not topics or len(topics) < 2:
            raise forms.ValidationError("Invalid topic")

        root = topics[0]
        if not root["title"]:
            raise forms.ValidationError("Topic title field required")
        
        topic_map = { root["id"]: root }

        for topic in topics[1:]:
            if topic["parentId"] not in topic_map:
                raise forms.ValidationError("Topic parents must preceed children in adjacency list")

            if not topic["title"]:
                raise forms.ValidationError("Topic title field required")

        return self.cleaned_data

    def save(self, commit=True):
        if self.errors:
            raise ValueError("Unable to save invalid topic")

        result = []

        topics = self.cleaned_data.get("topics")
        
        root_topic = topics[0]

        root = Topic(
                id=root_topic["id"],
                title=root_topic["title"],
                description=root_topic["description"],
                rank=root_topic["rank"],
                user = self.request.user
                )
        

        topic_map = { root.id : root }
        result.append(root)

        for topic in topics[1:]:
            parent = topic_map[topic["parentId"]]
            model = Topic(
                    id=topic["id"],
                    title=topic["title"],
                    rank=topic["rank"],
                    description=root_topic["description"],
                    user = self.request.user
                    )

            model.parent = parent
            topic_map[model.id] = model
            result.append(model)
        
        if commit:
            print len(result)
            Topic.objects.create_topic_tree(self.request.user, result)
        
        return result
