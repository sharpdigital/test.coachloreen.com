const DataTransform = require("node-json-transform").DataTransform;
const YAML = require('yamljs');
const fs = require('fs');

const entriesByType = require('./entriesByType.json');

const projectRoot = '../';

const imageOperate = {
  on: 'image',
  run: processImage
};

const categoriesOperate = {
  on: 'categories',
  run: processCategories
};

const config = [
  {
    contentType: 'tiles',
    type: 'json',
    path: '_data/tiles.json',
    bulk: true,
    map: {
      list: 'tiles',
      item: {
        image: 'fields.content.fields.image',
        title: 'fields.content',
        slug: 'fields.content.fields.slug',
        type: 'fields.content.sys.contentType.sys.id',
        order: 'fields.order'
      },
      operate: [
        {
          on: 'title',
          run: (content) => {
            if (content.sys.contentType) {
              switch (content.sys.contentType.sys.id) {
                case 'blogArticles':
                  return content.fields.articleTitle;
                break;
                case 'page':
                  return content.fields.pageTitle;
                break;
                case 'resources':
                case 'products':
                case 'category':
                  return content.fields.name;
                break;
              }
            }
          }
        },
        {
          on: 'type',
          run: (type) => {
            let typeMap = {
              blogArticles: 'blog',
              page: '.',
              resources: 'health-resources',
              products: 'wellbeing-products',
              category: 'category'
            };
            return typeMap[type];
          }
        },
        imageOperate
      ]
    }
  },
  {
    contentType: 'category',
    type: 'json',
    path: '_data/categories.json',
    bulk: true,
    map: {
      list: 'category',
      item: {
        id: 'sys.id',
        name: 'fields.name',
        slug: 'fields.slug',
      }
    }
  },
  {
    contentType: 'blogArticles',
    type: 'yaml|markdown',
    path: '_posts/',
    filename: '{item.date}-{item.slug}.markdown',
    bulk: false,
    map: {
      list: 'blogArticles',
      item: {
        slug: 'fields.slug',
        title: 'fields.articleTitle',
        date: 'fields.publishDate',
        image: 'fields.image',
        intro: 'fields.intro',
        content: 'fields.content',
        categories: 'fields.relatedCategories'
      },
      operate: [imageOperate, categoriesOperate, {
        on: 'date',
        run: (date) => {
          if (!!date) return date.split('T')[0];
        }
      }],
      each: (item) => {
        item.layout = 'post';
        return item;
      }
    },
    template: "{front-matter}\n\n{content}"
  },
  {
    contentType: 'products',
    type: 'yaml|markdown',
    path: '_products/',
    filename: '{item.slug}.markdown',
    bulk: false,
    map: {
      list: 'products',
      item: {
        slug: 'fields.slug',
        title: 'fields.name',
        description: 'fields.description',
        image: 'fields.image',
        price: 'fields.price',
        videoUrls: 'fields.videoUrls',
        content: 'fields.content',
        categories: 'fields.relatedCategories'
      },
      operate: [imageOperate, categoriesOperate],
      each: (item) => {
        item.layout = 'page';
        return item;
      }
    },
    template: "{front-matter}\n\n{content}"
  },
  {
    contentType: 'resources',
    type: 'yaml|markdown',
    path: '_resources/',
    filename: '{item.slug}.markdown',
    bulk: false,
    map: {
      list: 'resources',
      item: {
        slug: 'fields.slug',
        title: 'fields.name',
        description: 'fields.description',
        image: 'fields.image',
        file: 'fileds.file',
        price: 'fields.price',
        videoUrls: 'fields.videoUrls',
        content: 'fields.content',
        categories: 'fields.relatedCategories'
      },
      operate: [imageOperate, categoriesOperate],
      each: (item) => {
        item.layout = 'page';
        return item;
      }
    },
    template: "{front-matter}\n\n{content}"
  },
  {
    contentType: 'page',
    type: 'yaml|md',
    path: '',
    filename: '{item.slug}.md',
    bulk: false,
    map: {
      list: 'page',
      item: {
        permalink: 'fields.slug',
        slug: 'fields.slug',
        title: 'fields.pageTitle',
        image: 'fields.image',
        intro: 'fields.intro',
        content: 'fields.content'
      },
      operate: [ imageOperate, {
        on: 'permalink',
        run: (permalink) => '/' + permalink + '/'
      }],
      each: (item) => {
        item.layout = 'page';
        return item;
      }
    },
    template: "{front-matter}\n\n{content}"
  },
];

function processImage(image) { if (!!image && !!image.fields && !!image.fields.file) return `/assets/${image.sys.id}.${image.fields.file.contentType.split('/')[1]}`; }

function processCategories(categories) { if (!!categories) return categories.map((category) => category.fields.name); }

function saveData(dataToSave, contentType) {
  //console.log('##### save data', contentType.map.list, dataToSave.length);
  if (dataToSave.length && dataToSave.length > 0){
    //console.log('#### sort');
    var orderBy = null;
    if (dataToSave[0].date) orderBy = 'date';
    if (dataToSave[0].order) orderBy = 'order';

    if (!!orderBy) {
      //console.log('#### by', orderBy);
      dataToSave = dataToSave.sort(function(a, b) {
        if (!a[orderBy]) return 1;
        if (!b[orderBy]) return -1;
        if (a[orderBy] > b[orderBy]) {
          if (orderBy == 'date')
            return -1;
          else
            return 1;
        }
        if (a[orderBy] < b[orderBy]) {
          if (orderBy == 'date')
            return 1;
          else
            return -1;
        }
        return 0;
      });
    }
  }
  if (contentType.bulk) {
    fs.writeFileSync(`${projectRoot}${contentType.path}`, JSON.stringify(dataToSave));
  } else {
    fs.writeFileSync(`${projectRoot}_data/${contentType.contentType}.json`, JSON.stringify(dataToSave));

    if (!!dataToSave.map) {
      let path = `${projectRoot}${contentType.path}`;
      dataToSave.map((item) => {
        //console.log('*****  [DATATOSAVE]:', contentType.filename, ' date:', item.date, ' slug:', item.slug);
        let filename = path + contentType.filename.replace('{item.slug}', item.slug);
        let hasDate = filename.indexOf('{item.date}') > -1;
        //console.log('***** [FILENAME halfway]:', hasDate, JSON.stringify(filename));
        if (hasDate) {
          filename = filename.replace('{item.date}', item.date);
        }
        //console.log('***** [FILENAME end]:', JSON.stringify(filename));
        let frontMatter = `---\n${YAML.stringify(item)}\n---`;
        let fileContent = contentType.template
          .replace('{front-matter}', frontMatter)
          .replace('{content}', item.content);

        fs.writeFileSync(filename, fileContent);
      });
    }
  }
}

config.map((contentType) => {
  let dataTransform = DataTransform(entriesByType, contentType.map);
  let dataToSave = dataTransform.transform();
  saveData(dataToSave, contentType);
});