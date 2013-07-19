-- Bio (deprecated)
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 120, NULL, 'Bio', 1, True, False, 1, 1, 'Developer bio. Recommended for all developers.');
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (1, 20, currval('topic_id_seq')-1, 'Languages', 1, True, False, 1, 1, 'What are your programming languages of choice?'); 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (2, 20, currval('topic_id_seq')-2, 'Tools', 1, True, False, 1, 1, 'What tools could you not live without?'); 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (3, 20, currval('topic_id_seq')-3, 'Must read', 1, True, False, 1, 1, 'What books should be on every developer''s reading list?'); 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (4, 20, currval('topic_id_seq')-4, 'Excitement', 1, True, False, 1, 1, 'What are you most excited about at the moment?'); 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (5, 20, currval('topic_id_seq')-5, 'Advice', 1, True, False, 1, 1, 'What advice, technical or otherwise, would you like to pass along to fellow developers?'); 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (6, 20, currval('topic_id_seq')-6, 'Most Recently', 1, True, False, 1, 1, 'What have you been working on recently?'); 

--War Story: Bug
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 120, NULL, 'War Story: Bug', 1, True, True, 1, 1, 'Tell us your favorite war story about a memorable triumph over a trying bug.');

--War Story: Project
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 120, NULL, 'War Story: Project', 1, True, True, 1, 1, 'Tell us your favorite war story about a memorable triumph over a trying project.');

--Slown Process Speculation:
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 300, NULL, 'Slow Process Speculation', 1, True, True, 1, 1, 'A linux process is reportedly running slowly. Speculate on the potential causes of the slowness, and the steps you would take to prove or disprove each theory. Creativity is encouraged.');

--Unicode for Grandmas
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 300, NULL, 'Unicode for Grandmas', 1, True, True, 1, 1, 'Unicode is frequently misunderstood. Think you can explain unicode to an audience of grandmothers?');

--For or Against: ORM
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 300, NULL, 'For or Against: ORM', 1, True, True, 1, 1, 'Describe your stance on Object Relational Mapping (ORM) tools.');

--Protect the PII:
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 420, NULL, 'Protect the PII', 2, True, True, 1, 1, 'Discuss the measures you would take to protect the Personally Identifiable Information (PII) needed for a web or mobile application.');

--The Distributed Median
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 420, NULL, 'The Distributed Median', 1, True, True, 1, 1, 'Discuss your solution for computing the median across a distributed system of c computers, each containing n random numbers. A good solution should address the case where both c and n are extremely large.');

--Web and Mobile Backend
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 420, NULL, 'Web & Mobile Backend', 1, True, True, 1, 1, 'Discuss your design for a backend architecture capable of supporting web and mobile clients with similar functionality.');

--Save the Music
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 420, NULL, 'Save the Music', 2, True, True, 1, 1, 'You''ve been hired by a large online streaming music service to save their catalog of music from illegal downloads. Discuss the measures you would take to save the music.');

-- Bio
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 120, NULL, 'Bio', 1, True, True, 1, 1, 'It''s your bio. Talk about whatever you want: a recent project, your ideal stack, dream job, whatever... just don''t introduce yourself by name. We can''t maintain your privacy if you go around dropping your own name.');

-- Can't Live Without: Tool 
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 120, NULL, 'Can''t Live Without: Tools', 1, True, True, 1, 1, 'What tools could you absolutely not live without?');

-- Help a Developer Out
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 120, NULL, 'Help a Developer Out', 1, True, True, 1, 1, 'What advice, technical or otherwise, would you like to pass along to fellow developers?');

-- Must Read
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 120, NULL, 'Must Read', 1, True, True, 1, 1, 'What books should be on every developer''s reading list?');

-- Most Recently
INSERT INTO topic (rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (0, 120, NULL, 'Most Recently', 1, True, True, 1, 1, 'What have you been working on recently?');
