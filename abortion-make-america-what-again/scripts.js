// select core elements and variables. 
const timeline = d3.select('.timeline');
const timelineImg = d3.select('.timeline-img');
const timelineText = d3.select('.timeline-text');

const viewportHeight = window.innerHeight;
const viewportWidth = window.innerWidth;
const mobileStyle = viewportWidth < 576;
const timelineVerticalPadding = mobileStyle ? 0 : 50 ;

const timelineStepArray = [
  {type: 'intro',  yearPos: 5},
  {type: 'scene', align: 'start', yearPos: 4, img: "img/AbortionTimeline2.jpg"},
  {type: 'scene',align: 'start', yearPos: 3, img:  "img/AbortionTimeline3.jpg"},
  {type: 'scene', align: 'start', yearPos: 2, img: "img/AbortionTimeline4.jpg"}, 
  {type: 'scene', align: 'start', yearPos: 1, img: "img/AbortionTimeline5.jpg"},
  {type: 'scene', align: 'start', yearPos: 0, img: "img/AbortionTimeline6.jpg"},
  {type: 'scene', align: 'start', yearPos: 0, pivot: true,  img: "img/AbortionTimeline6.jpg"},
  {type: 'scene', align: 'end', yearPos: 1, img:"img/AbortionTimeline7.jpg"},
  {type: 'scene', align: 'end', yearPos: 2, img: "img/AbortionTimeline8.jpg"},
  {type: 'scene', align: 'end', yearPos: 3, img: "img/AbortionTimeline9.jpg"},
  {type: 'scene', align: 'end', yearPos: 4, img: "img/AbortionTimeline10.jpg"},
  {type: 'scene', align: 'end', yearPos: 5, img: 'img/AbortionTimeline11.jpg'},
  {type: 'scene', align: 'end', yearPos: 6, img: 'img/AbortionTimeline11.jpg'},
];

// preload the images
let images = new Array()
let i = 0;
timelineStepArray.forEach(d=> { 
  if(d.img != undefined){
    images[i] = new Image()
    images[i].src = d.img
  }
})

const totalPageSteps = timelineStepArray.length; 

function initTimeline() {
  //set up dimensions and position of timeline
  timeline.style('width', `600vw`);
  timeline.style('left', mobileStyle ? `-520vw`: `-600vw`);
}

let curStep = 0; 
let isMoving = 0; 

updateImg = function(step){
  if(step <= 0) {
    timelineImg.style('background-image', `url(img/AbortionTimeline1.jpg)`);
  } else  {
    timelineImg.style('background-image', `url(${timelineStepArray[step].img})`);
  }
}  

updateTexts = function(step, isNext){
  d3.selectAll('.timeline-text>div:nth-child(' +(step+1) +')')
    .style('top',isNext ? '100%' : '-90%') // this is a bug - not sure why I have to set 100% when set in css. It's for some reason starting way off from this
    .transition()
    .duration(1100)
    .delay(150)// time for image to start changing first
    .style('top',  step < 6 ? (mobileStyle ? "15%" :'10%') : (mobileStyle || step == (totalPageSteps-1) ? "25%" :'40%'))
    .style('scale',1)
    .style('opacity',1)
    .on('end', () => {
      isMoving = 0
    })
  if((curStep > 0 & isNext) || (curStep < totalPageSteps & !isNext)){
    d3.selectAll('.timeline-text>div:nth-child(' +(step + (isNext ? 0 : +2))+')')
      .transition()
      .delay(150)// time for image to changing first
      .duration(1100)
      .style('top',isNext ? '-90%' : '100%')
      .style('opacity',0)
      .on('end', () => {
        isMoving = 0 // need to set it here for when moving backwards
      })
  }
}

