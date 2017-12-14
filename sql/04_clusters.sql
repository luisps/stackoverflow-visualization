-- Clusters :: Final Output
-- Algorithm:
--     1. Rank each tag1<>tag2 relationship based on their count
--     2. For every relationship, assume that the one with rank1 is the cluster (we have to check both tags). This will generate duplicates
--     3. Group by (tag, cluster), SUM(count) and the cluster tag will be the one with greater "count"
DROP TABLE IF EXISTS clusters;
CREATE TABLE clusters AS
    WITH skills_total AS (
        SELECT
            tag1,
            tag2,
            SUM("count") "count"
        FROM skills
        GROUP BY tag1, tag2
    ),
    -- 1. Rank each tag1<>tag2 relationship based on their count
    skills_ranked AS (
        SELECT
            tag1,
            tag2,
            ROW_NUMBER() OVER(PARTITION BY tag1 ORDER BY "count" DESC) rank1,
            ROW_NUMBER() OVER(PARTITION BY tag2 ORDER BY "count" DESC) rank2
        FROM skills_total
    )
    SELECT
        tag,
        "cluster"
    FROM
        (SELECT
            tag,
            "cluster",
            ROW_NUMBER() OVER(PARTITION BY tag ORDER BY "count" DESC) "rank"
        FROM
            (SELECT
                tag,
                "cluster",
                SUM("count") "count"
            FROM
                -- 2. For every relationship, assume that the one with rank1 is the cluster (we have to check both tags). This will generate duplicates
                (SELECT
                    skills_ranked.tag1 tag,
                    CASE WHEN rank1=1 THEN skills_ranked.tag2 ELSE skills_ranked.tag1 END "cluster",
                    "count"
                FROM skills_ranked LEFT JOIN skills_total ON skills_ranked.tag1=skills_total.tag1 AND skills_ranked.tag2=skills_total.tag2
                UNION
                SELECT
                    skills_ranked.tag2 tag,
                    CASE WHEN rank2=1 THEN skills_ranked.tag1 ELSE skills_ranked.tag2 END "cluster",
                    "count"
                FROM skills_ranked LEFT JOIN skills_total ON skills_ranked.tag1=skills_total.tag1 AND skills_ranked.tag2=skills_total.tag2) rank_proposals
            GROUP BY tag, "cluster"
            ) rank_proposals_grouped
        ) rank_proposals_ranked
        WHERE "rank" = 1
;

-- Clusters :: Hotfix - fix circular clusters (e.g. ruby points to ruby-on-rails and vice-versa)
DO $$
    DECLARE rec_cluster RECORD;
    DECLARE str_cluster TEXT;
BEGIN

	FOR rec_cluster IN
	   SELECT
            tag1.tag tag1,
            tag1."cluster" cluster1,
            tag2.tag tag2,
            tag2."cluster" cluster2
        FROM
            (SELECT tag, "cluster" FROM clusters c WHERE 1=(SELECT COUNT(*) FROM clusters WHERE "cluster"=c.cluster)) tag1,
            (SELECT tag, "cluster" FROM clusters c WHERE 1=(SELECT COUNT(*) FROM clusters WHERE "cluster"=c.cluster)) tag2
        WHERE 1=1
            AND tag1.tag < tag2.tag
            AND (tag1.tag = tag2."cluster" OR tag1."cluster"=tag2.tag)
    LOOP
        
        str_cluster := (CASE WHEN LENGTH(rec_cluster.cluster1) < LENGTH(rec_cluster.cluster2) THEN rec_cluster.cluster1 ELSE rec_cluster.cluster2 END);
        UPDATE clusters SET "cluster"=str_cluster WHERE tag=rec_cluster.tag1 OR tag=rec_cluster.tag2;
    
    END LOOP;
	
END $$;
