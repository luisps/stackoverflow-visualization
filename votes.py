import psycopg2
from lxml import etree as ET
import time

# 1. Acquire DB connection
debug_start = time.time()
conn = psycopg2.connect("dbname='vi' user='postgres' host='localhost' password='postgres'")
cur = conn.cursor()
print("Acquire DB connection took " + str(round(time.time() - debug_start)) + ' s')

# 2. Truncate previous import
debug_start = time.time()
cur.execute("TRUNCATE public.votes")
print("Truncate took " + str(round(time.time() - debug_start)) + ' s')

# 3. Parse .xml in stream and bulk insert
debug_start = time.time()
debug_count = 0

bulk_size = 0
stmt_values = ''
for event, row in ET.iterparse('C:/Users/rjgta/Desktop/VI/Lab04/data/es.stackoverflow.com/Votes.xml', events=('end',), tag='row'):
    # 3.1. Parse row
    data = (int(row.attrib['PostId']), int(row.attrib['VoteTypeId']), row.attrib['CreationDate'][:10])

    # 3.2. Build statement
    stmt_values += ('' if bulk_size == 0 else ',') + cur.mogrify('(%s,%s,%s)', data).decode('utf-8')
    bulk_size += 1

    # 3.3. Bulk insert
    if bulk_size == 2048:
        cur.execute('INSERT INTO public.votes VALUES ' + stmt_values)
        conn.commit()

        debug_count += bulk_size
        if debug_count % 10240 == 0:
            print('Inserted ' + str(debug_count))

        bulk_size = 0
        stmt_values = ''

    # Clear everything
    row.clear()
    while row.getprevious() is not None:
        del row.getparent()[0]

# 3.4. Insert remaining values
cur.execute('INSERT INTO public.votes VALUES ' + stmt_values)
conn.commit()
stmt_values = ''

print('Bulk insert took ' + str(round(time.time() - debug_start)) + ' s')

# 4. Create index
debug_start = time.time()
cur.execute('CREATE INDEX votes_creationdate_postid_idx ON public.votes ("CreationDate", "PostId")')
conn.commit()

print('Create index took ' + str(round(time.time() - debug_start)) + ' s')