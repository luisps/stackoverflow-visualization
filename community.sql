-- Community :: Posts by CreationDate, PostId, Tags
DROP TABLE IF EXISTS community_posts_by_creationdate_postid_tags;
CREATE TABLE community_posts_by_creationdate_postid_tags AS
    SELECT
		"year"							,
		"month"							,
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
		"year", "month", questions_and_answers.postid, tags.tags
;

-- Community :: Votes by CreationDate, PostId
DROP TABLE IF EXISTS community_votes_by_creationdate_postid;
CREATE TABLE community_votes_by_creationdate_postid AS
    SELECT
        DATE_PART('YEAR', creationdate)  "year",
        DATE_PART('MONTH', creationdate) "month",
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
        postid
    ORDER BY
        "year", "month", postid
;

-- Community :: Posts, Votes merged
DROP TABLE IF EXISTS community_posts_votes_merged;
CREATE TABLE community_posts_votes_merged AS
    SELECT
        posts."year",
        posts."month",
        posts.postid           postid,
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
            AND posts.postid = votes.postid
;

-- Community :: Final Output
CREATE INDEX community_posts_votes_merged_idx ON community_posts_votes_merged ("year", "month");
DROP TABLE IF EXISTS community;
CREATE TABLE community AS
    SELECT
        "year",
        "month",
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
        tag
    ORDER BY
        "year", "month", tag
;