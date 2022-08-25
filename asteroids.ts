// FIT2102 2019 Assignment 1
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing

/**
 * Design Principles
 * 
 * I have used const for all the variables to maintain the purity and transparency of all functions.
 * This ensures that once a variable is bounded to a value, it cannot be 
 * reassigned. This eliminates the risk of causing unwanted side effects.
 * 
 * My approach to this game is similar to how a normal JavaScript /HTML game will be coded.
 * The overall framework can be divided into two parts,
 * 
 * 1. The Draw Observable, the main observable.
 * This observable is triggered once per FREQ ms.The main observable of the game updates the game 
 * screen by calculating the the new coordinates of each and every element and move them when it is triggered.
 * Furthermore,the main observable Draw also 
 * a)calculates the acceleration speed of the ship 
 * b)checks if there collision between asteroids & bullets
 * c)checks if there collision between asteroid & the ship. 
 * d)checks whether a new asteroid can be spawn and so on
 * 
 * 2.The second part are the keyboard events. The keyboard events are relatively simpler than Draw.
 * The main task of this observable is to track whether a key is pressed. However, there's a problem here.
 * How does the two main components communicate with each other?
 * ie: how does the Draw observable know if a key is pressed or not.
 * In order to solve this, I used attr. 
 * Which means , when a W key is pressed, i set the 'data-up' value to true. Thus the key press will be seen 
 * when the next frame is being rendered. The other controls are done in a similar manner. Most of the attributes start 
 * with 'data-' are used to establish a communication between the two observables.
 * 
 * 
 * Other Explanations
 * The game restarts when there's a collision between the asteroid and the ship. 
 * This is done by 
 * 1.making all the other elements 'invisible'
 * 2.marking their 'data-ready' attribute as False, this simply means that the element is not ready yet.
 * 
 * Furthermore,the bullets and asteroids are stored in a array of fixed length.
 * Having too many asteroids / too many bullets can make the game too hard/ too easy to play.
 * Therefore, there is a maximum number of bullets & asteroids that can be created.
 * 
 */
