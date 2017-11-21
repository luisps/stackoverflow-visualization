-- Community :: Posts by CreationDate, PostId, Tags
DROP TABLE IF EXISTS community_posts_by_creationdate_postid_tags;
CREATE TABLE community_posts_by_creationdate_postid_tags AS
    SELECT
		"year"							,
		"month"							,
		"day"							,
		questions_and_answers.postid	postid,
		COALESCE(SUM(answercount), 0)	answercount,
		COALESCE(SUM(commentcount), 0)	commentcount,
		COALESCE(SUM(questioncount), 0)	questioncount,
		tags.tags 						tags
	FROM
		(
			SELECT
			    DATE_PART('YEAR', creationdate)  							"year",
			    DATE_PART('MONTH', creationdate) 							"month",
			    DATE_PART('DAY', creationdate) 								"day",
			    (CASE WHEN parentid IS NOT NULL THEN parentid ELSE id END)	postid,
	    		answercount													,
				commentcount												,
				(CASE WHEN posttypeid = 1 THEN 1 ELSE 0 END)              	questioncount,
				--viewcount													viewcount,
			                     											tags
			FROM
			    posts
			WHERE 1 = 1
				AND ((posttypeid = 1 AND tags IS NOT NULL) OR posttypeid = 2)
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
		"year", "month", "day", questions_and_answers.postid, tags.tags
;

-- Community :: Votes by CreationDate, PostId
DROP TABLE IF EXISTS community_votes_by_creationdate_postid;
CREATE TABLE community_votes_by_creationdate_postid AS
    SELECT
        DATE_PART('YEAR', creationdate)  "year",
        DATE_PART('MONTH', creationdate) "month",
        DATE_PART('DAY', creationdate) "day",
        postid,
        SUM(CASE WHEN votetypeid = 2
            THEN 1
            ELSE 0 END)                  upvotes,
        SUM(CASE WHEN votetypeid = 3
            THEN 1
            ELSE 0 END)                  downvotes
    FROM
        votes
    WHERE 1 = 1
        AND votetypeid IN (2, 3)
    GROUP BY
        DATE_PART('YEAR', creationdate),
        DATE_PART('MONTH', creationdate),
        DATE_PART('DAY', creationdate),
        postid
    ORDER BY
        "year", "month", "day", postid
;

-- Community :: Posts, Votes merged
DROP TABLE IF EXISTS community_posts_votes_merged;
CREATE TABLE community_posts_votes_merged AS
    SELECT
        posts."year",
        posts."month",
        posts."day",
        posts.postid,
        answercount,
        commentcount,
        questioncount,
        --viewcount,
        COALESCE(upvotes, 0)   upvotes,
        COALESCE(downvotes, 0) downvotes,
        tags
    FROM
        community_posts_by_creationdate_postid_tags posts
        LEFT JOIN community_votes_by_creationdate_postid votes ON 1 = 1
            AND posts."year" = votes."year"
            AND posts."month" = votes."month"
            AND posts."day" = votes."day"
            AND posts.postid = votes.postid
;

-- Community :: Final Output
CREATE INDEX IF NOT EXISTS community_posts_votes_merged_idx ON community_posts_votes_merged ("year", "month", "day");
DROP TABLE IF EXISTS community;
CREATE TABLE community AS
    SELECT
        "year",
        "month",
        "day",
        tag,
        SUM(answercount)   answercount,
        SUM(commentcount)  commentcount,
        SUM(questioncount) questioncount,
        --viewcount,
        SUM(upvotes)       upvotes,
        SUM(downvotes)     downvotes
    FROM
        community_posts_votes_merged posts,
        unnest(string_to_array(posts.tags, '><')) tag
    GROUP BY
        "year",
        "month",
        "day",
        tag
    ORDER BY
        "year", "month", "day", tag
;

-- Community :: All tags by year, month
CREATE INDEX IF NOT EXISTS community_year_month_tag_idx ON public.community ("year","month","day",tag);
DROP TABLE IF EXISTS community_all_tags_by_year_month_day;
CREATE TABLE community_all_tags_by_year_month_day AS
SELECT 
	"year",
	"month",
	"day",
	tag
FROM
	(SELECT DISTINCT tag FROM community) community_tags,
	(SELECT DISTINCT "year", "month", "day" FROM community) community_time
ORDER BY "year", "month", "day", tag
;

-- Community :: Final Output - Accumulated and filtered (in three steps)
DROP TABLE IF EXISTS tmp_community_accumulated;
CREATE TABLE tmp_community_accumulated AS
SELECT
	tags."year"						,
	tags."month"					,
	tags."day"					,
	tags.tag						,
	COALESCE(SUM(community.answercount), 0)		answercount,
	COALESCE(SUM(community.commentcount), 0)	commentcount,
	COALESCE(SUM(community.questioncount), 0)	questioncount,
	COALESCE(SUM(community.upvotes), 0)			upvotes,
	COALESCE(SUM(community.downvotes), 0)		downvotes
FROM
	community_all_tags_by_year_month_day tags LEFT JOIN community
		ON community.tag = tags.tag
		AND ((community."year" = tags."year" AND community."month" = tags."month" AND community."day" <= tags."day") OR
			 (community."year" = tags."year" AND community."month" < tags."month") OR
			 (community."year" < tags."year"))
GROUP BY
	tags."year", tags."month", tags."day", tags.tag
ORDER BY
	"year", "month", "day", tag
;

DROP TABLE IF EXISTS tags;
CREATE TABLE tags AS
SELECT
	DISTINCT(tag) tag
FROM
	tmp_community_accumulated accumulated
WHERE
	"year" = 2017 AND
	"month" = 8 AND
	"day" = 1 AND
	(answercount + commentcount + questioncount + upvotes + downvotes) > (SELECT MAX(answercount + commentcount + questioncount + upvotes + downvotes) * 0.0025 FROM tmp_community_accumulated)
;

DROP TABLE IF EXISTS community_accumulated;
CREATE TABLE community_accumulated AS
SELECT
	"year",
	"month",
	"day",
	tags.tag,
	answercount,
	commentcount,
	questioncount,
	upvotes,
	downvotes
FROM
	tmp_community_accumulated accumulated INNER JOIN tags
		ON accumulated.tag=tags.tag
ORDER BY
	"year", "month", "day", tags.tag
;
