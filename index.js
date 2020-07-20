const puppeteer = require('puppeteer');
const config = require('./config');
const url = require('url');

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
    const date = new Date().toString().replace(/:| /g, '-');
    const path = config.screenshotPath;
    return `${path}/${date}`
}

async function actions(page){
    // Login page
    await page.goto('https://xxcapp.xidian.edu.cn/ncov/wap/default/index');
    console.log("✔️  成功加载登陆页面");

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

    // Confirm
    await page.click('div.wapcf-btn-ok');
    await page.waitForSelector('div.page-loading-container', {hidden: true});
    await page.waitForSelector('div.wapat-inner');

    await page.screenshot({path: `${screenshotPrefix()}-result.png`});
}

(async () => {
    const browser = await puppeteer.launch(config.lanuchConfig());
    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(5000);
    page.setDefaultTimeout(2000);

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
        await actions(page);
    } catch(e) {
        const screenshot = `${screenshotPrefix()}-error.png`;
        await page.screenshot({path: screenshot});
        console.log(`❌ 填报失败, 截图已保存于 ${screenshot}`);
    } finally {
        await browser.close();
    }
})();
