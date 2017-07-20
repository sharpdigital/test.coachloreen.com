const fs = require('fs');
const request = require('request');

const entriesByType = require('./entriesByType.json');
const assetFolder = '../assets';
const assetPaths = ['products.image', 'resources.image', 'resources.file', 'blogArticles.image', 'page.image'];
let assetsToSave = [];

function download(uri, filename, successCallback, errorCallback){
  request.head(uri, function(err, res, body){
    request(uri)
      .pipe(fs.createWriteStream(filename))
      .on('close', successCallback)
      .on('error', errorCallback);
  });
};

function saveAssets() {
  //console.log('#### expect to download asset:', assetsToSave.length);
  assetsToSave.map((asset) => {
    let url = `http:${asset.file.url}`;
    let origExt = asset.file.contentType.split('/')[1];
    let filename = `${assetFolder}/${asset.id}.${origExt}`;
    download(
      url,
      filename,
      (close) => {
        //console.log('#### [CLOSE downloading asset]:', asset);
      },
      (error) => {
        console.log('#### [ERROR downloading asset]:', error);
      }
    );
  });
}

function getAssetFromEntry(entry, fieldName) {
  if (entry.fields.hasOwnProperty(fieldName) && !!entry.fields[fieldName].fields) {
    assetsToSave.push(
      Object.assign(
        entry.fields[fieldName].fields,
        {
          id: entry.fields[fieldName].sys.id
        }
      )
    );
  }
}

function getAssetsByPath(assetPath) {
  if (!!assetPath) {
    const [contentType, fieldName] = assetPath.split('.');

    if (!!entriesByType[contentType] && !!entriesByType[contentType].map) {
      entriesByType[contentType].map((entry) => getAssetFromEntry(entry, fieldName));
    }
  }
}

assetPaths.map((assetPath) => getAssetsByPath(assetPath));

saveAssets();