function asteroids() {
  // Inside this function you will use the classes and functions 
  // defined in svgelement.ts and observable.ts
  // to add visuals to the svg element in asteroids.html, animate them, and make them interactive.
  // Study and complete the Observable tasks in the week 4 tutorial worksheet first to get ideas.

  // maximum number of asteroids for each level
  const NUM_ASTEROID = new Array(6, 9, 12, 15, 18)
  // frame per second
  const FPS = 30
  // refresh frequency under the corresponding fps
  const FREQ = Math.floor(1000 / FPS)
  // bullet cool down time in ms
  const BULLET_CD = 20
  // bullet duration time
  const BULLET_RANGE = 500
  // maximum number of bullets
  const NUM_BULLET = Math.floor(BULLET_RANGE / BULLET_CD) + 1
  // maximum linear speed of the ship
  const MAX_VELOCITY = 10
  // fixed angular speed of the ship
  const A_VELOCITY = 5
  // acceleration of the ship when you press up or down
  const ACCELERATION = 3
  // the resistance force when you move
  const RESIST = 1
  // map size
  const MAP_SIZE = 600
  // the minimum asteroid spawn time gap
  const SPAWN_GAP = 1000
  // upper bound of asteroid size
  const ASTEROID_UB = 30
  // lower bound of asteroid size
  const ASTEROID_LB = 15
  // collide radius of an asteroid
  const COLLIDE_RADIUS = 25
  // collide radius of the ship
  const SHIP_RADIUS = 18
  // bullet radius
  const BULLET_SIZE = 3
  // bullet speed
  const BULLET_VELOCITY = 20
  // the minimum gap between two collisions
  const COLLIDE_GAP = 1000
  // only split into two smaller asteroids when the radius is greater than 20
  const MIN_SPLIT_RADIUS = 20

  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
  // Document your code!  
  // Explain which ideas you have used ideas from the lectures to 
  // create reusable, generic functions.
  const svg = document.getElementById("canvas")!;
  // make a group for the spaceship and a transform to move it and rotate it
  // to animate the spaceship you will update the transform property
  let g_ship = new Elem(svg,'g')
    .attr("transform","translate(300 300) rotate(0)")  
  
  // create a polygon shape for the space ship as a child of the transform group
  let ship = new Elem(svg, 'polygon', g_ship.elem) 
    .attr("points","-15,20 15,20 0,-20")
    .attr("style","fill:white;stroke:white;stroke-width:1")

  // function create n group
  function createNGroup(n: number) {
    return new Array(n).fill(0).map(()=>{
      return new Elem(svg, 'g')
    })
  }

  // the group for all asteroids to transform them
  let g_asteroids = createNGroup(NUM_ASTEROID[4]).map(()=>new Elem(svg, 'g'))
  // the elements for all asteroids
  let asteroids = g_asteroids.map((group)=>{
    return new Elem(svg, 'circle', group.elem) 
      .attr("style", "fill:none;stroke:white;stroke-width:1")
      .attr("cx","0")
      .attr("cy","0")
  })

  //to display current score and current level
  let g_title = new Elem(svg, "g")
    .attr("transform", "translate(300 40)")
  let title = new Elem(svg, "text", g_title.elem)
    .attr("font-size", "20px")
    .attr("font-family", "sans-serif")
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("style","white-space:pre")
  title.text("Score: 0                 Level: 1                 Life: 3")

   // make a group for all bullets
  // to animate the bullets: need to update the tranformation of this group
  let g_bullets = createNGroup(NUM_BULLET)
  // the default style for all bullet elements 
  let bullets = g_bullets.map((group) => {
    return new Elem(svg, 'circle', group.elem)
      .attr("style", "fill:red;stroke:orange;stroke-width:1")
      .attr("cx","0")
      .attr("cy","0")
      .attr("r",BULLET_SIZE)
  })

  // initilize the map when you start the game or
  // when you lose the game and restart
  const initilize = ()=>{
    //only show the ship @ starting state
    //other elements such as bullets, asteroid are hidden.
    g_bullets.forEach(e=>{
      e.attr("visibility", "hidden")
        .attr("data-ready", "false")
        .attr("data-cd", "false")
    })
    g_asteroids.forEach(e=>{
      e.attr("visibility", "hidden")
      e.attr("data-ready", "false")
    })
    g_ship
      .attr("visibility", "visible")
      .attr("data-ready", "true")
      .attr("data-av", "0")
      .attr("data-lv", "0")
      .attr("data-x", "300")
      .attr("data-y", "300")
      .attr("data-r", "0")
    g_title.
      attr("data-life", "3")
  }

  initilize()
  const init_state = {
    //number of 'active' asteroids
    n_asteroid: 0,
    //the time when the last asteroid is genarated
    //there is an interval between asteroids genartions
    //to genarate new asteroids : 
    //last_spawn must be greater than the interval value 
    last_spawn: 0,
    //last_collide indicates the last collision time
    //used to calculate the collision free time 
    last_collide: -1000,
    //game_time indicates the total time of the current game, 
    //divide by 1000 will be the current score 
    game_time: 0
  }

  // a function to calculate the coordinates of an element
  // to animate the elements smoothly
  const move = (group: Elem) => {
    //linear velocity
    const linear_v = Number(group.attr("data-lv"))
    //angular velocity
    const angular_v = Number(group.attr("data-av"))

    //x, y coordinate and rotation
    const x = Number(group.attr("data-x"))
    const y = Number(group.attr("data-y"))
    const r = Number(group.attr("data-r"))

    //equations to calculate the movements + rotation
    //uses trigonometry to calculate the new x,y coordinate
    const d = (r - 90) / 180 * Math.PI
    const nx = (x + linear_v * Math.cos(d) + MAP_SIZE) % MAP_SIZE
    const ny = (y + linear_v * Math.sin(d) + MAP_SIZE) % MAP_SIZE
    const nr = (r + angular_v + 360) % 360
    group.attr("data-x", nx)
    group.attr("data-y", ny)
    group.attr("data-r", nr)
    group.attr("transform", "translate("+nx+" "+ny+") rotate("+nr+")")
  }
  // check whether two elements collide or not
  const awayFrom = (h: Elem, g: Elem, radius: number)=>{
    if (g.attr("data-ready") == "false") {
      return true;
    }
    //calculate the distance between element1 and element2
    //uses pythagoras theorem to determine the distance between two points
    const square = (x:number) => x*x;
    const x1 = Number(h.attr("data-x"))
    const y1 = Number(h.attr("data-y"))
    const x2 = Number(g.attr("data-x"))
    const y2 = Number(g.attr("data-y"))
    //To determine whether the two circles intersect:
    //see if the center distance is less than or equal to the sum of the 
    //two circle radius
    const d = square(x1 - x2) + square(y1 - y2)
    return d >= square(radius)
  }
  // check whether the ship collide with any asteroids
  const collide = (h: Elem, gs: Elem[])=>{
    return !g_asteroids.every((g)=>awayFrom(g_ship, g, Number(g.attr("data-s")) + SHIP_RADIUS))
  }

  // the main observable for the game
  // refresh every FREQ, and in this frame:
  //   - calculate the coordinates of all the elements
  //   - check whether you lose the game
  //   - check whether the bullet hits an asteroid or not
  const draw = Observable.interval(FREQ)
    .scan<{n_asteroid: number, last_spawn: number, last_collide: number, game_time: number}>
      // calculate the speed of the ship according to the acceleration
      (init_state, (state, t)=>{
        //get the last state every time the event is triggered,
        // then use the last state to get a new state.
        if (g_ship.attr("data-ready") == "true") {
          const lv = () => {
            const back = g_ship.attr("data-down") === "true" ? ACCELERATION : 0;
            const forward = g_ship.attr("data-up") == "true" ? ACCELERATION : 0;
            const la = forward - back
            const v = Number(g_ship.attr("data-lv"))
            return Math.min(MAX_VELOCITY, Math.max(0, v + la - RESIST))
          }
          g_ship.attr("data-lv", lv())
          const av = () => {
            const left = g_ship.attr("data-left") === "true" ? A_VELOCITY : 0;
            const right = g_ship.attr("data-right") == "true" ? A_VELOCITY : 0;
            return right - left
          }
          g_ship.attr("data-av", av())
        }
        //calculate current game time
        const new_time = g_ship.attr("data-ready")=="true" ? state.game_time + FREQ : 0
        //calculate current score
        const current_score = Math.floor((new_time) / 1000)
        //calculate current level, maximum is level 4, aka the 5th level
        const current_level = Math.min(4, Math.floor(new_time / 20000))
        const current_life = g_title.attr("data-life")
        //check if the game is over
        const col = t - state.last_collide > COLLIDE_GAP &&
          g_ship.attr("data-ready") == "true" &&
          collide(g_ship, g_asteroids)
        if (col) {
          //if theres collision between the ship and an asteroid
          //deduct 1 life
          const new_life = Number(current_life) - 1
          g_title.attr("data-life", new_life)
          if (new_life <= 0) {
            //if live count is below 0, game is over
            g_ship.attr("data-ready", "false")
          }
        }
        if (g_ship.attr("data-ready") == "false") {
          title.text("Game over. Press 'enter' to restart.")
        }
        else {
          //else , game on, update score and level
          title.text("Score: "+current_score+
            "                 Level: "+(current_level+1)+
            "                 Life: "+g_title.attr("data-life"))
        }

        //a funtion that generates random asteroids 
        //data-auto = true : indicates that this is an asteroid that follows the ship
        //date-autp = false : normal asteroid with random movement
        function random_spawn(index: number, cx: number, cy: number, r: number) {
          const lv = Math.random() * MAX_VELOCITY / 2 + NUM_ASTEROID[current_level] / 3
          const dr = Math.random() * 360
          if (Math.random() * 5 < 1) {
            //enery asteroids : targets the ship
            g_asteroids[index].attr("data-auto", "true")
            asteroids[index]
              .attr("style", "fill:orange;stroke:orange;stroke-width:1")
          }
          else {
            //normal asteroid
            g_asteroids[index].attr("data-auto", "false")
            asteroids[index]
              .attr("style", "fill:none;stroke:white;stroke-width:1")
          }
          g_asteroids[index].attr("data-ready", "true")
            .attr("data-x", cx)
            .attr("data-y", cy)
            .attr("data-lv", lv)
            .attr("data-r", dr)
            .attr("data-s", r)
          asteroids[index].attr("r", r)
        }

        // check bullet hits
        //filters out invalid asteroids
        g_asteroids.filter((gp)=>gp.attr("data-ready")=="true")
          .forEach((gp)=>{
            //filters out invalid bullets
            g_bullets.filter((gb)=>gb.attr("data-ready")=="true")
              .forEach((gb, index)=>{
                //check the distance between each bullet and asteroid
                if (!awayFrom(gp, gb, Number(gp.attr("data-s")) + BULLET_SIZE)) {
                  //if there's collision, mark data-ready as false
                  // so the bullets and asteroids are 'destroyed'
                  gp.attr("data-ready", "false")
                  gb.attr("data-ready", "false")
                  const radius = Number(gp.attr("data-s"))
                  const x = Number(gp.attr("data-x"))
                  const y = Number(gp.attr("data-y"))
                  //if the asteroid is big enough,split the asteroid into two
                  if (radius > MIN_SPLIT_RADIUS) {
                    //calculating the index of smaller asteroids
                    const xa = (x + Math.random() * ASTEROID_UB - ASTEROID_LB + 600) % 600
                    const ya = (y + Math.random() * ASTEROID_UB - ASTEROID_LB + 600) % 600
                    const xb = (x + Math.random() * ASTEROID_UB - ASTEROID_LB + 600) % 600
                    const yb = (y + Math.random() * ASTEROID_UB - ASTEROID_LB + 600) % 600
                    random_spawn(index, xa, ya, ASTEROID_LB)
                    const b_index = g_asteroids.findIndex((group)=>group.attr("data-ready") == "false")
                    random_spawn(b_index, xb, yb, ASTEROID_LB)
                  }
                }
              })
          })
        //set the attributes of dangerous asteroids
        if (g_ship.attr("data-ready") == "true" && t - state.last_collide > COLLIDE_GAP) {
          g_asteroids
          //filters out the normal asteroids, keep only the dangerous ones
            .filter((g)=>g.attr("data-auto")=="true")
            .forEach((g)=>{
              //instead of moving in a straight line
              //move towards the ship 
              const dx = Number(g_ship.attr("data-x"))
              const dy = Number(g_ship.attr("data-y"))
              const x = Number(g.attr("data-x"))
              const y = Number(g.attr("data-y"))
              const tr = Math.atan2(dy - y, dx - x) * 180 / Math.PI + 90
              g.attr("data-r", tr)
            })
        }


        const ast_num = g_asteroids.filter((group)=>{
          return group.attr("data-ready") == "true"
        }).length
        // spawn a new asteroid when possible
        const v_asteroid = g_asteroids.filter((group)=>group.attr("data-ready") == "true")
        const s_index = g_asteroids.findIndex((group)=>group.attr("data-ready") == "false")
        //Spawn a new asteroid if 
        //1.the current number of asteroids is lower than the maximum number of asteroids allowed in that level.
        //2.a certain time has elapsed after previous spawn.
        if (s_index != -1 && s_index < NUM_ASTEROID[current_level] && t - state.last_spawn >= SPAWN_GAP) {
          const cx = Math.random() * 600
          const cy = Math.random() * 600
          const r = Math.random() * (ASTEROID_UB - ASTEROID_LB) + ASTEROID_LB
          random_spawn(s_index, cx, cy, r)
          //update game state
          return {n_asteroid: ast_num + 1,
            last_spawn: t,
            last_collide:col?t:state.last_collide,
            game_time:new_time
          }
        }
        //else: just update the game state
        return {n_asteroid: ast_num,
          last_spawn: state.last_spawn,
          last_collide: col?t:state.last_collide,
          game_time:new_time
        }
      })

    // draw everything here
    .subscribe(()=>{
      //visible_move is a function used to move all the elements 
      const visible_move = (group: Elem) => {
        //only move the valid elements
        if (group.attr("data-ready") == "true") {
          move(group) //calls the move function to move the elements
          group.attr("visibility", "visible")
        }
        else {
          group.attr("visibility", "hidden")
        }
      }
      //move the ship
      visible_move(g_ship)
      //move all valid asteroids and bullets
      g_asteroids.forEach(visible_move)
      g_bullets.forEach(visible_move)
    })

  // catch every key pressed event
  // and set the corresponding attrs
  const keydown = Observable.fromEvent<KeyboardEvent>(document, "keydown")
  const keyup = Observable.fromEvent<KeyboardEvent>(document, "keyup")
  //a function that is reusable for all 4 key controls
  const arrowSub = (key: string, dataAttr: string)=>{
    keydown
      .filter(({code: c})=>c == key)
      .subscribe(()=>{
        g_ship.attr(dataAttr, "true")
      })
    keyup
      .filter(({code: c})=>c == key)
      .subscribe(()=>{
        g_ship.attr(dataAttr, "false")
      })
  }
  //the four keys to control the game
  arrowSub("KeyW", "data-up")
  arrowSub("KeyS", "data-down")
  arrowSub("KeyA", "data-left")
  arrowSub("KeyD", "data-right")

  //if game is over and enter key is pressed, restart the game
  keydown
    .filter(({code:c})=>c=="Enter")
    .filter(()=>g_ship.attr("data-ready")=="false")
    .subscribe(()=>{
      initilize()
    })

  // listen to the F key pressed
  // and set a cooling down time of 20ms
  // and shot the bullet according to the current position and orientation of
  // the ship
  // and also "kill" this bullet after BULLET_RANGE by setting a
  // new Observable.timeout(BULLET_RANGE) and then do complete function
  keydown
    .filter(({code:c})=>c=="Space")
    .filter(()=>g_ship.attr("data-ready")=="true")
    //new added observable function
    //used to implement the bullet cooling feature
    //a certain time must elapse before triggering the next bullet
    .timer(BULLET_CD)
    .flatMap(()=>{
      const s_group = g_bullets.find((g)=>g.attr("data-cd")=="false")
      if (s_group) {
        //setting the bullet attributes
        s_group.attr("data-x", g_ship.attr("data-x"))
        s_group.attr("data-y", g_ship.attr("data-y"))
        s_group.attr("data-r", g_ship.attr("data-r"))
        s_group.attr("data-lv", BULLET_VELOCITY)
        s_group.attr("data-ready", "true")
        s_group.attr("data-cd", "true")
      }
      return new Observable<void>((observer)=>{
        //'kill' the bullet after a certain time
        return Observable.timeout(BULLET_RANGE).subscribe(()=>{}, ()=>{
          if(s_group){
            s_group.attr("data-ready", "false")
            s_group.attr("data-cd", "false")
          }
        })
      })
    }).subscribe(()=>{})
}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
  }
