/*
poiSpeed/index.js
Version: 1.1  @2023/05/28
Wenchin Hsieh @Goomo.Net Studio, wenchin@goomo.net
*/

const zoomSize = 14;
const fileCamera = "camera.json"
const iColors = ['#FDD', '#FCC', '#FBB', '#FAA', '#F88', '#F66', '#F33', '#F00', '#E00', '#D00', '#C00', '#B00', '#A00', '#900'];
var map;


// 透過 GeoLocation API 取得 使用者經緯度座標
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        console.log("您使用的 Browser 不支援 GeoLocation API！");
    }
}


function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    console.log(`使用者座標： 經度 ${lon.toFixed(6)}，緯度 ${lat.toFixed(6)}`);
    initMap([lon, lat]);
}


function showError(error) {
    console.log('[Error: ' + error.code + '] ' + error.message);
}


// 初始化 Map 及所有圖層
function initMap(center) {
    // 建立底層 Tile Layer 電子地圖
    let tileLayer = new ol.layer.Tile({
        source: new ol.source.Stamen({
            layer: 'terrain',
        })
    });

    // 建立 Map Object
    map = new ol.Map({
        target: 'map',
        layers: [
            tileLayer,
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat(center),
            zoom: zoomSize,
        })
    });

    // 為地圖增添 比例尺 ScaleLine
    let myscale = new ol.control.ScaleLine({
        units: 'metric',
        bar: true,
        steps: 4,
        text: false,
        minWidth: 140,
    });
    map.addControl(myscale);

    // 為地圖增添 縮放滑桿 ZoomSlider
    let myzoomslider = new ol.control.ZoomSlider();
    map.addControl(myzoomslider);

    // 為不同速限的交通標誌 建立不同的 Styles
    let bord = new ol.style.Style({
        image: new ol.style.Circle({
            radius: 12,
            stroke: new ol.style.Stroke({ color: '#FFF', width: 5 }),
        }),
    });

    let speedStyles = [];

    for (let i = 0; i < iColors.length; i++) {
        let iStyle = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 12,
                fill: new ol.style.Fill({ color: 'rgba(255, 238, 238, 0.9)' }),
                stroke: new ol.style.Stroke({ color: iColors[i], width: 3 }),
            }),
            text: new ol.style.Text({
                text: (i * 10).toString(),
                offsetY: 1,
                scale: 1.2,
                stroke: new ol.style.Stroke({ color: 'white', width: 1 }),
            }),
        });

        speedStyles.push([bord, iStyle]);
    }

    // 匯入 測速執法點 Camera & 指派 Feature for n Points
    fetch(fileCamera)
        .then(response => response.text())
        .then(data => {
            let obj = JSON.parse(data);
            createCameraLayer(obj, speedStyles);
        })
        .catch(error => {
            console.log('Error:', error);
        });
}


// 建立上層 Vector Layer for 測速執法點
function createCameraLayer(obj, styles) {
    const cameraFeatures = [];

    for (let i = 0, cnt = obj.result.total; i < cnt; i++) {
        let r = obj.result.records[i];
        let f = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([r.Longitude, r.Latitude])),
            speedLimit: r.limit,
            address: r.Address,
            direct: r.direct,
        });

        f.setStyle(styles[(r.limit / 10) | 0]);
        cameraFeatures.push(f);
    }

    var cameraLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: cameraFeatures,
        }),
    });

    map.addLayer(cameraLayer);
}


// 先透過 GeoLocation 取得 使用者經緯度座標，再初始化 Map 及所有圖層
getLocation();