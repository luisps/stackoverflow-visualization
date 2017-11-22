import csv
import os


def _transpose_write(path, path_tmp, data):
    with open(path_tmp, 'wt', newline='') as file:
        writer = csv.writer(file, delimiter=',', quotechar='"', lineterminator="\n")
        writer.writerow(['$date$'] + list(map(lambda n: n[0], list(data.values())[0])))

        for date in data:
            writer.writerow([date] + list(map(lambda n: n[1], data[date])))

    # Clean
    os.remove(path)
    os.rename(path_tmp, path)


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

            column = tag
            key = '-'.join([year, month, day])
            value = '-'.join([answercount, commentcount, questioncount, upvotes, downvotes])

            result = data.get(key, [])
            result.append((column, value))
            data[key] = result

    # Write
    _transpose_write(path, path_tmp, data)


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

            column = '$'.join([tag1, tag2])
            key = '-'.join([year, month])
            value = '-'.join([count])

            result = data.get(key, [])
            result.append((column, value))
            data[key] = result

    # Write
    _transpose_write(path, path_tmp, data)


transpose_community('es.stackoverflow.com')
transpose_skills('es.stackoverflow.com')
