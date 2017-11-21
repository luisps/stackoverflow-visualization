-- Clusters :: Final Output (in two steps)
DROP TABLE IF EXISTS tmp_clusters;
CREATE TABLE tmp_clusters AS
SELECT
	"count",
	tag tag1,
	(CASE WHEN tag=tag1 THEN tag2 ELSE tag1 END) tag2,
	"rank"
FROM
	(SELECT
		tags.tag,
		"count",
		tag1,
		tag2,
		row_number() over (partition by tag) "rank"
	FROM
		tags LEFT JOIN (SELECT "count", tag1, tag2 FROM skills_accumulated WHERE "year" = 2017 AND "month" = 8 ORDER BY "count" DESC) skills
			ON (tags.tag = skills.tag1 OR tags.tag = skills.tag2)) res
WHERE
	"rank" <= 2
;

DROP TABLE IF EXISTS clusters;
CREATE TABLE clusters AS
SELECT
	clusters1.tag1 tag,
	(CASE WHEN clusters1."count" / clusters2."count" > 1.09 THEN clusters1.tag2 ELSE clusters1.tag1 END) "cluster"
FROM
	(SELECT * FROM tmp_clusters WHERE "count" IS NOT NULL AND "rank"=1) clusters1,
	(SELECT * FROM tmp_clusters WHERE "count" IS NOT NULL AND "rank"=2) clusters2
WHERE
	clusters1.tag1 = clusters2.tag1
;
UPDATE clusters SET "cluster"=tag WHERE tag IN (SELECT DISTINCT("cluster") FROM clusters);

