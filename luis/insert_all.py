import subprocess

creating_dbs = True
#regions = ['es']
regions = ['es', 'pt', 'ru', 'ja']
#regions = ['en']  #en is the big boy, should run separately

if creating_dbs:
    subprocess.run(['python3', 'create_dbs.py'])

for region in regions:
    print('Importing files for region:', region)

    subprocess.run(['python3', 'insert_posts.py', region])
    subprocess.run(['python3', 'insert_votes.py', region])
    subprocess.run(['python3', 'insert_comments.py', region])

    print()

print('Done')

