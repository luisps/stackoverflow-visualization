-- Skills :: Comments by CreationDate, OwnerUserId, Tags
DROP TABLE IF EXISTS skills_comments_by_creationdate_owneruserid_tags;
CREATE TABLE skills_comments_by_creationdate_owneruserid_tags AS
	SELECT
		DATE_PART('YEAR', c.creationdate)  	"year",
	    DATE_PART('MONTH', c.creationdate) 	"month",
	    c.owneruserid						,
	    COUNT(*)							"count",
	    p.tags								tags
	FROM
		comments c,
		posts p
	WHERE 1=1
		AND c.postid = p.id
		AND p.posttypeid = 1
	GROUP BY
		DATE_PART('YEAR', c.creationdate), DATE_PART('MONTH', c.creationdate), c.owneruserid, p.tags
;

-- Skills :: Posts by CreationDate, OwnerUserId, Tags
DROP TABLE IF EXISTS skills_posts_by_creationdate_owneruserid_tags;
CREATE TABLE skills_posts_by_creationdate_owneruserid_tags AS
	SELECT
		"year"								,
		"month"								,
		owneruserid							,
		COUNT(*)							"count",
		tags.tags 							tags
	FROM
		(
			SELECT
			    DATE_PART('YEAR', creationdate)  							"year",
			    DATE_PART('MONTH', creationdate) 							"month",
			    (CASE WHEN parentid IS NOT NULL THEN parentid ELSE id END)	postid,
			    															owneruserid,
			                     											tags
			FROM
			    posts
			WHERE 1 = 1
				AND ((posttypeid = 1 AND tags IS NOT NULL) OR posttypeid = 2) -- filter only questions and answers
		) questions_and_answers,
		(
			SELECT
				id		postid,
				tags
			FROM
				posts
			WHERE
				posttypeid=1
		) tags
	WHERE
		questions_and_answers.postid = tags.postid
	GROUP BY
		"year", "month", owneruserid, tags.tags
;

-- Skills :: Comments + Posts by CreationDate, OwnerUserId, Tags
DROP TABLE IF EXISTS skills_comments_posts_by_creationdate_owneruserid_tag;
CREATE TABLE skills_comments_posts_by_creationdate_owneruserid_tag AS
SELECT 
	"year"			,
	"month"			,
	owneruserid		,
	SUM("count")	"count",
	tag
FROM
	(
		SELECT * FROM skills_comments_by_creationdate_owneruserid_tags
		UNION
		SELECT * FROM skills_posts_by_creationdate_owneruserid_tags
	) skills_comments_posts,
	unnest(string_to_array(skills_comments_posts.tags, '><')) tag
GROUP BY
	"year", "month", owneruserid, tag
;

-- Skills :: Comments + Posts by CreationDate, OwnerUserId, Tag1, Tag2 (includes duplicates)
CREATE INDEX IF NOT EXISTS skills_comments_posts_by_creationdate_owneruserid_tag_year_month_owneruserid ON skills_comments_posts_by_creationdate_owneruserid_tag ("year", "month", "owneruserid");
DROP TABLE IF EXISTS skills_comments_posts_by_creationdate_owneruserid_tag1_tag2;
CREATE TABLE skills_comments_posts_by_creationdate_owneruserid_tag1_tag2 AS
SELECT * FROM
	(
		SELECT
			original."year"																"year",
			original."month"															"month",
			original.owneruserid														owneruserid,
			original."count"															"count",
			(CASE WHEN original.tag < clone.tag THEN original.tag ELSE clone.tag END)	tag1,
			(CASE WHEN original.tag < clone.tag THEN clone.tag ELSE original.tag END)	tag2
		FROM
			skills_comments_posts_by_creationdate_owneruserid_tag original,
			skills_comments_posts_by_creationdate_owneruserid_tag clone
		WHERE 1=1
			AND original."year" = clone."year"
			AND original."month" = clone."month"
			AND original.owneruserid = clone.owneruserid
			AND original.tag <> clone.tag
	) with_duplicates
GROUP BY
	"year", "month", "owneruserid", "count", tag1, tag2
;

-- Skills :: Final Output - filtered (in two steps)
DROP TABLE IF EXISTS tmp_tags;
CREATE TABLE tmp_tags AS
SELECT
	tag1,
	tag2
FROM
	(SELECT
		(CASE WHEN original.tag < clone.tag THEN original.tag ELSE clone.tag END)	tag1,
		(CASE WHEN original.tag < clone.tag THEN clone.tag ELSE original.tag END)	tag2
	FROM
		tags original,
		tags clone
	WHERE
		original.tag <> clone.tag) with_duplicates
GROUP BY
	tag1, tag2;

CREATE INDEX IF NOT EXISTS tmptags_tag1_tag2_idx ON tmp_tags(tag1,tag2);
DROP TABLE IF EXISTS skills;
CREATE TABLE skills AS
SELECT
	"year"			,
	"month"			,
	SUM("count")	count,
	skills.tag1		,
	skills.tag2
FROM
	skills_comments_posts_by_creationdate_owneruserid_tag1_tag2 skills INNER JOIN tmp_tags
		ON skills.tag1 = tmp_tags.tag1
		AND skills.tag2 = tmp_tags.tag2
GROUP BY
	"year", "month", skills.tag1, skills.tag2
;

-- Skills :: All tag1, tag2 by year, month
CREATE INDEX IF NOT EXISTS skills_year_month_tag1_tag2_idx ON skills ("year","month",tag1,tag2);
DROP TABLE IF EXISTS skills_all_tag1_tag2_by_year_month;
CREATE TABLE skills_all_tag1_tag2_by_year_month AS
SELECT 
	"year",
	"month",
	tag1,
	tag2
FROM
	(SELECT DISTINCT tag1, tag2 FROM skills) skills_tags,
	(SELECT DISTINCT "year", "month" FROM skills) skills_time
ORDER BY "year", "month"
;

-- Skills :: Final Output - Accumulated and filtered (in three steps)
DROP TABLE IF EXISTS tmp_skills_accumulated;
CREATE TABLE tmp_skills_accumulated AS
SELECT
	tags."year"							,
	tags."month"						,
	tags.tag1							,
	tags.tag2							,
	COALESCE(SUM(skills."count"), 0)	"count"
FROM
	skills_all_tag1_tag2_by_year_month tags LEFT JOIN skills
		ON tags.tag1 = skills.tag1
		AND tags.tag2 = skills.tag2
		AND ((skills."year" = tags."year" AND skills."month" <= tags."month") OR skills."year" < tags."year")
GROUP BY
	tags."year", tags."month", tags.tag1, tags.tag2
ORDER BY
	"year", "month", tag1, tag2
;

DROP TABLE IF EXISTS tags_tags;
CREATE TABLE tags_tags AS
SELECT tag1, tag2
FROM tmp_skills_accumulated
WHERE 1=1
	AND "year" = 2017
	AND "month" = 8
	AND "count" > (SELECT MAX("count") * 0.01 FROM tmp_skills_accumulated)
;

DROP TABLE IF EXISTS skills_accumulated;
CREATE TABLE skills_accumulated AS
SELECT
	skills."year",
	skills."month",
	skills."count",
	skills.tag1,
	skills.tag2
FROM
	tmp_skills_accumulated skills INNER JOIN tags_tags tags
		ON skills.tag1 = tags.tag1
		AND skills.tag2 = tags.tag2
;
