module.exports = {
  http: {
    port: 8888,
  },
  mongodb: {
    uri: 'mongodb://mongo:27017',
    name: 'issue-synchronizer',
  },
  zookeeper: {
    host: 'zookeeper',
    port: 2181,
  },
};
