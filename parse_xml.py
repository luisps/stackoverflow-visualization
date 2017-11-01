from lxml import etree
import pymysql
from datetime import datetime

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

def recreate_tables(cursor):

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


xml_files = ['Posts.xml', 'Votes.xml', 'Comments.xml']
table_names = ['Posts', 'Votes', 'Comments']

xml_file = 'Posts.xml'
#xml_file = 'test.xml'
recreate = True

host = '127.0.0.1'
user = 'root'
passwd = 'root'
db_name = 'pt_stackoverflow'

conn = pymysql.connect(host=host, user=user, passwd=passwd, db=db_name)
cursor = conn.cursor()

if recreate:
    recreate_tables(cursor)

start_time = datetime.now()

context = etree.iterparse(xml_file, events=('end',), tag='row')
fast_iter(context, row_process, cursor)

conn.commit()
conn.close()

end_time = datetime.now()
time_delta = end_time - start_time
print('Took', time_delta.total_seconds(), 'seconds')


