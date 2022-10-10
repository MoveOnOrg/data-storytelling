const timeline = d3.select('.timeline');
const timelineText = d3.select('.timeline-text');

const viewportWidth = window.innerWidth;
const numSteps = timeline.node().children.length;
const stepOverlapFactor = 0.7; // this lets the next year in the timeline show before the last one is totally gone. 
//const textDelayFactor = 0.05; // this is how far to scroll before first text changes. 
const totalLength = (/*textDelayFactor + */numSteps) * viewportWidth * stepOverlapFactor;  
const startTopPos = parseInt(timeline.style('top'));

const scrollScale = d3.scaleLinear().domain([0, 100]).range([0, numSteps]);
const topScale = d3.scaleLinear().domain([100, 120]).range([startTopPos, 50]);

let heightOffset = 0;
let lastScroll = 0;
let lastscrollIndex;
let scrollPercent = 0;

const textArray = [
  "2022: <b>6 MAGA Justices overtuned Roe</b>, took away the right to abortions for millions of Americans and turned the clock back to 1972. But they aren't stopping there",
  "After Roe was overturned, Michigan Republicans are trying to enforce a 1930s anti-abortion law —from a time when there was no right to contraception, same-sex relations were a felony, interracial marriage was illegal, and pregnancy was a fireable offense.",
  "... MAGA Republicans are trying to enforce some of the country's oldest abortion laws — from the 1800s — in West Virginia, Wisconsin and Arizona and elsewhere.  These laws date back to a time when only some white men could vote and enslaving people was still legal across the U.S. South.",
  "MAGA Justices say they look back to the original intent of the \"founders\"— white men who allowed slavery and lived at a time when women had to forfeit property when they married. And even then, they did not ban abortions in America's founding.",
  "In overturning of Roe the MAGA Justices even quotes an English judge from the 1600s—one also wrote justifying rape in marriage and sentenced two elderly women to death for witchcraft in 1662.",
  "But we've defeated the MAGAs of previous generations before.",
  "From before the country's founding, women took care of eachother. Midwife-provided abortion was legal, safe and common.",
  "Abolitionists built an underground railroad and then helped end slavery.",
  "Suffragists helped secure voting for white women. And workers came together to secure minimum wage, workers rights, and a 2-day weekend.",
  "The Civil Rights movement expanded more rights to Black people through its fight for political and economic power. And activists won LGBTQ+ rights including marriage equality.",
  "Together, we moved beyond the judges of the 1600s and the laws of the 1800s and made progress toward freedom and equal rights. And we'll do it again.",
];

function initTimeline() {
  //set up dimensions and position of timeline
  timeline.style('width', `${totalLength}px`);
  timeline.style('left', `${-totalLength}px`);

  //calculate height offset
  const documentHeight = document.body.scrollHeight;
  const clientHeight = document.documentElement.clientHeight;
  heightOffset = documentHeight - clientHeight;

  //set height of content to "scroll" through (we're scrolling back and forth through the timeline plus one screen where the timeline moves up)
  const scrollableHeight = totalLength*2 + viewportWidth;
  timelineText.style('height', `${scrollableHeight - heightOffset}px`);

  //define scroll listener
  window.addEventListener('scroll', onScroll);
}

function updateText(text) {
  d3.select('.timeline-text span').transition()
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

function onScroll() {
  //determine scroll direction
  const scrollDir = (window.scrollY > lastScroll) ? 'down' : 'up';

  //calculate scroll progress
  scrollPercent = Math.round(window.scrollY / totalLength * 100);
  console.log('scrollPercent', scrollPercent)
  //calculate scroll index
  const scrollIndex = Math.floor((scrollDir==='down') ? scrollScale(scrollPercent) : (scrollScale(scrollPercent)-1));
  console.log('scrollIndex', scrollIndex)

  //update timeline text
  const text = textArray[scrollIndex];
  if (lastscrollIndex!==scrollIndex) updateText(text);
  //if (text!==undefined ) updateText(text);

  //set position of timeline
  if (scrollPercent>=100 && scrollPercent<=120) {
    let newTopPos = topScale(scrollPercent);
    timeline.style('top', `${newTopPos}px`);
  }
  else {
    let newPos = (scrollPercent<100) ? -(totalLength-window.scrollY) : totalLength-window.scrollY+(viewportWidth*stepOverlapFactor);
    timeline.style('left', `${newPos}px`);
  }

  //save last scroll position
  lastScroll = window.scrollY;
  lastscrollIndex = scrollIndex;
}


initTimeline();