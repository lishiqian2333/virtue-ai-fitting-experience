const stage=document.getElementById("stage");
function fit(){stage.style.transform="translate(-50%,-50%) scale("+Math.min(innerWidth/1920,innerHeight/1080)+")"}
addEventListener("resize",fit);fit();

const GARMENTS=[
  {key:"r1",image:"R1.png",series:"daily",name:"日常通勤造型 01",desc:"轻盈衬衫｜清爽通勤",match:96},
  {key:"r2",image:"R2.png",series:"daily",name:"日常通勤造型 02",desc:"深色夹克｜利落商务",match:95},
  {key:"h1",image:"H1.png",series:"urban",name:"城市户外造型 01",desc:"活力机能｜城市探索",match:94},
  {key:"h2",image:"H2.png",series:"urban",name:"城市户外造型 02",desc:"轻量防护｜日常户外",match:97},
  {key:"s1",image:"S1.png",series:"holiday",name:"生活假日造型 01",desc:"舒适自然｜轻松假日",match:93},
  {key:"s2",image:"S2.png",series:"holiday",name:"生活假日造型 02",desc:"休闲质感｜自在周末",match:98}
];
const SERIES=[
  {key:"daily",name:"日常通勤系列",en:"DAILY COMMUTING",image:"R1.png"},
  {key:"urban",name:"城市户外系列",en:"URBAN OUTDOOR",image:"H1.png"},
  {key:"holiday",name:"生活假日系列",en:"LIFESTYLE HOLIDAY",image:"S1.png"}
];
const FRAME_COUNT=60;
const frameCache=new Map();
const personImg=document.getElementById("person-img");
const person=document.getElementById("person");
const params=new URLSearchParams(location.search);
let selected=Math.max(0,Math.min(GARMENTS.length-1,parseInt(params.get("g"),10)||0));
let activeSeries=GARMENTS[selected].series;
let frames=[];
let frame=0;
let playing=true;
let direction=1;
let dragging=false;
let lastX=0;
let resumeAfterDrag=false;

function frameUrl(key,index){
  return "assets/seq/"+key+"/"+String(index+1).padStart(3,"0")+".webp";
}
function loadFrameSet(key){
  if(frameCache.has(key))return frameCache.get(key);
  const set=Array.from({length:FRAME_COUNT},function(_,index){
    const image=new Image();image.src=frameUrl(key,index);return image;
  });
  frameCache.set(key,set);
  return set;
}
function showFrame(next){
  frame=(next+FRAME_COUNT)%FRAME_COUNT;
  personImg.src=frames[frame].src;
}
function setSequence(garmentIndex){
  playing=true;
  frame=0;
  frames=loadFrameSet(GARMENTS[garmentIndex].key);
  showFrame(0);
}
setInterval(function(){if(playing&&!dragging)showFrame(frame+direction)},90);

person.onpointerdown=function(e){
  if(e.pointerType==="mouse"&&e.button!==0)return;
  dragging=true;lastX=e.clientX;resumeAfterDrag=playing;playing=false;
  person.setPointerCapture(e.pointerId);
};
person.onpointermove=function(e){
  if(!dragging)return;
  const dx=e.clientX-lastX;
  const steps=Math.trunc(dx/6);
  if(steps){showFrame(frame+steps);lastX+=steps*6}
};
function finishDrag(){
  if(!dragging)return;
  dragging=false;
  if(resumeAfterDrag)playing=true
}
person.onpointerup=person.onpointercancel=finishDrag;
const collectionList=document.getElementById("collection-list");
SERIES.forEach(function(series){
  const button=document.createElement("button");
  button.dataset.series=series.key;
  button.className="collection"+(series.key===activeSeries?" on":"");
  button.innerHTML='<img src="assets/guide/'+series.image+'" alt="'+series.name+'"><span>'+series.name+"<small>"+series.en+"</small></span><b>›</b>";
  button.onclick=function(){selectSeries(series.key)};
  collectionList.appendChild(button);
});

const outfitList=document.getElementById("outfit-list");
function renderOutfits(){
  outfitList.innerHTML="";
  GARMENTS.forEach(function(garment,index){
    if(garment.series!==activeSeries)return;
    const button=document.createElement("button");
    button.type="button";
    button.dataset.index=String(index);
    button.className="outfit"+(index===selected?" on":"");
    button.setAttribute("aria-pressed",index===selected?"true":"false");
    button.setAttribute("aria-label","试穿"+garment.name);
    button.innerHTML='<img src="assets/guide/'+garment.image+'" alt=""><div class="outfit-copy"><strong>'+garment.name+"</strong><small>推荐尺码：L</small><small>"+garment.desc+"</small></div>";
    button.onclick=function(){selectOutfit(index)};
    outfitList.appendChild(button);
  });
}
function selectSeries(seriesKey){
  activeSeries=seriesKey;
  const series=SERIES.find(function(item){return item.key===seriesKey});
  document.querySelectorAll(".collection").forEach(function(item){item.classList.toggle("on",item.dataset.series===seriesKey)});
  document.getElementById("series-name").textContent=series.name;
  const firstIndex=GARMENTS.findIndex(function(garment){return garment.series===seriesKey});
  if(GARMENTS[selected].series!==seriesKey)selected=firstIndex;
  renderOutfits();
  selectOutfit(selected,true);
  showToast("已切换至"+series.name);
}
function selectOutfit(index,silent){
  selected=index;
  document.querySelectorAll(".outfit").forEach(function(element){
    const isSelected=Number(element.dataset.index)===index;
    element.classList.toggle("on",isSelected);
    element.setAttribute("aria-pressed",isSelected?"true":"false");
  });
  document.getElementById("match").textContent=GARMENTS[index].match+"%";
  setSequence(index);
  person.classList.remove("scanning");void person.offsetWidth;person.classList.add("scanning");
  if(!silent)showToast("AI 正在应用「"+GARMENTS[index].name+"」");
}

let toastTimer;
function showToast(text){
  const toast=document.getElementById("toast");
  toast.textContent=text;toast.classList.add("show");clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){toast.classList.remove("show")},2200);
}
document.getElementById("continue").onclick=function(){
  showToast("正在加载动态试穿效果…");
  setTimeout(function(){location.href="scene3.html?g="+selected},850);
};

const initialSeries=SERIES.find(function(series){return series.key===activeSeries});
document.getElementById("series-name").textContent=initialSeries.name;
renderOutfits();
selectOutfit(selected,true);