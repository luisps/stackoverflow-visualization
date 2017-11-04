-- Community :: Posts by CreationDate, PostId (merged Questions and Answers)
-- Note: isto tem de ser feito em dois passos, pois quando há comments/answers num mes/ano diferente do da criação da questão original, as tags ficam a null
DROP TABLE IF EXISTS tmp_community_posts_by_creationdate_postid;
CREATE TABLE tmp_community_posts_by_creationdate_postid AS
    SELECT
        DATE_PART('YEAR', creationdate)  "year",
        DATE_PART('MONTH', creationdate) "month",
        id,
        SUM(answercount)                 answercount,
        SUM(commentcount)                commentcount,
        SUM(questioncount)               questioncount,
        --SUM(viewcount) viewcount,
        MAX(tags)                        tags
    FROM
        (
            SELECT
                creationdate,
                (CASE WHEN parentid IS NOT NULL
                    THEN parentid
                 ELSE id END)             id,
                COALESCE(answercount, 0)  answercount,
                COALESCE(commentcount, 0) commentcount,
                (CASE WHEN posttypeid = 1
                    THEN 1
                 ELSE 0 END)              questioncount,
                --COALESCE(viewcount, 0) viewcount,
                MAX(tags)                 tags
            FROM
                posts
            WHERE 1 = 1
                  AND ((posttypeid = 1 AND tags IS NOT NULL) OR posttypeid = 2)
            GROUP BY
                creationdate, id
        ) posts_merged
    GROUP BY
        DATE_PART('YEAR', creationdate),
        DATE_PART('MONTH', creationdate),
        id
;

CREATE INDEX tmp_community_posts_by_creationdate_postid_idx ON tmp_community_posts_by_creationdate_postid ("id");
DROP TABLE IF EXISTS community_posts_by_creationdate_postid;
CREATE TABLE community_posts_by_creationdate_postid AS
    SELECT
        "year",
        "month",
        id                         postid,
        answercount,
        commentcount,
        questioncount,
        --viewcount,
        (SELECT MAX(tags) tags
         FROM tmp_community_posts_by_creationdate_postid src
         WHERE src.id = target.id) tags
    FROM
        tmp_community_posts_by_creationdate_postid target;
DROP TABLE IF EXISTS tmp_community_posts_by_creationdate_postid;

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
        community_posts_by_creationdate_postid posts
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