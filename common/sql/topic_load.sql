-- Bio (deprecated)
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (1, 0, 120, NULL, 'Bio', 1, True, False, 1, 1, 'Developer bio. Recommended for all developers.');
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (2, 1, 20, 1, 'Languages', 1, True, False, 1, 1, 'What are your programming languages of choice?'); 
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (3, 2, 20, 1, 'Tools', 1, True, False, 1, 1, 'What tools could you not live without?'); 
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (4, 3, 20, 1, 'Must read', 1, True, False, 1, 1, 'What books should be on every developer''s reading list?'); 
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (5, 4, 20, 1, 'Excitement', 1, True, False, 1, 1, 'What are you most excited about at the moment?'); 
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (6, 5, 20, 1, 'Advice', 1, True, False, 1, 1, 'What advice, technical or otherwise, would you like to pass along to fellow developers?'); 
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (7, 6, 20, 1, 'Most Recently', 1, True, False, 1, 1, 'What have you been working on recently?'); 

--War Story: Bug
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (8, 0, 120, NULL, 'War Story: Bug', 1, True, True, 1, 1, 'Tell us your favorite war story about a memorable triumph over a trying bug.');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(8, (select id from tag where name = 'General'));

--War Story: Project
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (9, 0, 120, NULL, 'War Story: Project', 1, True, True, 1, 1, 'Tell us your favorite war story about a memorable triumph over a trying project.');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(9, (select id from tag where name = 'General'));

--Slown Process Speculation:
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (10, 0, 300, NULL, 'Slow Process Speculation', 1, True, True, 1, 1, 'A linux process is reportedly running slowly. Speculate on the potential causes of the slowness, and the steps you would take to prove or disprove each theory. Creativity is encouraged.');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(10, (select id from tag where name = 'Back-end'));

--Unicode for Grandmas
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (11, 0, 300, NULL, 'Unicode for Grandmas', 1, True, True, 1, 1, 'Unicode is frequently misunderstood. Think you can explain unicode to an audience of grandmothers?');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(11, (select id from tag where name = 'General'));

