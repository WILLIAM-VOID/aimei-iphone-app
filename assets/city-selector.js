/* City selection stays on this device. Coordinates never leave the browser. */
(() => {
  const storageKey='aesthetic_selected_city_v1';
  const cities=[
    ['北京',39.9042,116.4074],['上海',31.2304,121.4737],['广州',23.1291,113.2644],
    ['深圳',22.5431,114.0579],['杭州',30.2741,120.1551],['成都',30.5728,104.0668],
    ['重庆',29.5630,106.5516],['武汉',30.5928,114.3055],['南京',32.0603,118.7969],
    ['苏州',31.2989,120.5853],['天津',39.3434,117.3616],['西安',34.3416,108.9398],
    ['长沙',28.2282,112.9388],['郑州',34.7466,113.6254],['青岛',36.0671,120.3826],
    ['济南',36.6512,117.1201],['合肥',31.8206,117.2272],['厦门',24.4798,118.0894],
    ['福州',26.0745,119.2965],['昆明',25.0389,102.7183]
  ];
  const dialog=document.getElementById('cityDialog');
  const status=document.getElementById('cityLocationStatus');
  const options=document.getElementById('cityOptions');
  const topLabel=document.getElementById('homeCityButton');
  const navLabel=document.getElementById('homeNavCity');
  let current='';
  try{current=localStorage.getItem(storageKey)||''}catch(_){}
  function refresh(){topLabel.textContent=(current||'选择城市')+'⌄';navLabel.textContent=current||'城市'}
  function select(name){
    const trimmed=String(name||'').trim().replace(/\s+/g,' ').slice(0,16);
    if(!trimmed){status.textContent='请输入城市名称';return}
    current=trimmed;
    try{localStorage.setItem(storageKey,current)}catch(_){}
    refresh();close();
    if(typeof showHomeToast==='function')showHomeToast(`已切换到${current}`);
  }
  function open(){
    options.innerHTML='';
    cities.forEach(([name])=>{
      const button=document.createElement('button');
      button.type='button';button.textContent=name;
      button.className=name===current?'selected':'';
      button.addEventListener('click',()=>select(name));
      options.appendChild(button);
    });
    if(!dialog.open){if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','')}
  }
  function close(){if(dialog.open){if(dialog.close)dialog.close();else dialog.removeAttribute('open')}}
  function distance(a,b,c,d){
    const rad=Math.PI/180;
    const y=(c-a)*rad,x=(d-b)*rad;
    const h=Math.sin(y/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(x/2)**2;
    return 12742*Math.asin(Math.sqrt(h));
  }
  function locate(){
    if(!navigator.geolocation){status.textContent='当前环境不支持定位，请手动选择城市';return}
    status.textContent='正在定位，仅在本机匹配城市…';
    navigator.geolocation.getCurrentPosition(position=>{
      const {latitude,longitude}=position.coords;
      const nearest=cities.map(city=>({name:city[0],km:distance(latitude,longitude,city[1],city[2])})).sort((a,b)=>a.km-b.km)[0];
      if(nearest&&nearest.km<=120)select(nearest.name);
      else status.textContent='附近没有预设城市，请在下方手动选择或输入城市';
    },error=>{status.textContent=error.code===1?'定位权限未开启，请手动选择城市':'定位暂不可用，请手动选择城市'},
    {enableHighAccuracy:false,timeout:10000,maximumAge:300000});
  }
  window.openCitySelector=open;
  window.closeCitySelector=close;
  window.locateCity=locate;
  window.selectCustomCity=()=>select(document.getElementById('cityCustomInput').value);
  dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
  refresh();
})();
