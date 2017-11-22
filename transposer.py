import csv
import os


def transpose_community(community):
    data = {}
    path = 'web/data/' + community + '_community.csv'
    path_tmp = 'web/data/' + community + '_community.tmp'

    # Read
    with open(path, 'rt') as file:
        reader = csv.reader(file, delimiter=',', quotechar='"')
        header = next(reader, None)  # Skip the header
        if len(header) != 9:
            exit("Invalid CSV file. Please make sure you're transposing the original output")

        for row in reader:
            year, month, day, tag, answercount, commentcount, questioncount, upvotes, downvotes = row

            key = tag
            column = '-'.join([year, month, day])
            value = '-'.join([answercount, commentcount, questioncount, upvotes, downvotes])

            result = data.get(key, {})
            result[column] = value
            data[key] = result

    # Write
    with open(path_tmp, 'wt', newline='') as file:
        writer = csv.writer(file, delimiter=',', quotechar='"')
        writer.writerow(['tag'] + list(list(data.values())[0].keys()))

        for tag in data:
            writer.writerow([tag] + list(data[tag].values()))

    # Clean
    os.remove(path)
    os.rename(path_tmp, path)


def transpose_skills(community):
    data = {}
    path = 'web/data/' + community + '_skills.csv'
    path_tmp = 'web/data/' + community + '_skills.tmp'

    # Read
    with open(path, 'rt') as file:
        reader = csv.reader(file, delimiter=',', quotechar='"')
        header = next(reader, None)  # Skip the header
        if len(header) != 5:
            exit("Invalid CSV file. Please make sure you're transposing the original output")

        for row in reader:
            year, month, count, tag1, tag2 = row

            key = '-'.join([tag1, tag2])
            column = '-'.join([year, month])
            value = '-'.join([count])

            result = data.get(key, {})
            result[column] = value
            data[key] = result

    # Write
    with open(path_tmp, 'wt', newline='') as file:
        writer = csv.writer(file, delimiter=',', quotechar='"')
        writer.writerow(['tag1', 'tag2'] + list(list(data.values())[0].keys()))

        for tags in data:
            writer.writerow(tags.split('-') + list(data[tags].values()))

    # Clean
    os.remove(path)
    os.rename(path_tmp, path)


transpose_community('es.stackoverflow.com')
transpose_skills('es.stackoverflow.com')
