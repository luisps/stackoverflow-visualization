from global_variables import *

def recreate_table(cur):

    drop_table_query = 'DROP TABLE IF EXISTS Posts'
    cur.execute(drop_table_query)

    create_table_query = '''\
CREATE TABLE Posts (
    Id int8 NOT NULL,
    PostTypeId int2 NOT NULL,
    ParentId int8,
    CreationDate date NOT NULL,
    OwnerUserId int8,
    Tags text,
    PRIMARY KEY (Id)
);\
    '''
    cur.execute(create_table_query)

def row_process(elem):
    tags = elem.attrib['Tags'] if elem.attrib['PostTypeId'] == '1' else None

    data = (
            int(elem.attrib['Id']),
            int(elem.attrib['PostTypeId']),
            int_or_none(elem, 'ParentId'),
            elem.attrib['CreationDate'][:10],
            int_or_none(elem, 'OwnerUserId'),
            tags
           )

    return cur.mogrify('(%s,%s,%s,%s,%s,%s)', data)


recreate = True

if recreate:
    recreate_table(cur)
    conn.commit()

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
