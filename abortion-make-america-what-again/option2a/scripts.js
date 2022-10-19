const timeline = d3.select('.timeline');
const timelineImg = d3.select('.timeline-img');
const timelineText = d3.select('.timeline-text');

const viewportHeight = window.innerHeight;
const viewportWidth = window.innerWidth;
const numSteps = timeline.node().children.length;
const stepOverlapFactor = 0.75; // this lets the next year in the timeline show before the last one is totally gone. 
const totalLength = (numSteps) * viewportWidth * stepOverlapFactor;  
const startTopPos = parseInt(timeline.style('top'));
const scrollScale = d3.scaleLinear().domain([0, 100]).range([0, numSteps]);
const topScale = d3.scaleLinear().domain([100, 120]).range([startTopPos, 50]);
const bottomScale = d3.scaleLinear().domain([100, 120]).range([50, window.innerHeight - 50]);//startTopPos]);
const timelineYearBottomOffsetScale = d3.scaleLinear().domain([100, 120]).range([0, timeline.node().clientHeight]);//startTopPos]);
const timelineColorScale = d3.scaleLinear().domain([100, 120]).range(['#ea1c24', '#00abff']);//startTopPos]);


console.log(timelineText.attr())
let scrollableHeight = 0;
let heightOffset = 0;
let lastScroll = 0;
let lasttimelineStepIndex;
let scrollPercent = 0;

const timelineStepArray = [
  {text: "2022: <b class='red'>6 MAGA Justices</b> overtuned Roe, <b>took away the right to abortions</b> for millions of Americans <b >and turned the clock back to 1972</b>. But they aren't stopping there", img: "img/2022.jpg"},
  {text: "After Roe was overturned, <b class='red'>Michigan Republicans are trying to enforce a 1930s anti-abortion law</b> —from a time when there was <b >no right to contraception, same-sex relations were a felony, interracial marriage was illegal, and pregnancy was a fireable offense</b>.", img: "img/1930.jpg"},
  {text: "... MAGA Republicans are trying to enforce some of the country's oldest abortion laws — <b class='red'>from the 1800s — in West Virginia, Wisconsin and Arizona</b> and elsewhere.  These laws date back to a time when only some white men could vote and <b class='red'>enslaving people was still legal</b> across the U.S. South.", img: "img/1880.jpg"},
  {text: "MAGA Justices say they look back to the original intent of the \"founders\"— white men who allowed slavery and lived at a time <b class='red'>when women had to forfeit property when they married</b>.", img: "img/1776.jpg"},
  {text: "In overturning of Roe the MAGA Justices even quotes an English judge from the 1600s—one also <b class='red'>wrote justifying rape in marriage and sentenced two elderly women to death for witchcraft</b> in 1662.", img: "img/1600.jpg"},
  {text: "<b>But we've defeated the MAGAs of previous generations before.</b>", img: "img/1600.jpg"},
  {text: "From before the country's founding, <b class='blue'>women took care of each other</b>. Midwife-provided abortion was legal, safe and common.", img: "img/1776.jpg"},
  {text: "<b class='blue'>Abolitionists</b> built an underground railroad and then <b class='blue'>helped end slavery</b>.", img: "img/1880.jpg"},
  {text: "<b class='blue'>Suffragists</b> helped secure <b class='blue'>voting for white women</b>. And <b class='blue'>workers</b> came together to secure <b class='blue'>minimum wage, workers rights, and a 2-day weekend</b>.", img: "img/1930.jpg"},
  {text: "The <b class='blue'>Civil Rights movement expanded more rights to Black people</b> through its fight for political and economic power. And <b class='blue'>activists won LGBTQ+ rights including marriage equality</b>.", img: "img/2022.jpg"},
  {text: "Together, <b class='blue'>we moved beyond the judges of the 1600s and the laws of the 1800s</b> and made progress toward freedom and equal rights. <b class='blue'>And we'll do it again</b>.", img: "img/2022.jpg"},
];

const textStepScale = d3.scaleLinear().domain([0, 220]).range([0, timelineStepArray.length]);


function initTimeline() {
  //set up dimensions and position of timeline
  timeline.style('width', `${totalLength}px`);
  timeline.style('left', `${-totalLength}px`);

  //populate text with first item
  updateText(timelineStepArray[0].text);

  //calculate height offset
  const documentHeight = document.body.scrollHeight;
  const clientHeight = document.documentElement.clientHeight;
  heightOffset = documentHeight - clientHeight;

  //set height of content to "scroll" through (we're scrolling back and forth through the timeline plus one screen where the timeline moves up and the intro and outro screens)
  scrollableHeight = totalLength*2 + viewportWidth + viewportHeight*4;
  timelineText.style('height', `${scrollableHeight - heightOffset}px`);

  //define scroll listener
  window.addEventListener('scroll', onScroll);
}

function updateText(text) {
  if (text!==d3.select('.timeline-text span').html()) {
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
  }
}

function onScroll() {
  //account for the first two intro screens before starting timeline animation
  let scrollPos = window.scrollY - viewportHeight*2;

  //transition intro on or off
  let isStart = (window.scrollY > 100) ? false : true;
  d3.select('main').classed('start', isStart);

  //determine scroll direction
  const scrollDir = (scrollPos > lastScroll) ? 'down' : 'up';

  //calculate scroll progress
  scrollPercent = Math.round(scrollPos / totalLength * 100);
  
  //calculate scroll index
  const timelineStepIndex = Math.floor((scrollDir==='down') ? textStepScale(scrollPercent) : (textStepScale(scrollPercent)-1));

  //update timeline text and image
  const timelineStep = timelineStepArray[timelineStepIndex];
  if (lasttimelineStepIndex!==timelineStepIndex && timelineStep!==undefined) {
    updateText(timelineStep.text);
    timelineImg.style('background-image', `url(${timelineStep.img})`);
  }

  //set position of timeline
  if (scrollPercent>=100 && scrollPercent<=120) {
    let newTopPos = topScale(scrollPercent);
    //timeline.style('top', `${newTopPos}px`);
    let newBottomPos = bottomScale(scrollPercent);
    timeline.style('bottom', `${newBottomPos}px`);
    timeline.selectAll('div.step').style('margin-bottom', -timelineYearBottomOffsetScale(scrollPercent) + 'px')
    timeline.style('color',timelineColorScale(scrollPercent));
    timeline.style('border-color',timelineColorScale(scrollPercent));

  }
  else {
    let newPos = (scrollPercent<100) ? -(totalLength - scrollPos) : totalLength - scrollPos + (viewportWidth*stepOverlapFactor);
    timeline.style('left', `${newPos}px`);
  }

  //check if scrolled to bottom of page
  if ((viewportHeight + window.scrollY) >= document.body.offsetHeight) {
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