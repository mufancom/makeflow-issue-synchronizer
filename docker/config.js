module.exports = {
  http: {
    port: process.env['PORT'] || 8080,
  },
  mongodb: {
    uri: 'mongodb://mongo:27017',
    name: 'makeflow-issue-synchronizer',
  },
  zookeeper: {
    host: 'zookeeper',
    port: 2181,
  },
};
