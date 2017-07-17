'use strict'

const contentful = require('contentful')
const chalk = require('chalk')
const fs = require('fs');

const SPACE_ID = '3inxc2wsnyz3'
const ACCESS_TOKEN = 'c8d1c94dfd01299e5d124ecea279dba135fd67cce972a77f5d8520863a0330a7'

let entries = {};
let entriesByType = {};

function addEntry(entry, contentType) {
  if (!entriesByType.hasOwnProperty(contentType.sys.id)) {
    entriesByType[contentType.sys.id] = [];
  }
  entriesByType[contentType.sys.id].push(entry);
  entries[entry.sys.id] = entry;
};

const client = contentful.createClient({
  space: SPACE_ID,
  accessToken: ACCESS_TOKEN
})

function runBoilerplate () {
  displayContentTypes()
    .then(displayEntries)
    .then(() => {
      fs.writeFileSync('entries.json', JSON.stringify(entries));
      fs.writeFileSync('entriesByType.json', JSON.stringify(entriesByType));
    })
    .catch((error) => {
      console.log(chalk.red('\nError occurred:'))
      if (error.stack) {
        console.error(error.stack)
        return
      }
      console.error(error)
    })
}

function displayContentTypes () {
  return fetchContentTypes()
    .then((contentTypes) => contentTypes)
}

function displayEntries (contentTypes) {
  return Promise.all(contentTypes.map((contentType) => {
    return fetchEntriesForContentType(contentType)
      .then((entries) => entries.forEach((entry) => addEntry(entry, contentType)));
  }))
}

// Load all Content Types in your space from Contentful
function fetchContentTypes () {
  return client.getContentTypes()
    .then((response) => response.items)
    .catch((error) => {
      console.log(chalk.red('\nError occurred while fetching Content Types:'))
      console.error(error)
    })
}

// Load all entries for a given Content Type from Contentful
function fetchEntriesForContentType (contentType) {
  return client.getEntries({ content_type: contentType.sys.id })
    .then((response) => {
      console.log(chalk.green(`\n ${chalk.cyan(contentType.name)}: ${response.items.length}`))
      return response.items
    })
    .catch((error) => {
      console.log(chalk.red(`\nError occurred while fetching Entries for ${chalk.cyan(contentType.name)}:`))
      console.error(error)
    })
}

runBoilerplate()
