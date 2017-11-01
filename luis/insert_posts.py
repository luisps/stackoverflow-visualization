from global_variables import *

def recreate_table(cur):

    drop_table_query = 'DROP TABLE IF EXISTS Posts'
    cur.execute(drop_table_query)

    create_table_query = '''\
CREATE TABLE Posts (
    Id MEDIUMINT NOT NULL,
    PostTypeId TINYINT NOT NULL,
    CreationDate DATE NOT NULL,
    OwnerUserId MEDIUMINT,
    Tags MEDIUMTEXT,
    PRIMARY KEY (Id)
);\
    '''
    cur.execute(create_table_query)

def row_process(elem):
    owner_user_id = int(elem.attrib['OwnerUserId']) if 'OwnerUserId' in elem.attrib else None
    tags = elem.attrib['Tags'] if elem.attrib['PostTypeId'] == '1' else None
    data = (int(elem.attrib['Id']), int(elem.attrib['PostTypeId']), elem.attrib['CreationDate'][:10], owner_user_id, tags)

    return cur.mogrify('(%s,%s,%s,%s,%s)', data)


recreate = True

conn = pymysql.connect(host=host, user=user, passwd=passwd, db=db_name, charset='utf8')
cur = conn.cursor()

if recreate:
    recreate_table(cur)

start_time = datetime.now()

xml_file = os.path.join(xml_files_dir, 'Posts.xml')
insert_query = 'INSERT INTO Posts VALUES '

context = ET.iterparse(xml_file, events=('end',), tag='row')
fast_iter(context, row_process, conn, cur, insert_query)

conn.commit()
conn.close()

end_time = datetime.now()
time_delta = end_time - start_time
print('XML file:', xml_file, 'Took', time_delta.total_seconds(), 'seconds')
