-- Community :: 1. Posts by CreationDate, PostId, Tags
DROP TABLE IF EXISTS community_1_posts_by_creationdate_postid_tags;
CREATE TABLE community_1_posts_by_creationdate_postid_tags AS
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

-- Community :: 2. Votes by CreationDate, PostId
DROP TABLE IF EXISTS community_2_votes_by_creationdate_postid;
CREATE TABLE community_2_votes_by_creationdate_postid AS
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
            ELSE 0 END)                  downvotes,
        SUM(CASE WHEN votetypeid = 4
            THEN 1
            ELSE 0 END)                  offensivevotes
    FROM
        votes
    WHERE 1 = 1
        AND votetypeid IN (2, 3, 4)
    GROUP BY
        DATE_PART('YEAR', creationdate),
        DATE_PART('MONTH', creationdate),
        DATE_PART('DAY', creationdate),
        postid
    ORDER BY
        "year", "month", "day", postid
;

-- Community :: 3. Posts, Votes merged
DROP TABLE IF EXISTS community_3_posts_votes_merged;
CREATE TABLE community_3_posts_votes_merged AS
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
        COALESCE(offensivevotes, 0) offensivevotes,
        tags
    FROM
        community_1_posts_by_creationdate_postid_tags posts
        LEFT JOIN community_2_votes_by_creationdate_postid votes ON 1 = 1
            AND posts."year" = votes."year"
            AND posts."month" = votes."month"
            AND posts."day" = votes."day"
            AND posts.postid = votes.postid
;

-- Community :: 4. Final Output - filtered with no banned tags (1/2)
CREATE INDEX IF NOT EXISTS community_posts_votes_merged_idx ON community_3_posts_votes_merged ("year", "month", "day");
DROP TABLE IF EXISTS tmp_community;
CREATE TABLE tmp_community AS
    SELECT
        *
    FROM
        (SELECT
            "year",
            "month",
            "day",
            tag,
            SUM(answercount)   	answercount,
            SUM(commentcount)  	commentcount,
            SUM(questioncount) 	questioncount,
            --viewcount,
            SUM(upvotes)       	upvotes,
            SUM(downvotes)     	downvotes,
            SUM(offensivevotes) offensivevotes
        FROM
            community_3_posts_votes_merged posts,
            unnest(string_to_array(posts.tags, '><')) tag
        GROUP BY
            "year",
            "month",
            "day",
            tag
        ORDER BY
            "year", "month", "day", tag) res
    WHERE 1=1
        AND NOT EXISTS (SELECT 1 FROM tags_blacklist WHERE tags_blacklist.tag=res.tag)
;

-- Tags :: filtered and no banned
DROP TABLE IF EXISTS tags;
CREATE TABLE tags AS
SELECT
    tag
FROM
    (SELECT
        tag,
        SUM(answercount + commentcount + questioncount + upvotes + downvotes + offensivevotes) activity -- for DEBUGGING
    FROM
        tmp_community
    GROUP BY tag) res
WHERE
     activity > 0.00005 * (SELECT SUM(answercount + commentcount + questioncount + upvotes + downvotes + offensivevotes) FROM tmp_community);

CREATE INDEX tags_tag_ids ON tags("tag");

-- Community :: 4. Final Output - filtered with no banned tags (2/2)
DROP TABLE IF EXISTS community;
CREATE TABLE community AS
    SELECT
        *
    FROM
        tmp_community res
    WHERE 1=1
        AND EXISTS (SELECT 1 FROM tags WHERE tag=res.tag)
;
