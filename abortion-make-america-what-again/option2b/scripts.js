const timeline = d3.select('.timeline');
const timelineImg = d3.select('.timeline-img');
const timelineText = d3.select('.timeline-text');

const viewportHeight = window.innerHeight;
const viewportWidth = window.innerWidth;
const numSteps = timeline.node().children.length;
const stepOverlapFactor = viewportWidth > 576 ? 0.65 : 2 ; // this lets the next year in the timeline show before the last one is totally gone in desktop, and controls overlap in mobile. 

const totalLength = (numSteps) * viewportWidth * stepOverlapFactor;  
const startTopPos = parseInt(timeline.style('top'));
const scrollScale = d3.scaleLinear().domain([0, 100]).range([0, numSteps]);
const timelineVerticalPadding = viewportWidth > 576 ? 50 : 0 ;
//const timelineWidth = 8;
const bottomScale = d3.scaleLinear().domain([85, 120]).range([timelineVerticalPadding, viewportHeight - (timelineVerticalPadding+8)]);//startTopPos]);
const timelineYearBottomOffsetScale = d3.scaleLinear().domain([85, 120]).range([0, timeline.node().clientHeight]);//startTopPos]);
const timelineColorScale = d3.scaleLinear().domain([85, 120]).range(['#ea1c24', '#00abff']);//startTopPos]);

console.log(timelineText.attr())
let scrollableHeight = 0;
let heightOffset = 0;
let lastScroll = 0;
let lasttimelineStepIndex;
let scrollPercent = 0;

const timelineStepArray = [
  {align: 'start', text: "<h3 class='red'><span>6 MAGA Justices overturned Roe v. Wade</span></h3><p>They took away the right to abortions for millions of Americans and turned the clock back to 1972. But they aren't stopping there.", img: "img/1972R.jpg"},
  {align: 'start', text: "<h3 class='red'><span>They unleashed laws from the 1930's</span></h3><p>Michigan Republicans are trying to enforce a 1930s anti-abortion law —from a time when there was no right to contraception, same-sex relations were a felony, interracial marriage was illegal, and pregnancy was a fireable offense.</p>", img: "img/1930R.png"},
  {align: 'start', text: "<h3 class='red'><span>MAGA is even trying to enforce laws from 1800s</span></h3><p>In West Virginia, Wisconsin and Arizona Republicans are trying to enforce some of the country's oldest abortion laws, which date back to a time when only some white men could vote and enslaving people was still legal across the U.S. South.</p>", img: "img/1850R.jpg"},
  {align: 'start', text: "<h3 class='red'><span>They look back to the 1700s</span></h3><p>MAGA Justices say they look back to the original intent of the \"founders\"— white men who allowed slavery and lived at a time when women had to forfeit property when they married.</p>", img: "img/1776R.jpg"},
  {align: 'start', text: "<h3 class='red'><span>And even earlier</span></h3><p>In overturning of Roe the MAGA Justices even quotes an English judge from the 1600s—one also wrote justifying rape in marriage and sentenced two elderly women to death for witchcraft in 1662</p>.", img: "img/1600R.jpg"},
  {align: 'start', pivot: true, text: "<h3><span>But we've defeated the MAGAs of previous generations before.</span></h3>", img: "img/1600R.jpg"},
  {align: 'end', text: "<h3 class='blue'><span>Women took care of each other</span></h3><p>From before the country's founding, Midwife-provided abortion was legal, safe and common.", img: "img/1776B.png"},
  {align: 'end', text: "<h3 class='blue'><span>Abolitionists built an underground railroad</span></h3><p>And then helped end slavery.", img: "img/1850B.png"},
  {align: 'end', text: "<h3 class='blue'><span>Suffragists and Workers Won Rights</span></h3><p>Suffragists helped secure voting for white women. And workers came together to secure minimum wage, workers rights, and a 2-day weekend</p>.", img: "img/1930B.png"},
  {align: 'end', text: "<h3 class='blue'><span>Activists expanded those rights</span></h3><p>The Civil Rights movement expanded more rights to Black people through its fight for political and economic power. And activists won LGBTQ+ rights including marriage equality.", img: "img/1972B.png"},
  {align: 'end', text: "<p>Together, we moved beyond the judges of the 1600s and the laws of the 1800s and made progress toward freedom and equal rights.</p> <h3 class='blue'><span>And we'll do it again</h3>.", img: "img/2022.jpg"},
];

