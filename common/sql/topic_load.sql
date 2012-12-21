-- Tutorial
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 140, NULL, 'Tutorial', 1, True, True, 1, 11, 'Quick chat to show you the ropes. You should complete this chat before moving on to any other chats. Note that this chat will not be made available to employers.');
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (1, 20, currval('topic_id_seq')-1, 'Subtopics', 1, True, True, 1, 11, 'This is a chat subtopic. Subtopics help guide your conversation. To proceed to the next subtopic click the Next button on the left. Note that the Next button will become enabled after 5 seconds have elapsed.'); 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (2, 20, currval('topic_id_seq')-2, 'Timer', 1, True, True, 1, 11, 'The timer on the left is here to help keep your conversation on track, and ensure that you have enough time to complete all subtopics. The timer is only an approximation, so it''s okay if you go a little bit under or over. But keep in mind that in order to keep things fair we will end your chat if you go more than 5 minutes over your total time.');
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (3, 20, currval('topic_id_seq')-3, 'Tags', 1, True, True, 1, 11, 'The Tag input below allows you to associate tags with a subtopic. Tags help employers get a feel for your conversation before they listen and make chats more searchable. Go ahead and add a tag now to try it out. Note that you can tag a chat with any term you''d like, the autocomplete is just a convenience.');
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (4, 20, currval('topic_id_seq')-4, 'Privacy', 1, True, True, 1, 11, 'To maintain your privacy, we will only share the anonymized audio from your chats with hiring companies. So there''s no need to worry about what to wear or hurting your future chances with an employer.');
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (5, 20, currval('topic_id_seq')-5, 'Tone', 1, True, True, 1, 11, 'Remember that this is not an interview, so please do not treat it like one. For the best results, chat like you''re speaking with a familiar colleague - conversational, yet professional, and never rehearsed.'); 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (6, 20, currval('topic_id_seq')-6, 'Requirements', 1, True, True, 1, 11, 'You can use any browser to chat, just make sure it''s the latest version. Additionally, you''ll need a webcam with a microphone. If you have a headset we also recommend that you use it. It will improve the audio quality, and help reduce the noise when chatting with a friend.');
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (7, 20, currval('topic_id_seq')-7, 'Feedback', 1, True, True, 1, 11, 'This concludes the tutorial chat. You''re now ready to move on to more interesting chats. But before you go, please feel free to leave us some feedback.');

-- Bio
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 120, NULL, 'Bio', 1, True, True, 1, 11, 'Developer bio. Recommended for all developers.');
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (1, 20, currval('topic_id_seq')-1, 'Languages', 1, True, True, 1, 11, 'What are your programming languages of choice?'); 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (2, 20, currval('topic_id_seq')-2, 'Tools', 1, True, True, 1, 11, 'What tools could you absolutely not live without?'); 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (3, 20, currval('topic_id_seq')-3, 'Must read', 1, True, True, 1, 11, 'What books should be on every developer''s reading list?'); 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (4, 20, currval('topic_id_seq')-4, 'Excitement', 1, True, True, 1, 11, 'What are you most excited about at the moment?'); 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (5, 20, currval('topic_id_seq')-5, 'Advice', 1, True, True, 1, 11, 'What advice, technical or otherwise, would you like to pass along to fellow developers?'); 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (6, 20, currval('topic_id_seq')-6, 'Most Recently', 1, True, True, 1, 11, 'Briefly describe a recent and memorable project that you''ve contributed to.'); 

--War Story
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 120, NULL, 'War Story', 1, True, True, 1, 11, 'Tell us your favorite war story about a memorable triumph over a trying bug or project.');

--Slown Process Speculation:
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 300, NULL, 'Slow Process Speculation', 1, True, True, 1, 11, 'A linux process is reportedly running slowly. Speculate on the potential causes of the slowness, and the steps you would take to prove or disprove each hypothesis. Creativity is encouraged.');

--Unicode for Grandmas
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 300, NULL, 'Unicode for Grandmas', 1, True, True, 1, 11, 'Explain unicode to an audience of grandmothers.');

--For or Against: ORM
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 300, NULL, 'For or Against: ORM', 1, True, True, 1, 11, 'Describe your stance on Object Relational Mapping (ORM) tools.');

--Protect the PII:
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 1200, NULL, 'Protect the PII', 2, True, True, 1, 11, 'Discuss the measures you would take to protect the Personally Identifiable Information (PII) needed for a web or mobile application.');
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (1, 300, currval('topic_id_seq')-1, 'External threats', 2, True, True, 1, 11, 'Discuss external threats to the PII data and possible mitigation strategies.'); 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (2, 300, currval('topic_id_seq')-2, 'Internal threats', 2, True, True, 1, 11, 'Discuss internal threats to the PII data and possible mitigation strategies.'); 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (3, 600, currval('topic_id_seq')-3, 'Request flow', 2, True, True, 1, 11, 'Discuss your final solution in terms of authorized user request for PII data flowing through your system.'); 

--Distributed Median
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 600, NULL, 'Distributed Median', 1, True, True, 1, 11, 'Discuss your solution for computing the median across a distributed system of c computers, each containing n random numbers. A good solution should address the case where both c and n are extremely large.');

--Web and Mobile Backend
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 600, NULL, 'Web & Mobile Backend', 1, True, True, 1, 11, 'Discuss your design for a backend architecture capable of supporting both a typical web and mobile application with similar functionality.');

--Save the Music
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 1200, NULL, 'Save the Music', 2, True, True, 1, 11, 'You''ve been hired by a large online streaming music service to save their catalog of music from illegal downloads. Discuss the measures you would take to save the music.');
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (1, 600, currval('topic_id_seq')-1, 'Online', 2, True, True, 1, 11, 'Discuss your solution for securing the music for web and mobile delivery over the internet.'); 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (2, 600, currval('topic_id_seq')-2, 'Offline', 2, True, True, 1, 11, 'In addition to internet delivery, your solution also needs to provide mobile users the ability to play music offline through a mobile app while they''re a paying customer. Discuss your design for securing the music for offline playback in a mobile app.'); 