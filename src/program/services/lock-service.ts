import {Client, CreateMode, createClient} from 'node-zookeeper-client';
import {Nominal} from 'tslang';
import * as v from 'villa';

export type LockServiceZookeeperLockPath = Nominal<
  string,
  'lock-service-zookeeper-lock-path'
>;

export interface ZookeeperOptions {
  host: string;
  port: number;
}

export interface LockServiceOptions {
  zookeeper: ZookeeperOptions;
}

export class LockService {
  private client: Client;

  constructor({zookeeper: {host, port}}: LockServiceOptions) {
    let client = createClient(`${host}:${port}`, {
      retries: Infinity,
    });

    client.connect();

    client.on('connected', () =>
      console.info('Lock service zookeeper client connected.'),
    );

    this.client = client;
  }

  async lock(resourceId: string): Promise<LockServiceZookeeperLockPath> {
    let client = this.client;

    let lockNodePath = `/lock-${resourceId}`;

    await v.call(client.mkdirp.bind(client), lockNodePath);

    let path = (await v.call(
      client.create.bind(client),
      `${lockNodePath}/lock-`,
      CreateMode.EPHEMERAL_SEQUENTIAL,
    )) as LockServiceZookeeperLockPath;

    let key = path.match(/[^/]+$/)![0];

    let keys: string[];

    while (true) {
      keys = await v.call(client.getChildren.bind(client), lockNodePath);

      keys.sort();

      if (key === keys[0]) {
        break;
      }

      let nextKey = keys[keys.indexOf(key) - 1];

      await new Promise<void>((resolve, reject) => {
        let handled = false;

        client.exists(
          `${lockNodePath}/${nextKey}`,
          () => {
            if (handled) {
              return;
            }

            resolve();
          },
          (error, stat) => {
            if (error) {
              reject(error);
              return;
            }

            if (stat) {
              return;
            }

            handled = true;
            resolve();
          },
        );
      });
    }

    return path;
  }

  async unlock(lockPath: LockServiceZookeeperLockPath): Promise<void> {
    let client = this.client;

    await v.call<void>(client.remove.bind(client), lockPath);
  }
}
