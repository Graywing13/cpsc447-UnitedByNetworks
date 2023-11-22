// Credit to websites are listed in README.md under "Preprocess CSV"
const fs = require('fs');
const csv = require('csv');

const PATH = '../data/'
const FILE_NAME = 'preprocessed-social-capital-usa-colleges.csv'
const READ_FILE = PATH + FILE_NAME
const WRITE_FILE = PATH + 'new-' + FILE_NAME

const PARENT_SES_FIELD = {name: 'ec_parent_ses_college', index: 7}
const STUDENT_SES_FIELD = {name: 'ec_own_ses_college', index: 5}

const readStream = fs.createReadStream(READ_FILE)
const writeStream = fs.createWriteStream(WRITE_FILE)

const parse = csv.parse()

// Add related quarter data to each row
let firstRowParsed = false;
const transform = csv.transform((row, callback) => {
    let result = row

    if (!firstRowParsed) {
        result.push('change_ses')
        firstRowParsed = true
    } else {
        const parentSesValue = row[PARENT_SES_FIELD.index]
        const studentSesValue = row[STUDENT_SES_FIELD.index]

        if (parentSesValue === '' || studentSesValue === '') {
            result.push('')
        } else {
            result.push(studentSesValue - parentSesValue)
        }
    }

    result += '\n'
    callback(null, result)
})
    .on('error', err => console.error(err.message))
    .on('end', () => console.log("Completed preprocessing."))

// Use streams to read, add quarters, and write the data
readStream.pipe(parse).pipe(transform).pipe(writeStream);
