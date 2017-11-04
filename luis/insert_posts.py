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
    ViewCount int8,
    AnswerCount int8,
    CommentCount int8,
    OwnerUserId int8,
    Tags text,
    PRIMARY KEY (Id)
);\
    '''
    cur.execute(create_table_query)

def recreate_index(cur):

    drop_index_query = 'DROP INDEX IF EXISTS posts_creationdate_id_idx'
    cur.execute(drop_index_query)

    create_idex_query = '''
CREATE INDEX posts_creationdate_id_idx ON public.posts ("creationdate", "id")
    '''
    cur.execute(create_idex_query)

def row_process(elem):
    tags = elem.attrib['Tags'][1:-1] if elem.attrib['PostTypeId'] == '1' else None

    data = (
            int(elem.attrib['Id']),
            int(elem.attrib['PostTypeId']),
            int_or_none(elem, 'ParentId'),
            elem.attrib['CreationDate'][:10],
            int_or_none(elem, 'ViewCount'),
            int_or_none(elem, 'AnswerCount'),
            int(elem.attrib['CommentCount']),
            int_or_none(elem, 'OwnerUserId'),
            tags
           )

    return cur.mogrify('(%s,%s,%s,%s,%s,%s,%s,%s,%s)', data)


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

if recreate:
    recreate_index(cur)
    conn.commit()

conn.close()

end_time = datetime.now()
time_delta = end_time - start_time
print('XML file:', xml_file, 'Took', time_delta.total_seconds(), 'seconds')
