from global_variables import *

conn.autocommit = True

#each region has its own database
for region in regions:
    db = db_name_prefix + region

    drop_db_query = 'DROP DATABASE IF EXISTS %s'
    cur.execute(drop_db_query % (db,))

    create_db_query = 'CREATE DATABASE %s'
    cur.execute(create_db_query % (db,))

conn.close()