const textStepScale = d3.scaleLinear().domain([0, 220]).range([0, timelineStepArray.length]);


function initTimeline() {
  //set up dimensions and position of timeline
  timeline.style('width', `${totalLength}px`);
  timeline.style('left', `${-(totalLength - viewportWidth)}px`);

  //populate text with first item
  updateText(timelineStepArray[0].text);

  //calculate height offset
  const documentHeight = document.body.scrollHeight;
  const clientHeight = document.documentElement.clientHeight;
  heightOffset = documentHeight - clientHeight;

  //set height of content to "scroll" through (we're scrolling back and forth through the timeline plus one screen where the timeline moves up and the intro and outro screens)
  scrollableHeight = totalLength*2 + viewportWidth + viewportHeight*4;
  timelineText.style('height', `${scrollableHeight - heightOffset}px`);
  timelineText.selectAll('div').data(timelineStepArray)
    .join('div')
    .html(d=> d.text)
    //.style('margin-bottom', d=> d.pivot ? '120vh' : 0)
    //.style('align-self', d=> d.align)
  //define scroll listener
  window.addEventListener('scroll', onScroll);
}

function updateText(text) {
  /* if ( text!==d3.select('.timeline-text span').html()) {
    d3.select('.timeline-text span').interrupt().transition()
      .duration(300)
      .style('opacity', 0)
      .on('end',() => {
        d3.select('.timeline-text span')
        .html(text)
        .transition()
        .duration(500)
        .style('opacity', 1);
    })
  }*/
}

function onScroll() {
  //account for the first two intro screens before starting timeline animation
  let scrollPos = window.scrollY - viewportHeight;

  //transition intro on or off
  let isStart = (window.scrollY > 100) ? false : true;
  d3.select('main').classed('start', isStart);

  //determine scroll direction
  const scrollDir = (scrollPos > lastScroll) ? 'down' : 'up';

  //calculate scroll progress
  scrollPercent =scrollPos / totalLength * 100;
  //calculate scroll index
  const timelineStepIndex = Math.floor((scrollDir==='down') ? textStepScale(scrollPercent) : (textStepScale(scrollPercent)-1));

  //update timeline text and image
  const timelineStep = timelineStepArray[timelineStepIndex];
  if (lasttimelineStepIndex!==timelineStepIndex && timelineStep!==undefined) {
    updateText(timelineStep.text);
    timelineImg.style('background-image', `url(${timelineStep.img})`);
  } else if(timelineStepIndex < 0) {
    timelineImg.style('background-image', `url(img/2022R.jpeg)`);
  }

  //set position of timeline
  if (scrollPercent>=85 && scrollPercent<=120) {
    let newBottomPos = bottomScale(scrollPercent);
    timeline.style('bottom', `${newBottomPos}px`);
    timeline.selectAll('div.step').style('margin-bottom', -timelineYearBottomOffsetScale(scrollPercent) + 'px')
    timeline.style('color',timelineColorScale(scrollPercent));
    timeline.style('border-color',timelineColorScale(scrollPercent));
  }
  else {
    let newPos = (scrollPercent<100) ? -(totalLength - scrollPos) : (totalLength - scrollPos) //+ (viewportWidth*stepOverlapFactor);
    timeline.style('left', `${newPos}px`);
  }
  //console.log(window.scrollY);
  //check if scrolled to bottom of page
  if (window.scrollY <= 0 || (viewportHeight + window.scrollY) >= document.body.offsetHeight) {
    console.log('setting opacity 0')
    d3.selectAll('.timeline').style('opacity', 0);
  }
  else {
    d3.selectAll('.timeline').style('opacity', 1);
  }

  //save last scroll position
  lastScroll = scrollPos;
  lasttimelineStepIndex = timelineStepIndex;
}


initTimeline();