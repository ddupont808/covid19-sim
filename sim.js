const gui = new Tweakpane();

var width = window.innerWidth, height = window.innerHeight;

var data = [];
var svg = d3.select("body").append("svg");

/** sim vars **/
var config = {
    infectivity: 3,
    population: 500,
    socialDistancing: 0,
    recoveryTime: 4,
    deathRate: 10,
    immunity: 0,
    speed: 4
};

/** graph data */
var coolData = {
    cases: 0,
    dead: 0,
    recovered: 0
}

/** gui stuff **/
{
    const f1 = gui.addFolder({
        title: 'virus settings',
        expanded: false
    });
    f1.addInput(config, 'infectivity', { min: 2, max: 10 }).on('change', populate);
    f1.addInput(config, 'recoveryTime', { min: 0, max: 10}).on('change', populate);
    f1.addInput(config, 'deathRate', { min: 0, max: 100 }).on('change', populate);

    const f2 = gui.addFolder({
        title: 'preventative measures',
        expanded: false
    });
    f2.addInput(config, 'socialDistancing', { min: 0, max: 100 }).on('change', populate);
    f2.addInput(config, 'immunity', { min: 0, max: 100 }).on('change', populate);

    const f3 = gui.addFolder({
        title: 'sim settings',
        expanded: false
    });

    f3.addInput(config, 'population', { min: 1, max: 1500 }).on('change', populate);
    f3.addInput(config, 'speed', { min: 1, max: 20 }).on('change', populate);

    const f4 = gui.addFolder({
        title: 'cool graphs'
    });

    f4.addMonitor(coolData, 'cases', {
        view: 'graph',
        min: 0,
        max: 1,
    });
    f4.addMonitor(coolData, 'dead', {
        view: 'graph',
        min: 0,
        max: 1,
    });
    f4.addMonitor(coolData, 'recovered', {
        view: 'graph',
        min: 0,
        max: 1,
    });

    gui.addButton({
        title: 'Spread Virus',
    }).on('click', (value) => {
        data[parseInt(Math.random() * data.length)].state = 'infected';
    });
    gui.addButton({
        title: 'Restart',
    }).on('click', populate);
}

function populate() {
    data = [];
    svg.selectAll("*").remove();

    for (var i = 0; i < config.population; i++){
        var obj = {
            radius: config.infectivity,
            angle: d3.randomUniform(0, 3600)() / 10,
            speed: Math.random() < config.socialDistancing / 100 ? 0 : config.speed,
            state: Math.random() < config.immunity / 100 ? 'immune' : 'healthy'
        }
        obj.pos = [
            d3.randomUniform(obj.radius, width - obj.radius)(),
            d3.randomUniform(obj.radius, height - obj.radius)()
        ];
        data.push(obj);
    }

    circle = svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("r", d => d.radius);
}

populate();

d3.timer(_ => { redraw(update(data)); });

function redraw(data){
  width = window.innerWidth;
  height = window.innerHeight;
  svg.attr("width", width).attr("height", height);
  
  circle.attr("transform", d => "translate(" + d.pos + ")").attr('state', d => d.state);
}

function infect(target) {
    target.state = 'infected';
    setTimeout(() => { 
        if(Math.random() < config.deathRate / 100) {
            target.state = 'dead';
            target.speed = 0;
        } else target.state = 'recovered';
    }, config.recoveryTime * 1000);
}

function update(data){
    let totalInfected = 0;
    let totalDead = 0;
    let totalRecovered = 0;

  data.forEach((d, i) => {
    if(d.state == 'infected')
        totalInfected++;
    else if(d.state == 'dead')
        totalDead++;
    else if(d.state == 'recovered')
        totalRecovered++;  
    
    // Detect collisions      
    for (var i0 = 0, l = data.length; i0 < l; i0++){
      let target = data[i0];
      if (i !== i0 && geometric.lineLength([d.pos, target.pos]) < d.radius + target.radius){
        
        var dCurr = JSON.parse(JSON.stringify(d));

        d.angle = target.angle;
        //d.speed = target.speed;
        //target.speed = dCurr.speed;
        target.angle = dCurr.angle;
        
        if(d.state == 'infected' && target.state == 'healthy')
            infect(target);
        else if(d.state == 'healthy' && target.state == 'infected')
            infect(d);
      }
    }

    // Detect horizontal walls
    if (d.pos[0] <= d.radius || d.pos[0] >= width - d.radius){
      d.angle = geometric.angleReflect(d.angle, 90);
    }

    // Detect vertical walls
    if (d.pos[1] <= d.radius || d.pos[1] >= height - d.radius){
      d.angle = geometric.angleReflect(d.angle, 0);
    }

    // Translate the point
    d.pos = geometric.pointTranslate(d.pos, d.angle, d.speed);
  });

  coolData.cases = totalInfected / config.population;
  coolData.dead = totalDead / config.population;
  coolData.recovered = totalRecovered / config.population;

  return data;
}