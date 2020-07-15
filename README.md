# makeflow-issue-synchronizer

## 部署

目前 Issue Synchronizer 是手动到 'power-apps.makeflow.com' 服务器去部署的。

1. 推送更改到 GitHub
2. 通过 ssh 连接到 `power-apps.makeflow.com` 服务器 ([连接方法](https://www.yuque.com/mufan/server-configuration/servers))
3. 进入 `/root/issue-synchronizer/makeflow-issue-synchronizer` 目录执行 `git pull` 拉取最新的代码
4. 执行 `./scrips/deploy.sh` 部署
