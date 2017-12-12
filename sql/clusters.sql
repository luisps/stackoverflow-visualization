-- Clusters :: Final Output
DROP TABLE IF EXISTS clusters;
CREATE TABLE clusters AS
SELECT
	clusters1.tag1 tag,
	(CASE WHEN clusters1."count" / clusters2."count" > 1.09 THEN clusters1.tag2 ELSE clusters1.tag1 END) "cluster"
FROM
	(SELECT * FROM skills_accumulated WHERE "year"=2017 AND "month"=7 AND "rank"=1) clusters1,
	(SELECT * FROM skills_accumulated WHERE "year"=2017 AND "month"=7 AND "rank"=2) clusters2
WHERE
	clusters1.tag1 = clusters2.tag1
;

-- TODO: tenho de ir buscar o codigo do temp.. pk ha tags que nao têm ligaçao e tenho de as adicionar na mesma

-- Manual clusters
UPDATE clusters SET "cluster"=tag WHERE tag IN (SELECT DISTINCT("cluster") FROM clusters);
UPDATE clusters SET "cluster"='c#' WHERE "cluster"='devexpress';
UPDATE clusters SET "cluster"='java' WHERE "cluster"='java-8';
UPDATE clusters SET "cluster"='java' WHERE "cluster"='java-ee';
UPDATE clusters SET "cluster"='java' WHERE "cluster"='java-swing';
UPDATE clusters SET "cluster"='java' WHERE "cluster"='jpa';
UPDATE clusters SET "cluster"='python' WHERE "cluster"='python-3.x';

SELECT DISTINCT("cluster") FROM clusters;