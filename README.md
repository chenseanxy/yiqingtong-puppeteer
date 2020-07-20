# 自动疫情通填报 - Puppeteer版

 -- A project 6 months too late. Powered by Puppeteer

支持模拟位置信息。

## 如何使用 - Docker - 将在更新后支持

运行时需将`<Your-ID-Here>`及`<Your-Password-Here>`分别换成学号及统一认证登陆密码

```bash
mkdir tests_output && mkdir screens

docker run --rm \
    -e NW_USERNAME=<Your-ID-Here> \
    -e NW_PASSWORD=<Your-Password-Here> \
    -v $PWD/tests_output:/usr/src/app/tests_output \
    -v $PWD/screens:/usr/src/app/screens \
    chenseanxy/yiqingtong
```

### Cron Scheduling

在服务器上使用Cron定时运行：这里使用Ofelia来执行Docker相关定时任务。

#### 配置环境变量

将`.env.example`重命名至`.env`，并编辑，在其中填上统一认证的用户名（学号）与密码，以及希望模拟的经纬度坐标(格式：经度,纬度)

#### 启动服务

```bash
mkdir tests_output && mkdir screens
docker-compose up -d
```

其中`docker-compose.yml`中 `0 15 16 * * *`表示在每天0:15:00执行（使用UTC时间，为UTC 16:15:00）。

## 如何使用 - 本地安装

### 安装Node.js

自行百度/谷歌，完成后使用`node --version`确保Node成功安装，并`npm --version`确定npm可用

### Clone本仓库

```bash
git clone https://github.com/chenseanxy/yiqingtong-puppeteer.git
cd yiqingtong-puppeteer
```

### 安装依赖

`npm install`

### 配置环境变量

将`.env.example`重命名至`.env`，并编辑，在其中填上统一认证的用户名（学号）与密码，以及希望模拟的经纬度坐标(格式：经度,纬度)

### 填报

`node .`，如果有报错可以在screens里查看报错时截屏
