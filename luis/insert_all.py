import subprocess

creating_dbs = True
#regions = ['es', 'pt', 'ru', 'ja']
regions = ['es']  #en is the big boy, should run separately

#if creating_dbs:
#    subprocess.run(['python3', 'create_dbs.py'])

for region in regions:
    print('Importing files for region:', region)

    subprocess.call(['python3', 'insert_posts.py', region], shell=True)
    subprocess.call(['python3', 'insert_votes.py', region], shell=True)
    subprocess.call(['python3', 'insert_comments.py', region], shell=True)

    print()

print('Done')