updateTimelinePosition = function(step, isNext){   
  timeline
    .transition()
    .delay(step==1 & isNext ? 500 : 150)// time for image to changing first
    .duration((step==1 & isNext & !mobileStyle) ? 2500 :1100) // first one needs to scroll through 2022 to 1972
    .style('left', `-${ (mobileStyle ? 20 : 30)+ 100*timelineStepArray[step].yearPos}vw`)

  if((timelineStepArray[step].pivot && isNext) || (!isNext && timelineStepArray[step+1].pivot )){
    d3.select('img.moveon-logo')
      .transition().style('opacity',0)
      .on('end',() => {
        d3.select('header')
          .style('top', isNext ? "revert" : "20px")
          .style('bottom', isNext ? "20px" : "revert")
        d3.select('img.moveon-logo')
          .attr('src', isNext ? "img/logo-blue.png" : "img/logo-red.png")
          .transition()
          .delay(700)
          .style('opacity',1)
      }) 
    timeline
      .transition()
      .delay( 150)// time for image to changing first
      .duration(1100)
      .style('bottom', `${isNext ?  (viewportHeight - (timelineVerticalPadding+8)): timelineVerticalPadding}px`)
      .style('color',isNext ?  '#00abff': '#ea1c24')
      .style('border-color',isNext ?  '#00abff': '#ea1c24')
    timeline.selectAll('div.step')
      .transition()
      .delay(step==1 ? 1100 : 150)// time for image to changing first
      .duration(1100)
      .style('margin-bottom', (isNext ? -timeline.node().clientHeight : -8) + 'px')    
      .style('margin-top', (isNext ? 0 : 8) + 'px')    
  }
}

updateScene = function(direction){

  if (direction== 'next'){
    if (curStep < (totalPageSteps-1)){
      isMoving = 1
      curStep ++;
      updateTexts(curStep, true)
      updateTimelinePosition(curStep, true)
    }
  } else {
    if (curStep > 0){
      isMoving = 1
      curStep --; 
      updateTexts(curStep, false)
      updateTimelinePosition(curStep, false)
    }
  }
  if(curStep != 0){
    d3.select('.intro').style('opacity', 0);
    d3.select('.timeline').style('opacity', 1);
  } else { 
    d3.select('.intro').style('opacity', 0.95);
    d3.select('.timeline').style('opacity', 0);
  }
  if(curStep == (totalPageSteps-1)){
    d3.select('.cta').style('display','flex').transition().delay(1400).duration(500).style('opacity', 1)
    
  } else { 
    d3.select('.cta').style('display','none').style('opacity', 0)
  }

  updateImg(curStep)
}

if(mobileStyle && viewportHeight < 670) {
  d3.selectAll('.timeline-text>div p').style('font-size','1.1rem')
}

d3.select('.cta .share-btn').on('click', ()=>{
  isMoving =1; // just to keep people from navigating through background when overlay is open
  d3.select('section.overlay').style('display','block')
  d3.select('#overlay-background').style('display','block')
})

d3.select('#close-share-overlay').on('click', ()=>{
  isMoving=0;
  d3.select('section.overlay').style('display','none')
  d3.select('#overlay-background').style('display','none')
})

d3.select('html').on('wheel', (e) => {
  if(isMoving) { return}
  if(e.wheelDelta < 0 ){ 
    updateScene('next')
  } else if (e.wheelDelta > 0){
    updateScene('previous')
  }
});
// wheel isn't supported on ios safari, so need touch. 
let touchStartY; 
window.addEventListener('touchstart', (e)=> { touchStartY = e.pageY})
window.addEventListener('touchmove', (e) => {
  if(isMoving) { return}
  if(e.pageY < touchStartY-5 ){ 
    isMoving = 1
    updateScene('next')
  } else if (e.pageY > touchStartY-5){
    isMoving = 1
    updateScene('previous')
  }
});
window.addEventListener('touchend', (e)=> { touchStartY = null});


d3.select('html').on("keydown", (e)=> {
  if (e.keyCode == 40){
    updateScene('next')
  } else if(e.keyCode == 38) {
    updateScene('previous')
  }
})

initTimeline();