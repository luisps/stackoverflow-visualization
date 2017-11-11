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
DROP INDEX IF EXISTS skills_comments_posts_by_creationdate_owneruserid_tag_year_month_owneruserid;
CREATE INDEX skills_comments_posts_by_creationdate_owneruserid_tag_year_month_owneruserid ON skills_comments_posts_by_creationdate_owneruserid_tag ("year", "month", "owneruserid");
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

-- Skills :: Final Output
DROP TABLE IF EXISTS skills;
CREATE TABLE skills AS
SELECT
	"year"			,
	"month"			,
	SUM("count")	count,
	tag1			,
	tag2
FROM
	skills_comments_posts_by_creationdate_owneruserid_tag1_tag2
GROUP BY
	"year", "month", tag1, tag2
;