
'''
CREATE TEMP TABLE questions_answers AS
SELECT answers.id, answers.creationDate, answers.ownerUserId, questions.tags
FROM Posts answers, Posts questions
WHERE answers.postTypeId = 2 AND questions.postTypeId = 1 AND answers.parentId = questions.id
UNION ALL
SELECT questions.id, questions.creationDate, questions.ownerUserId, questions.tags
FROM Posts questions
WHERE questions.postTypeId = 1
'''


CREATE TEMP TABLE questions_answers AS
SELECT DATE_PART('YEAR', creationDate) "year", DATE_PART('Month', creationDate) "month", ownerUserId, id, tags
FROM (
	SELECT answers.id, answers.creationDate, answers.ownerUserId, questions.tags
	FROM Posts answers, Posts questions
	WHERE answers.postTypeId = 2 AND questions.postTypeId = 1 AND answers.parentId = questions.id
	UNION ALL
	SELECT id, creationDate, ownerUserId, tags
	FROM Posts questions
	WHERE postTypeId = 1
) p
ORDER BY DATE_PART('YEAR', creationDate), DATE_PART('Month', creationDate), ownerUserId;


SELECT regexp_matches('<hello><maven><c#>', '<(.+?)>', 'g');

SELECT p1.year, p1.month, p1.ownerUserId, p1.id, p2.id
FROM questions_answers p1, questions_answers p2
WHERE p1.year = p2.year AND p1.month = p2.month AND p1.ownerUserId = p2.ownerUserId AND p1.id < p2.id  AND p1.id < 500 AND p2.id < 500
