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

-- Clusters :: Hotfix - merge clusters about different versions of the same tech
WITH clusters_with_version AS (
    SELECT
        "cluster",
        '-' || "version" "version"
    FROM
        (SELECT
            "cluster",
            REVERSE(SUBSTRING(REVERSE("cluster") FROM 0 FOR POSITION('-' IN REVERSE("cluster")))) "version"
        FROM clusters) res
    WHERE "version" SIMILAR TO '[0-9.x]+'
)
UPDATE clusters
SET   "cluster"=REPLACE(clusters."cluster", "version", '')
FROM  clusters_with_version
WHERE clusters."cluster"=clusters_with_version."cluster";

-- Clusters :: Hotfix - associate tags about different versions of the same tech to the correct cluster
WITH tags_with_version AS (
    SELECT
        tag,
        '-' || "version" "version"
    FROM
        (SELECT
            tag,
            REVERSE(SUBSTRING(REVERSE(tag) FROM 0 FOR POSITION('-' IN REVERSE(tag)))) "version"
        FROM clusters) res
    WHERE "version" SIMILAR TO '[0-9.x]+'
)
UPDATE clusters
SET   "cluster"=REPLACE(clusters.tag, "version", '')
FROM  tags_with_version
WHERE clusters.tag=tags_with_version.tag;

-- Clusters :: Hotfix - fix some specific aliases
UPDATE clusters SET tag='nodejs' WHERE tag='node.js';
UPDATE clusters SET "cluster"='nodejs' WHERE "cluster"='node.js';

-- Clusters :: Hotfix - fix some specific clusters
DROP TABLE IF EXISTS tmp_hotfix_clusters;
CREATE TABLE tmp_hotfix_clusters (
    tag VARCHAR(255),
    "cluster" VARCHAR(255)
);

INSERT INTO tmp_hotfix_clusters ("cluster", tag) VALUES
    ('.net', '.net'),
    ('.net', 'entity-framework'),
    ('.net', 'linq'),
    ('.net', 'wcf'),
    ('.net', 'wpf'),
    ('.net', 'windows-forms'),
    ('.net', 'winforms'),
    ('android', 'android'),
    ('android', 'android-layout'),
    ('android', 'android-studio'),
    ('asp.net', 'asp'),
    ('asp.net', 'asp.net-mvc'),
    ('asp.net', 'asp.net-web-api'),
    ('asp.net', 'razor'),
    ('c', 'c'),
    ('c++', 'c++'),
    ('css', 'css'),
    ('css', 'bootstrap'),
    ('css', 'twitter-bootstrap'),
    ('css', 'css3'),
    ('facebook', 'facebook'),
    ('git', 'github'),
    ('html', 'firefox'),
    ('html', 'html'),
    ('html', 'google-chrome'),
    ('html', 'internet-explorer'),
    ('html', 'html5'),
    ('ios', 'ios'),
    ('ios', 'iphone'),
    ('ios', 'objective-c'),
    ('java', 'java'),
    ('java', 'eclipse'),
    ('java', 'gradle'),
    ('java', 'hibernate'),
    ('java', 'jsf'),
    ('java', 'jsp'),
    ('java', 'netbeans'),
    ('java', 'servlets'),
    ('java', 'spring'),
    ('java', 'swing'),
    ('javascript', 'javascript'),
    ('javascript', 'angular'),
    ('javascript', 'angularjs'),
    ('javascript', 'cordova'),
    ('javascript', 'ionic'),
    ('javascript', 'jquery'),
    ('javascript', 'jquery-datatables'),
    ('javascript', 'jquery-ui'),
    ('javascript', 'reactjs'),
    ('javascript', 'selenium'),
    ('javascript', 'typescript'),
    ('linux', 'linux'),
    ('linux', 'centos'),
    ('linux', 'bash'),
    ('linux', 'ubuntu'),
    ('linux', 'unix'),
    ('linux', 'vim'),
    ('linux', 'zsh'),
    ('mongodb', 'mongodb'),
    ('mysql', 'mysql'),
    ('mysql', 'mysqli'),
    ('nodejs', 'nodejs'),
    ('nodejs', 'express'),
    ('nodejs', 'npm'),
    --('node.js', 'node.js'),
    --('node.js', 'npm'),
    ('oracle', 'oracle'),
    ('oracle', 'oracle-11g'),
    ('osx', 'osx'),
    ('os-x', 'os-x'),
    ('php', 'php'),
    ('php', 'codeigniter'),
    ('php', 'joomla'),
    ('php', 'phpmailer'),
    ('php', 'phpmyadmin'),
    ('php', 'primefaces'),
    ('php', 'yii'),
    ('php', 'yii2'),
    ('postgresql', 'postgresql'),
    ('postgresql', 'plsql'),
    ('ruby-on-rails', 'ruby-on-rails'),
    ('ruby-on-rails', 'rails-activerecord'),
    ('ruby-on-rails', 'ruby'),
    ('sql-server', 'tsql'),
    ('swift', 'swift'),
    ('swift', 'swift2'),
    ('swift', 'swift3'),
    ('swift', 'uicollectionview'),
    ('swift', 'uicollectionviewcell'),
    ('swift', 'uilabel'),
    ('swift', 'uiimage'),
    ('swift', 'uikit'),
    ('swift', 'uiscrollview'),
    ('unity3d', 'unity3d'),
    ('vb', 'vb6'),
    ('vb', 'vba'),
    ('vb', 'vb.net'),
    ('windows', 'winapi'),
    ('windows', 'windows10'),
    ('wordpress', 'wordpress-theme'),
    ('xamarin', 'xamarin'),
    ('xamarin', 'xamarin.forms'),
    ('xcode', 'xcode'),
    ('xcode', 'xcode6'),
    ('xcode', 'xcode7'),
    ('xcode', 'xib'),
    ('xml', 'xpath')
;

UPDATE clusters SET "cluster"=hotfix."cluster" FROM tmp_hotfix_clusters hotfix WHERE clusters."cluster"=hotfix.tag;
UPDATE clusters SET "cluster"=hotfix."cluster" FROM tmp_hotfix_clusters hotfix WHERE clusters.tag=hotfix.tag;

SELECT "cluster", COUNT(*) FROM clusters GROUP BY "cluster" ORDER BY "cluster";
SELECT * FROM clusters ORDER BY "cluster";