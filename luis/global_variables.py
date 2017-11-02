from lxml import etree as ET
import psycopg2
from datetime import datetime
import os.path
import sys

regions = ['pt', 'es', 'en', 'ru', 'ja']

#more configurable variables
region = 'es'
db_name_prefix = 'stackoverflow_'  # region gets appended to the end

#region passed on cmd overwrites the one defined here
if len(sys.argv) > 1:
    region = sys.argv[1]

xml_files_dir = os.path.join('..', '..', region + '.stackoverflow.com')
#xml_files_dir = '.'  # use this if this script is on the same folder as xml files

#database connector information
host = '127.0.0.1'
user = 'root'
passwd = 'root'
db_name = db_name_prefix + region if sys.argv[0] != 'create_dbs.py' else 'postgres'

connect_str = "dbname='%s' host='%s' user='%s' password='%s'" % (db_name, host, user, passwd)
conn = psycopg2.connect(connect_str)
cur = conn.cursor()

def int_or_none(elem, attribute):
    return int(elem.attrib[attribute]) if attribute in elem.attrib else None

def fast_iter(context, row_process_func, conn, cur, insert_query, bulk_size=2048):

    bulk_seen = 0
    stmt_values = ''
    for event, elem in context:
        stmt = row_process_func(elem)

        stmt_values += ('' if bulk_seen == 0 else ',') + stmt.decode('utf-8')
        bulk_seen += 1

        #bulk insert
        if bulk_seen == bulk_size:
            cur.execute(insert_query + stmt_values)
            conn.commit()

            bulk_seen = 0
            stmt_values = ''

        #doing some memory cleanup
        #guarantees RAM doesn't grow over time for big files
        elem.clear()
        while elem.getprevious() is not None:
            del elem.getparent()[0]

    #insert remaining values
    if bulk_seen != 0:
        cur.execute(insert_query + stmt_values)
        conn.commit()
    
    del context

    return stmt_values
