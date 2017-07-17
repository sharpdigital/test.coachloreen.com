const fs = require('fs');
const request = require('request');

const entriesByType = require('./entriesByType.json');
const assetFolder = '../assets';
const assetPaths = ['products.image', 'resources.image', 'resources.file', 'blogArticles.image'];
let assetsToSave = [];

function download(uri, filename, callback){
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

function saveAssets() {
  assetsToSave.map((asset) => {
    let url = `http:${asset.file.url}`;
    let origExt = asset.file.contentType.split('/')[1];
    let filename = `${assetFolder}/${asset.id}.${origExt}`;
    download(url, filename, () => {});
  });
}

function getAssetFromEntry(entry, fieldName) {
  if (entry.fields.hasOwnProperty(fieldName)) {
    assetsToSave.push(Object.assign(entry.fields[fieldName].fields, { id: entry.fields[fieldName].sys.id }));
  }
}

function getAssetsByPath(assetPath) {
  const [contentType, fieldName] = assetPath.split('.');

  entriesByType[contentType].map((entry) => getAssetFromEntry(entry, fieldName));
}

assetPaths.map((assetPath) => getAssetsByPath(assetPath));

saveAssets();
