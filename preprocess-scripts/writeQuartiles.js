// Credit to websites are listed in README.md under "Preprocess CSV"
const fs = require('fs');
const csv = require('csv');

const PATH = '../data/'
const FILE_NAME = 'social-capital-usa-colleges.csv'
const READ_FILE = PATH + FILE_NAME
const WRITE_FILE = PATH + 'preprocessed-' + FILE_NAME

// Quartile metadata. `quartiles` are as follows: [ min, 1st-quartile, median, 3rd-quartile, max + delta ].
//   - A small delta is added to the max to ensure the largest number is assigned a quarter as well.
//   - Quartiles were calculated in excel using the formula =QUARTILE(INDIRECT(<row letter> & ":"& <row letter>), <quartile number>)
const FIELDS_TO_QUANTIZE = [
    {name: 'ec_parent_ses_college', index: 7, quartiles: [0.27296999, 0.881819975, 1.14026, 1.3625, 1.73146 + 0.00001]},
    {name: 'bias_own_ses_college', index: 15, quartiles: [-0.15622, -0.0197575, -0.00238, 0.0272075, 0.38223001 + 0.00000001]}
]

const readStream = fs.createReadStream(READ_FILE)
const writeStream = fs.createWriteStream(WRITE_FILE)

const parse = csv.parse()

// Add related quarter data to each row
let firstRowParsed = false;
const transform = csv.transform((row, callback) => {
    let result = row

    if (!firstRowParsed) {
        // This is the first row; add field names to csv headers
        FIELDS_TO_QUANTIZE.forEach(field => result.push(`${field.name}_quartile`))

        firstRowParsed = true;
    } else {
        // For every field to quantize, find and record its quarter (1st quarter = lowest 25%; 4th = top 25%)
        FIELDS_TO_QUANTIZE.forEach(field => {
            const fieldValue = row[field.index]
            const fieldQuarter = fieldValue || fieldValue === 0
                ? field.quartiles.findIndex((quartileThreshold) => fieldValue < quartileThreshold)
                : ''

            result.push(fieldQuarter)
        })
    }

    result += '\n'
    callback(null, result)
})
    .on('error', err => console.error(err.message))
    .on('end', () => console.log("Completed preprocessing."))

// Use streams to read, add quarters, and write the data
readStream.pipe(parse).pipe(transform).pipe(writeStream);
