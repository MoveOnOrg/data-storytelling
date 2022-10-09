const viewportWidth = window.innerWidth;
const timeline = d3.select('.timeline');
const timelineStep = timeline.selectAll('.step');
const timelineText = d3.select('.timeline-text');
const numSteps = timeline.node().children.length;
const totalLength = numSteps * viewportWidth; 
const scrollScale = d3.scaleLinear().domain([0, 100]).range([0, numSteps]);

console.log(totalLength)

let heightOffset = 0;
let lastScroll = 0;

const textArray = [
    'This is my 1st text. I have a lot to say. It runs onto many lines.',
    'This is my 2nd text. I have a lot to say. It runs onto many lines.',
    'This is my 3rd text. I have a lot to say. It runs onto many lines.',
    'This is my 4th text. I have a lot to say. It runs onto many lines.',
    'This is my 5th text. I have a lot to say. It runs onto many lines.',
];

function initTimeline() {
  //set up dimensions and position of timeline
  timeline.style('width', `${totalLength}px`);
  timeline.style('left', `${-totalLength}px`);

  //calculate height offset
  const documentHeight = document.body.scrollHeight;
  const clientHeight = document.documentElement.clientHeight;
  heightOffset = documentHeight - clientHeight;

  //set height of content to "scroll" through
  const scrollableHeight = totalLength*2 + viewportWidth;
  timelineText.style('height', `${scrollableHeight - heightOffset}px`);

  //define scroll listener
  window.addEventListener('scroll', onScroll);
}

function updateText(text) {
  d3.select('.timeline-text span').transition()
    .duration(250)
    .style('opacity', 0)
    .transition()
    .duration(500)
    .text(text)
    .style('opacity', 1);
}

function onScroll() {
  //determine scroll direction
  const scrollDir = (window.scrollY > lastScroll) ? 'down' : 'up';
  lastScroll = window.scrollY;

  //calculate scroll progress
  const scrollPercent = Math.round(window.scrollY / totalLength * 100);
  console.log(scrollPercent)

  //calculate scroll index
  const scrollIndex = (scrollDir==='down') ? scrollScale(scrollPercent) : scrollScale(scrollPercent)-1;

  //update timeline text
  const text = textArray[scrollIndex];
  if (text!==undefined) updateText(text);

  //set position of timeline
  timeline.style('left', `${-(totalLength-window.scrollY)}px`);
}


initTimeline();