const puppeteer = require('puppeteer');
const config = require('./config');
const url = require('url');
const fs = require('fs');
const { exception } = require('console');

function pause(ms) {
    // If time not specified, pause forever
    if(!ms) return new Promise(() => {});

    return new Promise(resolve => setTimeout(resolve, ms));
}

function interceptRequest(request) {
    // Amap ipLocation mock
    if(request.url().startsWith("https://webapi.amap.com/maps/ipLocation")){
        const body = {
            "info": "LOCATE_SUCCESS",
            "status": 1,
            "lng": config.coords.longitude.toString(),
            "lat": config.coords.latitude.toString(),
        };
        const callback = url.parse(request.url(), true).query.callback;
        const responce = `${callback}(${JSON.stringify(body)})`;

        request.respond({
            content: 'application/javascript',
            headers: {"Access-Control-Allow-Origin": "*"},
            body: responce,
        });
    } 
    else {
        request.continue();
    }
}

function screenshotPrefix(){
    const date = new Date().toISOString().replace(/:| /g, '-');
    const path = config.screenshotPath;
    return `${path}/${date}`
}

async function yiqingtongActions(page){
    // Login page
    await page.goto('https://xxcapp.xidian.edu.cn/ncov/wap/default/index');
    await page.waitForNavigation({waitUntil:'networkidle0'});
    console.log("✔️  成功加载登陆页面");

    await page.waitForSelector('input[type=text]');
    await page.waitForSelector('input[type=password]');

    await page.type('input[type=text]', config.username);
    await page.type('input[type=password]', config.password);
    await page.click('div.btn');

    // Main Page
    // Geolocation Section
    await page.waitForNavigation();
    console.log("✔️  登陆成功，成功加载填报页面");

    const locationField = await page.$("div[name=area] > input[readonly=readonly]");
    await locationField.click();

    // Wait for loader to appear & disapper
    await page.waitForSelector('div.page-loading-container');
    await page.waitForSelector('div.page-loading-container', {hidden: true});

    // location should now be ready
    const locResult = await locationField.evaluate(el => el.value);
    console.log(`✔️  成功获取地理位置: ${locResult}`);
    
    await page.screenshot({path: `${screenshotPrefix()}-location.png`});

    // Submit
    await page.click('div.footers > a');
    await page.waitForSelector('div.page-loading-container', {hidden: true});
    await page.waitForSelector('div.wapcf-inner');
    console.log("✔️  出现确认框");

    // Confirm
    await page.click('div.wapcf-btn-ok');
    await page.waitForSelector('div.page-loading-container', {hidden: true});
    await page.waitForSelector('div.wapat-inner');
    console.log("✔️  已经确认，填报成功");

    const resultPath = `${screenshotPrefix()}-result.png`
    await page.screenshot({path: resultPath});
    console.log(`✔️  结果截图已保存至 ${resultPath}`);
}

async function checkupActions(page){
    // Login page
    await page.goto('https://xxcapp.xidian.edu.cn/site/ncov/xidiandailyup');
    await page.waitForNavigation({waitUntil:'networkidle0'});
    console.log("✔️  成功加载登陆页面");

    await page.waitForSelector('input[type=text]');
    await page.waitForSelector('input[type=password]');

    await page.type('input[type=text]', config.username);
    await page.type('input[type=password]', config.password);
    await page.click('div.btn');

    // Main Page
    // Geolocation Section
    await page.waitForNavigation();
    console.log("✔️  登陆成功，成功加载填报页面");

    await page.waitForSelector('div[name=area] > input[readonly=readonly]', {visible: true});
    const locationField = await page.$("div[name=area] > input[readonly=readonly]");
    await locationField.click();

    // // TODO: currently div.page-loading-container doesn't appear on servers
    // // Wait for loader to appear & disapper
    // try{
    //     await page.waitForSelector('div.page-loading-container');
    // } catch(e) {
        
    // }
    // await page.waitForSelector('div.page-loading-container', {hidden: true});

    // Workaround: just give it a 3 second timeout
    await pause(3000);

    // location should now be ready
    const locResult = await locationField.evaluate(el => el.value);
    console.log(`✔️  成功获取地理位置: ${locResult}`);
    
    await page.screenshot({path: `${screenshotPrefix()}-location.png`});

    // Submit
    const submitBtn = await page.$("div.footers > a");
    const submitTxt = await submitBtn.evaluate(el => el.innerText.split('\n')[0]);
    if(submitTxt.startsWith("您已提交过信息") || submitTxt.startsWith("未到填报时间")){
        console.log("✔️  当前时段已填报过疫情通");
        await submitBtn.hover();
        await page.screenshot({path: `${screenshotPrefix()}-result.png`});
        return;
    }

    await page.click('div.footers > a');
    await page.waitForSelector('div.page-loading-container', {hidden: true});
    await page.waitForSelector('div.wapcf-inner');
    console.log("✔️  出现确认框");

    // Confirm
    await page.click('div.wapcf-btn-ok');
    await page.waitForSelector('div.page-loading-container', {hidden: true});

    await page.waitForSelector('p.success');

    console.log("✔️  已经确认，填报成功");

    const resultPath = `${screenshotPrefix()}-result.png`
    await page.screenshot({path: resultPath});
    console.log(`✔️  结果截图已保存至 ${resultPath}`);
}

(async () => {
    const browser = await puppeteer.launch(config.lanuchConfig());
    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(15000);
    page.setDefaultTimeout(5000);

    await page.emulate(puppeteer.devices['iPad']);

    await page.setRequestInterception(true);
    page.on('request', interceptRequest);

    await page.setGeolocation(config.coords);

    // Grant geolocation rights to bypass popup
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(
        'https://xxcapp.xidian.edu.cn', 
        ['geolocation']
    );
    
    try{
        if(config.mode == "yiqingtong"){
            console.log("✔️  开始疫情通填报");
            await yiqingtongActions(page);
        } else if(config.mode == "checkup"){
            console.log("✔️  开始晨午晚检填报");
            await checkupActions(page);
        } else {
            throw Error("Mode should be \"yiqingtong\" or \"checkup\"");
        }
    } catch(e) {
        const screenshot = `${screenshotPrefix()}-error.png`;
        await page.screenshot({path: screenshot});
        const html = await page.content();
        fs.writeFileSync(`${screenshotPrefix()}-error.html`, html);
        console.log(`❌ 填报失败, 截图与HTML已保存于 ${config.screenshotPath}`);
        console.log(e)
    } finally {
        if(config.debug){ 
            await pause(); 
        }

        await browser.close();
    }
})();
