const timeline = d3.select('.timeline');
const timelineImg = d3.select('.timeline-img');
const timelineText = d3.select('.timeline-text');

const viewportHeight = window.innerHeight;
const viewportWidth = window.innerWidth;
const mobileStyle = viewportWidth < 576;
const timelineVerticalPadding = mobileStyle ? 0 : 50 ;

let scrollableHeight = 0;
let heightOffset = 0;
let lastScroll = 0;
let lasttimelineStepIndex;
let scrollPercent = 0;

const timelineStepArray = [
  {type: 'intro',  yearPos: 5},
  {type: 'scene', align: 'start', yearPos: 4, text: "<h3 class='red'><span>6 MAGA Justices overturned Roe v. Wade</span></h3><p>They took away the right to abortions for millions of Americans and turned the clock back to 1972. But they aren't stopping there.", img: "img/1972R.jpg"},
  {type: 'scene',align: 'start', yearPos: 3, text: "<h3 class='red'><span>They unleashed laws from the 1930's</span></h3><p>Michigan Republicans are trying to enforce a 1930s anti-abortion law &mdash;from a time when there was no right to contraception, same-sex relations were a felony, interracial marriage was illegal, and pregnancy was a fireable offense.</p>", img:  "img/1930Ralt.jpg"},// "img/1930R.png"},
  {type: 'scene', align: 'start', yearPos: 2, text: "<h3 class='red'><span>MAGA is even trying to enforce laws from 1800s</span></h3><p>In West Virginia, Wisconsin and Arizona, Republicans are trying to enforce some of the country's oldest anti-abortion laws, which date back to a time when only some white men could vote and enslaving people was still legal across the U.S. South.</p>", img: "img/1850R.jpg"}, //"img/1850R.jpg"},
  {type: 'scene', align: 'start', yearPos: 1, text: "<h3 class='red'><span>They look back to the 1700s</span></h3><p>MAGA Justices argue they look back to the original intent of the \"founders\"&mdash; white men who allowed slavery and lived at a time when women had to forfeit property when they married. And even then, they did not ban abortions in America's founding.</p>", img: "img/1776R.jpg"},
  {type: 'scene', align: 'start', yearPos: 0, text: "<h3 class='red'><span>And even earlier</span></h3><p>In overturning of Roe the MAGA Justices even quotes an English judge from the 1600s&mdash;who also wrote justifying rape in marriage and sentenced two elderly women to death for witchcraft in 1662</p>.", img: "img/1600R.jpg"},
  {type: 'scene', align: 'start', yearPos: 0, pivot: true, text: "<h3 class='blue'><span>But we've defeated the MAGAs of previous generations before.</span></h3>", img: "img/1600R.jpg"},
  {type: 'scene', align: 'end', yearPos: 1, text: "<h3 class='blue'><span>We've taken care of each other</span></h3><p>From before the country's founding, Midwife-provided abortion was legal, safe and common.", img:"img/1776Balt.jpg"}, //"img/1776B.png"},
  {type: 'scene', align: 'end', yearPos: 2, text: "<h3 class='blue'><span>Abolitionists built an underground railroad</span></h3><p>And then helped end slavery.", img: "img/1850Balt.jpg"}, //"img/1850B.png"},
  {type: 'scene', align: 'end', yearPos: 3, text: "<h3 class='blue'><span>Suffragists and Workers Won Rights</span></h3><p>Suffragists helped secure voting for white women. And workers came together to secure minimum wage, workers' rights, and a two-day weekend</p>.", img: "img/1930Balt.jpg"},//"img/1930B.png"},
  {type: 'scene', align: 'end', yearPos: 4, text: "<h3 class='blue'><span>Activists expanded those rights</span></h3><p>The Civil Rights movement expanded more rights to Black people through the fight for political and economic power. And activists won LGBTQ+ rights, including marriage equality.", img: "img/1972Balt.jpg"}, //"img/1972B.png"},
  {type: 'scene', align: 'end', yearPos: 5, text: "<p>Together, we moved beyond the bigoted judges of the 1600s and the laws of the 1800s and made progress toward freedom and equal rights.</p> <h3 class='blue'><span>And we'll do it again</h3>."},
  {type: 'outro',  yearPos: 6,  text: "<h3 class='blue'><span>So... whose future do you want?</span></h3><p>Volunteer, vote, get your friends to vote.</p>",},
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

  //set height of content to "scroll" through (we're scrolling back and forth through the timeline plus one screen where the timeline moves up and the intro and outro screens)
  timelineText.selectAll('div')
    .data(timelineStepArray)
    .join('div')
    .html(d=> d.text)
}

let curStep = 0; 
let isMoving = 0; 

updateImg = function(step){
  if(step <= 0) {
    timelineImg.style('background-image', `url(img/2022R.jpeg)`);
  } else  {
    timelineImg.style('background-image', `url(${timelineStepArray[step].img})`);
  }
}  

updateTexts = function(step, isNext){
  d3.selectAll('.timeline-text div:nth-child(' +(step+1) +')')
    .style('top',isNext ? '100%' : '-90%') // this is a bug - not sure why I have to set 100% when set in css. It's for some reason starting way off from this
    //.style('scale',0.5)
    .transition()
    .duration(1100)
    .delay(150)// time for image to start changing first
    .style('top',  step < 6 ? (mobileStyle ? "0%" :'10%') : (mobileStyle ? "15%" :'40%'))
    .style('scale',1)
    .style('opacity',1)
    .on('end', () => {
      isMoving = 0
    })
  if((curStep > 0 & isNext) || (curStep < totalPageSteps & !isNext)){
    d3.selectAll('.timeline-text div:nth-child(' +(step + (isNext ? 0 : +2))+')')
      .transition()
      .delay(150)// time for image to changing first
      .duration(1100)
      .style('top',isNext ? '-90%' : '100%')
      //.style('scale',0.5)
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

  if((timelineStepArray[step].pivot & isNext) || (timelineStepArray[step+1].pivot & !isNext )){
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

  isMoving = 1
  if (direction== 'next'){
    curStep ++;
    updateTexts(curStep, true)
    updateTimelinePosition(curStep, true)
  } else {
    curStep --; 
    updateTexts(curStep, false)
    updateTimelinePosition(curStep, false)
  }
  if(curStep != 0){
    d3.select('.intro').style('opacity', 0);
    d3.select('.timeline').style('opacity', 1);
  } else { 
    d3.select('.intro').style('opacity', 0.95);
    d3.select('.timeline').style('opacity', 0);
  }
  updateImg(curStep)
  
}

d3.select('html').on('wheel', (e) => {
  if(isMoving) { return}
  isMoving = 1
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

 d3.select('html').on('click', (e) => { 
  if (e.clientY > window.innerHeight/2){
    updateScene('next')
  } else {
    updateScene('previous')
  }
})

d3.select('html').on("keydown", (e)=> {
  if (e.keyCode == 40){
    updateScene('next')
  } else if(e.keyCode == 38) {
    updateScene('previous')
  }
})

initTimeline();