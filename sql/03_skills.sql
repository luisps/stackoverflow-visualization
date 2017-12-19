-- Skills :: 1. Comments by CreationDate, OwnerUserId, Tags
DROP TABLE IF EXISTS skills_1_comments_by_creationdate_owneruserid_tags;
CREATE TABLE skills_1_comments_by_creationdate_owneruserid_tags AS
	SELECT
		DATE_PART('YEAR', c.creationdate)  	"year",
	    --DATE_PART('MONTH', c.creationdate) 	"month",
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
		DATE_PART('YEAR', c.creationdate),
		--DATE_PART('MONTH', c.creationdate),
		c.owneruserid,
		p.tags
;

-- Skills :: Posts by CreationDate, OwnerUserId, Tags
DROP TABLE IF EXISTS skills_2_posts_by_creationdate_owneruserid_tags;
CREATE TABLE skills_2_posts_by_creationdate_owneruserid_tags AS
	SELECT
		"year"								,
		--"month"								,
		owneruserid							,
		COUNT(*)							"count",
		tags.tags 							tags
	FROM
		(
			SELECT
			    DATE_PART('YEAR', creationdate)  							"year",
			    --DATE_PART('MONTH', creationdate) 							"month",
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
		"year",
		--"month",
		owneruserid,
		tags.tags
;

-- Skills :: Comments + Posts by CreationDate, OwnerUserId, Tag
DROP TABLE IF EXISTS skills_3_comments_posts_by_creationdate_owneruserid_tag;
CREATE TABLE skills_3_comments_posts_by_creationdate_owneruserid_tag AS
SELECT 
	"year"			,
	--"month"			,
	owneruserid		,
	SUM("count")	"count",
	tag
FROM
	(
		SELECT * FROM skills_1_comments_by_creationdate_owneruserid_tags
		UNION
		SELECT * FROM skills_2_posts_by_creationdate_owneruserid_tags
	) skills_comments_posts,
	unnest(string_to_array(skills_comments_posts.tags, '><')) tag
GROUP BY
	"year",
	--"month",
	owneruserid,
	tag
;

-- Skills :: Comments + Posts by CreationDate, OwnerUserId, Tag1, Tag2 (with no banned tags)
CREATE INDEX IF NOT EXISTS skills_comments_posts_by_creationdate_owneruserid_tag_year_month_owneruserid ON skills_3_comments_posts_by_creationdate_owneruserid_tag ("year", /*"month", */"owneruserid");
DROP TABLE IF EXISTS skills_4_comments_posts_by_creationdate_owneruserid_tag1_tag2;
CREATE TABLE skills_4_comments_posts_by_creationdate_owneruserid_tag1_tag2 AS
	SELECT
		original."year"            "year",
		--original."month"           "month",
		original.owneruserid       owneruserid,
		original."count"           "count",
		original.tag	           tag1,
		clone.tag	               tag2
	FROM
		skills_3_comments_posts_by_creationdate_owneruserid_tag original,
		skills_3_comments_posts_by_creationdate_owneruserid_tag clone
	WHERE 1=1
		AND original."year" = clone."year"
		--AND original."month" = clone."month"
		AND original.owneruserid = clone.owneruserid
		AND original.tag < clone.tag
		-- Include only relevant tags (which also excludes banned tags)
		AND EXISTS (SELECT tag FROM tags WHERE tags.tag=original.tag)
		AND EXISTS (SELECT tag FROM tags WHERE tags.tag=clone.tag)
;

-- Skills :: Final Output - filtered and limited
DROP TABLE IF EXISTS skills;
CREATE TABLE skills AS
    WITH tags_tags AS (
        SELECT
            tag1,
            tag2
        FROM
            (SELECT
                tag1,
                tag2,
                ROW_NUMBER() OVER(PARTITION BY tag1 ORDER BY "count" DESC) rank1,
                ROW_NUMBER() OVER(PARTITION BY tag2 ORDER BY "count" DESC) rank2
            FROM
                (SELECT
                    tag1,
                    tag2,
                    SUM("count") "count"
                FROM
                    skills_4_comments_posts_by_creationdate_owneruserid_tag1_tag2
                GROUP BY tag1, tag2) res
            WHERE 1=1
                -- Filter irrelevant skills
                AND res."count" > 0.00005 * (SELECT SUM("count") FROM skills_4_comments_posts_by_creationdate_owneruserid_tag1_tag2)
            ) res
        WHERE 1=1
            -- At most, 15 skills per tag (both ways)
            AND rank1 <= 32
            AND rank2 <= 32
    )
    SELECT
        *,
        ROW_NUMBER() OVER(PARTITION BY tag1,"year" ORDER BY "count" DESC) rank1,
        ROW_NUMBER() OVER(PARTITION BY tag2,"year" ORDER BY "count" DESC) rank2
    FROM
        (SELECT
            "year",
            --"month",
            SUM("count") "count",
            tag1,
            tag2
        FROM
            skills_4_comments_posts_by_creationdate_owneruserid_tag1_tag2 skills
        WHERE 1=1
            AND EXISTS (SELECT 1 FROM tags_tags tags WHERE tags.tag1=skills.tag1 AND tags.tag2 = skills.tag2)
        GROUP BY
            "year"/*, month */, tag1, tag2
        ) res
;       

-- Community :: Hotfix - Delete tags with irrelevant links
DROP TABLE IF EXISTS tags;
CREATE TABLE tags AS
    SELECT
        DISTINCT(tag)
    FROM
        (SELECT tag1 tag FROM skills
        UNION
        SELECT tag2 tag FROM skills) res
    ORDER BY tag;

DELETE FROM community WHERE tag NOT IN (SELECT * FROM tags);