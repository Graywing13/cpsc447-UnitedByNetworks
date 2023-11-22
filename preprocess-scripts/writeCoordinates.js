// refactor to match code structure of other script files
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const socialCapitalFilePath = '../data/preprocessed-social-capital-usa-colleges.csv';
const usZipsFilePath = '../data/uszips.csv';
const outputFilePath = '../data/preprocessed-social-capital-usa-colleges.csv';

// Read uszips.csv into a dictionary for easy lookup
const usZipsData = {};
fs.createReadStream(usZipsFilePath)
  .pipe(csv())
  .on('data', (row) => {
    usZipsData[row.zip] = { lat: row.lat, lon: row.lng };
  })
  .on('end', () => {
    // Process social capital data
    const updatedSocialCapitalData = [];

    fs.createReadStream(socialCapitalFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Skip header row
        if (row.zip === 'zip') {
          return;
        }

        const zipCode = row.zip;
        const zipData = usZipsData[zipCode];

        if (zipData) {
          // Append lat and lon columns to the row
          row.lat = zipData.lat;
          row.lon = zipData.lon;
        } else {
          console.warn(`No data found for zip code ${zipCode}`);

          // Find the closest zip code based on numerical proximity
          let closestZip = null;
          let minDifference = Number.MAX_VALUE;

          for (const usZip in usZipsData) {
            const difference = Math.abs(parseInt(usZip) - parseInt(zipCode));
            if (difference < minDifference) {
              minDifference = difference;
              closestZip = usZip;
            }
          }

          if (closestZip) {
            const closestZipData = usZipsData[closestZip];
            console.log(`Changing zip code ${zipCode} to ${closestZip}`);
            // Update the zip code and append lat and lon columns to the row
            row.zip = closestZip;
            row.lat = closestZipData.lat;
            row.lon = closestZipData.lon;
          } else {
            console.error(`No closest zip found for zip code ${zipCode}`);
          }
        }

        updatedSocialCapitalData.push(row);
      })
      .on('end', () => {
        // Write the updated data to a new CSV file
        const csvWriter = createCsvWriter({
          path: outputFilePath,
          header: Object.keys(updatedSocialCapitalData[0]).map((key) => ({ id: key, title: key })),
        });

        csvWriter
          .writeRecords(updatedSocialCapitalData)
          .then(() => console.log('Preprocessing completed.'))
          .catch((error) => console.error(`Error writing to output file: ${error.message}`));
      });
  });
