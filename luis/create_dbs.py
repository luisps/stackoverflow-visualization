from global_variables import *

conn = pymysql.connect(host=host, user=user, passwd=passwd)
cur = conn.cursor()

#each region has its own database
for region in regions:
    db = db_name_prefix + region
    create_db_query = 'CREATE DATABASE IF NOT EXISTS %s'
    cur.execute(create_db_query % (db,))

