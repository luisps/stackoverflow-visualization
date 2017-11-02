from global_variables import *

def recreate_table(cur):

    drop_table_query = 'DROP TABLE IF EXISTS Comments'
    cur.execute(drop_table_query)

    create_table_query = '''\
CREATE TABLE Comments (
    Id int8 NOT NULL,
    PostId int8 NOT NULL,
    CreationDate date NOT NULL,
    OwnerUserId int8,
    PRIMARY KEY (Id)
);\
    '''
    cur.execute(create_table_query)

def row_process(elem):

    data = (
            int(elem.attrib['Id']),
            int(elem.attrib['PostId']),
            elem.attrib['CreationDate'][:10],
            int_or_none(elem, 'UserId')
           )

    return cur.mogrify('(%s,%s,%s,%s)', data)


recreate = True

if recreate:
    recreate_table(cur)
    conn.commit()

start_time = datetime.now()

xml_file = os.path.join(xml_files_dir, 'Comments.xml')
insert_query = 'INSERT INTO Comments VALUES '

context = ET.iterparse(xml_file, events=('end',), tag='row')
fast_iter(context, row_process, conn, cur, insert_query)

conn.commit()
conn.close()

end_time = datetime.now()
time_delta = end_time - start_time
print('XML file:', xml_file, 'Took', time_delta.total_seconds(), 'seconds')
