from lxml import etree
import pymysql
from datetime import datetime
import os.path

'''
A function to loop through a context, calling func each time, and then clean up unneeded references
'''
def fast_iter(context, row_process_func, cursor):
    for event, elem in context:
        row_process_func(elem, cursor)

        #doing some memory cleanup
        #guarantees RAM doesn't grow over time for big files
        elem.clear()
        while elem.getprevious() is not None:
            del elem.getparent()[0]
    del context

def row_process(elem, cursor):

    #process only questions - for now
    if elem.attrib['PostTypeId'] != '1':
        return

    tags = elem.attrib['Tags']
    #print(tags)

    insert_query = 'INSERT INTO Posts (tags) values (%s)'
    cursor.execute(insert_query, (tags,))


xml_files = ['Posts.xml', 'Votes.xml', 'Comments.xml', 'test.xml']
table_names = ['Posts', 'Votes', 'Comments']
regions = ['pt', 'es', 'en', 'ru', 'ja']

#enable these options to recreate the databases or tables
#can be useful when starting from an empty database
#or when the schema has changed
recreate_db = False
recreate_tables = True

#selected values for this run
selected_xml_file = 0
selected_region = 0

xml_file = xml_files[selected_xml_file]
region = regions[selected_region]

#more configurable variables
db_name_prefix = 'stackoverflow_'  # region gets appended to the end

xml_files_dir = os.path.join('..', region + '.stackoverflow.com')
#xml_files_dir = '.'  # use this if this script is on the same folder as xml files

#database connector information
host = '127.0.0.1'
user = 'root'
passwd = 'root'
db_name = db_name_prefix + region

if recreate_db:
    #each region has its own database, the schema should be the same
    #across the databases/regions
    conn = pymysql.connect(host=host, user=user, passwd=passwd)
    cursor = conn.cursor()

    for region in regions:
        db = db_name_prefix + region
        create_db_query = 'CREATE DATABASE IF NOT EXISTS %s'
        cursor.execute(create_db_query % (db,))

    #use the selected database from now on
    cursor.execute('USE %s' % (db_name,))
else:
    #connect directly to the selected database
    conn = pymysql.connect(host=host, user=user, passwd=passwd, db=db_name)
    cursor = conn.cursor()

exit()

if recreate_tables:
    #creating the schema on this script allows us to have a single
    #place to change whenever the schema changes
    #it also guarantees the schema is constant across workstations
    #as long as we update it here

    #schema for Posts
    drop_table_query = 'DROP TABLE IF EXISTS Posts'
    cursor.execute(drop_table_query)

    create_table_query = '''\
CREATE TABLE Posts (
    id MEDIUMINT NOT NULL AUTO_INCREMENT,
    tags TEXT NOT NULL,
    PRIMARY KEY (id)
);\
    '''
    cursor.execute(create_table_query)

    #schema for Votes
    drop_table_query = 'DROP TABLE IF EXISTS Votes'
    cursor.execute(drop_table_query)

    #schema for Comments
    drop_table_query = 'DROP TABLE IF EXISTS Comments'
    cursor.execute(drop_table_query)

start_time = datetime.now()

context = etree.iterparse(xml_file, events=('end',), tag='row')
fast_iter(context, row_process, cursor)

conn.commit()
conn.close()

end_time = datetime.now()
time_delta = end_time - start_time
print('Took', time_delta.total_seconds(), 'seconds')


