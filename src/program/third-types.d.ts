declare module 'socks-proxy-agent' {
  import {Agent} from 'http';

  class SocksProxyAgent extends Agent {
    constructor(socksURL: string);
  }

  export default SocksProxyAgent;
}