--For or Against: ORM
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (12, 0, 300, NULL, 'For or Against: ORM', 1, True, True, 1, 1, 'Describe your stance on Object Relational Mapping (ORM) tools.');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(12, (select id from tag where name = 'Back-end'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(12, (select id from tag where name = 'Database'));

--Protect the PII:
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (13, 0, 420, NULL, 'Protect the PII', 2, True, True, 1, 1, 'Discuss the measures you would take to protect the Personally Identifiable Information (PII) needed for a web or mobile application.');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(13, (select id from tag where name = 'Back-end'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(13, (select id from tag where name = 'Security'));

--The Distributed Median
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (14, 0, 420, NULL, 'The Distributed Median', 1, True, True, 1, 1, 'Discuss your solution for computing the median across a distributed system of c computers, each containing n random numbers. A good solution should address the case where both c and n are extremely large.');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(14, (select id from tag where name = 'Back-end'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(14, (select id from tag where name = 'Distributed System'));

--Web and Mobile Backend
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (15, 0, 420, NULL, 'Web & Mobile Backend', 1, True, True, 1, 1, 'Discuss your design for a backend architecture capable of supporting web and mobile clients with similar functionality.');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(15, (select id from tag where name = 'Back-end'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(15, (select id from tag where name = 'Mobile'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(15, (select id from tag where name = 'Web'));

--Save the Music
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (16, 0, 420, NULL, 'Save the Music', 2, True, True, 1, 1, 'You''ve been hired by a large online streaming music service to save their catalog of music from illegal downloads. Discuss the measures you would take to save the music.');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(16, (select id from tag where name = 'Back-end'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(16, (select id from tag where name = 'Security'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(16, (select id from tag where name = 'Mobile'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(16, (select id from tag where name = 'Web'));

-- Bio
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (17, 0, 120, NULL, 'Bio', 1, True, True, 1, 1, 'It''s your bio. Talk about whatever you want: a recent project, your ideal stack, dream job, whatever... just don''t introduce yourself by name. We can''t maintain your privacy if you go around dropping your own name.');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(17, (select id from tag where name = 'General'));

-- Can't Live Without: Tool 
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (18, 0, 120, NULL, 'Can''t Live Without: Tools', 1, True, True, 1, 1, 'What tools could you absolutely not live without?');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(18, (select id from tag where name = 'General'));

-- Help a Developer Out
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (19, 0, 120, NULL, 'Help a Developer Out', 1, True, True, 1, 1, 'What advice, technical or otherwise, would you like to pass along to fellow developers?');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(19, (select id from tag where name = 'General'));

-- Must Read
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (20, 0, 120, NULL, 'Must Read', 1, True, True, 1, 1, 'What books should be on every developer''s reading list?');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(20, (select id from tag where name = 'General'));

-- Most Recently
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (21, 0, 120, NULL, 'Most Recently', 1, True, True, 1, 1, 'What have you been working on recently?');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(21, (select id from tag where name = 'General'));

-- Disaster Recovery Site
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (22, 0, 300, NULL, 'Disaster Recovery Site', 1, True, True, 1, 1, 'In the event of a disaster it may not be possible to maintain availability for your full-featured web application. In these scenarios it is still often possible to run a minimal disaster recovery site.  How might you implement such as website?');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(22, (select id from tag where name = 'Back-end'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(22, (select id from tag where name = 'Web'));

-- Protect your Passwords
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (23, 0, 180, NULL, 'Protect your Passwords', 1, True, True, 1, 1, 'It seems like we can''t make it more than a few weeks without hearing about yet another well known company insecurely storing user passwords. Describe the steps you would take to properly protect user passwords.');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(23, (select id from tag where name = 'Back-end'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(23, (select id from tag where name = 'Security'));

-- For or Against: MVC, MVP, MVVM, MV*
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (24, 0, 300, NULL, 'For or Against: MVC, MVP, MVVM, MV*', 1, True, True, 1, 1, 'Describe your stance on MV* design patterns. Which, if any, do you prefer?');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(24, (select id from tag where name = 'Front-end'));

-- Optimizing Web App Load Time
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (25, 0, 300, NULL, 'Optimizing Web App Load Time', 1, True, True, 1, 1, 'Discuss the steps you would take to optimize the load time of a modern web application.');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(25, (select id from tag where name = 'Front-end'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(25, (select id from tag where name = 'Web'));

-- Something you've Hacked
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (26, 0, 300, NULL, 'Something you''ve Hacked', 1, True, True, 1, 1, 'Tell us about something you''ve hacked.');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(26, (select id from tag where name = 'General'));

-- Concurrent Database Writes
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (27, 0, 300, NULL, 'Concurrent Database Writes', 1, True, True, 1, 1, 'Imagine a simple multi-user web or mobile application backed by a single database table. How can we deal with multile users updating the same database record at the same time?');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(27, (select id from tag where name = 'Back-end'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(27, (select id from tag where name = 'Database'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(27, (select id from tag where name = 'Mobile'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(27, (select id from tag where name = 'Web'));

-- For or Against: Cookies as Session Stores
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (28, 0, 300, NULL, 'For or Against: Cookies as Session Stores', 1, True, True, 1, 1, 'Describe your stance on using cookies to store session data.');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(28, (select id from tag where name = 'Back-end'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(28, (select id from tag where name = 'Web'));

-- Design Patterns in the Wild
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (29, 0, 300, NULL, 'Design Patterns in the Wild', 1, True, True, 1, 1, 'Describe how a design pattern helped you solve a a real-world problem.');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(29, (select id from tag where name = 'OOP'));

-- Can't Live Without: Design Pattern
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (30, 0, 180, NULL, 'Can''t Live Without: Design Pattern', 1, True, True, 1, 1, 'What design pattern could you not live without?');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(30, (select id from tag where name = 'OOP'));

-- Take me to your Leader
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (31, 0, 300, NULL, 'Take me to your Leader', 1, True, True, 1, 1, 'How would you elect a leader in a distributed system and make it known to all nodes in the system?');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(31, (select id from tag where name = 'Back-end'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(31, (select id from tag where name = 'Distributed System'));

-- Help a Developer Out: CAP Theorem
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (32, 0, 300, NULL, 'Help a Developer Out: CAP Theorem', 1, True, True, 1, 1, 'There''s quite a bit of confusion around the CAP Theorem. Help a developer out?');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(32, (select id from tag where name = 'Back-end'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(32, (select id from tag where name = 'Distributed System'));

-- Distributed Configurations
INSERT INTO topic (id, rank, duration, parent_id, title, recommended_participants, public, active, type_id, user_id, description) VALUES (33, 0, 300, NULL, 'Distributed Configurations', 1, True, True, 1, 1, 'How would you manage dynamic configuration data for a distributed system? How would configuration changes be propagated to running nodes?');
INSERT INTO topic_tag (topic_id, tag_id) VALUES(33, (select id from tag where name = 'Back-end'));
INSERT INTO topic_tag (topic_id, tag_id) VALUES(33, (select id from tag where name = 'Distributed System'));

SELECT setval('topic_id_seq', (SELECT max(id) FROM topic));
