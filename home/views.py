from operator import itemgetter


from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.db.models import Count
from django.shortcuts import render_to_response
from django.template import RequestContext


from trpycore.encode.basic import basic_encode, basic_decode
from techresidents_web.accounts.models import Skill
from techresidents_web.common.models import Topic
from techresidents_web.job.models import PositionTypePref, TechnologyPref, LocationPref



class BaseUserAction(object):
    """Base user action class.

    This class is used to encapsulate
    all the data that is required to
    display a recommended action to
    the user.
    """
    def __init__(self, category=None, link=None):
        self.category = category
        self.link = link

class ChatUserAction(BaseUserAction):
    """ Chat user action.

    This class encapsulates all the data
    that is required to display a recommended
    action for the user to participate in a
    chat.
    """
    def __init__(self, chat_name=None, link=None):
        super(ChatUserAction, self).__init__(category="chat", link=link)
        self.chat_name = chat_name



def compute_recommended_actions(request, profile_completion_percentage, completed_topics_dict, incomplete_topics_dict):
    """Helper function to compute recommended
    next actions for the users.

    Returns a list of UserAction objects.
    """
    user_actions = []

    # Have user add info to their profile
    # if it's not 100% complete
    if profile_completion_percentage != 100:
        relative_link = reverse("accounts.views.profile_account")
        absolute_link = request.build_absolute_uri(relative_link)
        action = BaseUserAction(category='profile', link=absolute_link)
        user_actions.append(action)

    # Check to see if user completed the
    # Tutorial and Bio chats
    tutorial_title = 'Tutorial'
    tutorial_completed = False
    bio_title = '1 Minute Bio'
    bio_completed = False
    if tutorial_title in completed_topics_dict:
        tutorial_completed = True
    if bio_title in completed_topics_dict:
        bio_completed = True

    # Only recommend one of these chats to
    # complete, not both.
    if not tutorial_completed:
        tutorial_topic = incomplete_topics_dict[tutorial_title]
        relative_link = reverse("topic.views.details", args=[basic_encode(tutorial_topic.id)])
        absolute_link = request.build_absolute_uri(relative_link)
        action = ChatUserAction(chat_name=tutorial_topic.title, link=absolute_link)
        user_actions.append(action)

    elif not bio_completed:
        bio_topic = incomplete_topics_dict[bio_title]
        relative_link = reverse("topic.views.details", args=[basic_encode(bio_topic.id)])
        absolute_link = request.build_absolute_uri(relative_link)
        action = ChatUserAction(chat_name=bio_topic.title, link=absolute_link)
        user_actions.append(action)

    return user_actions


def compute_profile_completion(request):
    """ Helper function to compute what percentage
     of a user's profile has been completed.
    """
    profile_percent_complete = 0

    # 10% for basic user profile info
    user_profile = request.user.get_profile()
    if user_profile.developer_since is not None:
        profile_percent_complete += 10

    # 15% for each category of Skill (language, framework, peristence)
    # Query for all user's skills, group by technology type
    technology_type_counts = Skill.objects.\
        filter(user=request.user).\
        values('technology__type__name').\
        annotate(count=Count('technology__type__name'))
    # Place results of query into simpler data structure,
    # a map of {'technology_type' : 'count'}
    technology_type_count_map = {}
    for t in technology_type_counts:
        technology_type_count_map[t['technology__type__name']] = t['count']
    # Give user points for each type of technology type
    # they've listed their skills for.
    if len(technology_type_counts):
        for type in ['Language', 'Framework', 'Persistence']:
            if type in technology_type_count_map:
                profile_percent_complete += 15

    #15% for each job preference they've added
    position_prefs_count = PositionTypePref.objects.filter(user=request.user).count()
    if position_prefs_count > 0:
        profile_percent_complete += 15
    technology_prefs_count = TechnologyPref.objects.filter(user=request.user).count()
    if technology_prefs_count > 0:
        profile_percent_complete += 15
    location_prefs_count = LocationPref.objects.filter(user=request.user).count()
    if location_prefs_count > 0:
        profile_percent_complete += 15

    return profile_percent_complete



@login_required
def home(request):
    """ List all chat topics"""

    # Retrieve all topics user chatted about
    completed_topics = Topic.objects.\
        filter(chats__chat_sessions__users=request.user).\
        filter(chats__chat_sessions__end__isnull=False).\
        distinct("title").\
        all()

    topic_contexts = []
    completed_topics_dict = {}  # for fast lookup
    for topic in completed_topics:
        completed_topics_dict[topic.title] = topic
        topic_contexts.append({
            "encoded_topic_id": basic_encode(topic.id),
            "topic": topic,
            "completed": True
        })

    # Retrieve all root topics
    all_root_topics = Topic.objects.\
        filter(rank=0).\
        all()[:20]
        # limit number of objects we pull back to 20.
        # We currently don't have more than 20 chat topics.
        # This is just a safety net.

    incomplete_topics_dict = {} # for fast lookup
    for topic in all_root_topics:
        if topic.title not in completed_topics_dict:
            incomplete_topics_dict[topic.title] = topic
            topic_contexts.append({
                "encoded_topic_id": basic_encode(topic.id),
                "topic": topic,
                "completed": False
            })

    profile_completion_percentage = compute_profile_completion(request)
    recommended_actions = compute_recommended_actions(
        request,
        profile_completion_percentage,
        completed_topics_dict,
        incomplete_topics_dict
    )

    context = {
        "chat_topics": sorted(topic_contexts, key=lambda k: k['topic'].title),
        "full_name": request.user.get_full_name(),
        "profile_completed": profile_completion_percentage,
        "recommended_actions": recommended_actions
    }

    return render_to_response('home/home.html', context, context_instance=RequestContext(request))
