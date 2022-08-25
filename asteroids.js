"use strict";
function asteroids() {
    const NUM_ASTEROID = new Array(6, 9, 12, 15, 18);
    const FPS = 30;
    const FREQ = Math.floor(1000 / FPS);
    const BULLET_CD = 20;
    const BULLET_RANGE = 500;
    const NUM_BULLET = Math.floor(BULLET_RANGE / BULLET_CD) + 1;
    const MAX_VELOCITY = 10;
    const A_VELOCITY = 5;
    const ACCELERATION = 3;
    const RESIST = 1;
    const MAP_SIZE = 600;
    const SPAWN_GAP = 1000;
    const ASTEROID_UB = 30;
    const ASTEROID_LB = 15;
    const COLLIDE_RADIUS = 25;
    const SHIP_RADIUS = 18;
    const BULLET_SIZE = 3;
    const BULLET_VELOCITY = 20;
    const COLLIDE_GAP = 1000;
    const MIN_SPLIT_RADIUS = 20;
    const svg = document.getElementById("canvas");
    let g_ship = new Elem(svg, 'g')
        .attr("transform", "translate(300 300) rotate(0)");
    let ship = new Elem(svg, 'polygon', g_ship.elem)
        .attr("points", "-15,20 15,20 0,-20")
        .attr("style", "fill:white;stroke:white;stroke-width:1");
    function createNGroup(n) {
        return new Array(n).fill(0).map(() => {
            return new Elem(svg, 'g');
        });
    }
    let g_asteroids = createNGroup(NUM_ASTEROID[4]).map(() => new Elem(svg, 'g'));
    let asteroids = g_asteroids.map((group) => {
        return new Elem(svg, 'circle', group.elem)
            .attr("style", "fill:none;stroke:white;stroke-width:1")
            .attr("cx", "0")
            .attr("cy", "0");
    });
    let g_title = new Elem(svg, "g")
        .attr("transform", "translate(300 40)");
    let title = new Elem(svg, "text", g_title.elem)
        .attr("font-size", "20px")
        .attr("font-family", "sans-serif")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("style", "white-space:pre");
    title.text("Score: 0                 Level: 1                 Life: 3");
    let g_bullets = createNGroup(NUM_BULLET);
    let bullets = g_bullets.map((group) => {
        return new Elem(svg, 'circle', group.elem)
            .attr("style", "fill:red;stroke:orange;stroke-width:1")
            .attr("cx", "0")
            .attr("cy", "0")
            .attr("r", BULLET_SIZE);
    });
    const initilize = () => {
        g_bullets.forEach(e => {
            e.attr("visibility", "hidden")
                .attr("data-ready", "false")
                .attr("data-cd", "false");
        });
        g_asteroids.forEach(e => {
            e.attr("visibility", "hidden");
            e.attr("data-ready", "false");
        });
        g_ship
            .attr("visibility", "visible")
            .attr("data-ready", "true")
            .attr("data-av", "0")
            .attr("data-lv", "0")
            .attr("data-x", "300")
            .attr("data-y", "300")
            .attr("data-r", "0");
        g_title.
            attr("data-life", "3");
    };
    initilize();
    const init_state = {
        n_asteroid: 0,
        last_spawn: 0,
        last_collide: -1000,
        game_time: 0
    };
    const move = (group) => {
        const linear_v = Number(group.attr("data-lv"));
        const angular_v = Number(group.attr("data-av"));
        const x = Number(group.attr("data-x"));
        const y = Number(group.attr("data-y"));
        const r = Number(group.attr("data-r"));
        const d = (r - 90) / 180 * Math.PI;
        const nx = (x + linear_v * Math.cos(d) + MAP_SIZE) % MAP_SIZE;
        const ny = (y + linear_v * Math.sin(d) + MAP_SIZE) % MAP_SIZE;
        const nr = (r + angular_v + 360) % 360;
        group.attr("data-x", nx);
        group.attr("data-y", ny);
        group.attr("data-r", nr);
        group.attr("transform", "translate(" + nx + " " + ny + ") rotate(" + nr + ")");
    };
    const awayFrom = (h, g, radius) => {
        if (g.attr("data-ready") == "false") {
            return true;
        }
        const square = (x) => x * x;
        const x1 = Number(h.attr("data-x"));
        const y1 = Number(h.attr("data-y"));
        const x2 = Number(g.attr("data-x"));
        const y2 = Number(g.attr("data-y"));
        const d = square(x1 - x2) + square(y1 - y2);
        return d >= square(radius);
    };
    const collide = (h, gs) => {
        return !g_asteroids.every((g) => awayFrom(g_ship, g, Number(g.attr("data-s")) + SHIP_RADIUS));
    };
    const draw = Observable.interval(FREQ)
        .scan(init_state, (state, t) => {
        if (g_ship.attr("data-ready") == "true") {
            const lv = () => {
                const back = g_ship.attr("data-down") === "true" ? ACCELERATION : 0;
                const forward = g_ship.attr("data-up") == "true" ? ACCELERATION : 0;
                const la = forward - back;
                const v = Number(g_ship.attr("data-lv"));
                return Math.min(MAX_VELOCITY, Math.max(0, v + la - RESIST));
            };
            g_ship.attr("data-lv", lv());
            const av = () => {
                const left = g_ship.attr("data-left") === "true" ? A_VELOCITY : 0;
                const right = g_ship.attr("data-right") == "true" ? A_VELOCITY : 0;
                return right - left;
            };
            g_ship.attr("data-av", av());
        }
        const new_time = g_ship.attr("data-ready") == "true" ? state.game_time + FREQ : 0;
        const current_score = Math.floor((new_time) / 1000);
        const current_level = Math.min(4, Math.floor(new_time / 20000));
        const current_life = g_title.attr("data-life");
        const col = t - state.last_collide > COLLIDE_GAP &&
            g_ship.attr("data-ready") == "true" &&
            collide(g_ship, g_asteroids);
        if (col) {
            const new_life = Number(current_life) - 1;
            g_title.attr("data-life", new_life);
            if (new_life <= 0) {
                g_ship.attr("data-ready", "false");
            }
        }
        if (g_ship.attr("data-ready") == "false") {
            title.text("Game over. Press 'enter' to restart.");
        }
        else {
            title.text("Score: " + current_score +
                "                 Level: " + (current_level + 1) +
                "                 Life: " + g_title.attr("data-life"));
        }
        function random_spawn(index, cx, cy, r) {
            const lv = Math.random() * MAX_VELOCITY / 2 + NUM_ASTEROID[current_level] / 3;
            const dr = Math.random() * 360;
            if (Math.random() * 5 < 1) {
                g_asteroids[index].attr("data-auto", "true");
                asteroids[index]
                    .attr("style", "fill:orange;stroke:orange;stroke-width:1");
            }
            else {
                g_asteroids[index].attr("data-auto", "false");
                asteroids[index]
                    .attr("style", "fill:none;stroke:white;stroke-width:1");
            }
            g_asteroids[index].attr("data-ready", "true")
                .attr("data-x", cx)
                .attr("data-y", cy)
                .attr("data-lv", lv)
                .attr("data-r", dr)
                .attr("data-s", r);
            asteroids[index].attr("r", r);
        }
        g_asteroids.filter((gp) => gp.attr("data-ready") == "true")
            .forEach((gp) => {
            g_bullets.filter((gb) => gb.attr("data-ready") == "true")
                .forEach((gb, index) => {
                if (!awayFrom(gp, gb, Number(gp.attr("data-s")) + BULLET_SIZE)) {
                    gp.attr("data-ready", "false");
                    gb.attr("data-ready", "false");
                    const radius = Number(gp.attr("data-s"));
                    const x = Number(gp.attr("data-x"));
                    const y = Number(gp.attr("data-y"));
                    if (radius > MIN_SPLIT_RADIUS) {
                        const xa = (x + Math.random() * ASTEROID_UB - ASTEROID_LB + 600) % 600;
                        const ya = (y + Math.random() * ASTEROID_UB - ASTEROID_LB + 600) % 600;
                        const xb = (x + Math.random() * ASTEROID_UB - ASTEROID_LB + 600) % 600;
                        const yb = (y + Math.random() * ASTEROID_UB - ASTEROID_LB + 600) % 600;
                        random_spawn(index, xa, ya, ASTEROID_LB);
                        const b_index = g_asteroids.findIndex((group) => group.attr("data-ready") == "false");
                        random_spawn(b_index, xb, yb, ASTEROID_LB);
                    }
                }
            });
        });
        if (g_ship.attr("data-ready") == "true" && t - state.last_collide > COLLIDE_GAP) {
            g_asteroids
                .filter((g) => g.attr("data-auto") == "true")
                .forEach((g) => {
                const dx = Number(g_ship.attr("data-x"));
                const dy = Number(g_ship.attr("data-y"));
                const x = Number(g.attr("data-x"));
                const y = Number(g.attr("data-y"));
                const tr = Math.atan2(dy - y, dx - x) * 180 / Math.PI + 90;
                g.attr("data-r", tr);
            });
        }
        const ast_num = g_asteroids.filter((group) => {
            return group.attr("data-ready") == "true";
        }).length;
        const v_asteroid = g_asteroids.filter((group) => group.attr("data-ready") == "true");
        const s_index = g_asteroids.findIndex((group) => group.attr("data-ready") == "false");
        if (s_index != -1 && s_index < NUM_ASTEROID[current_level] && t - state.last_spawn >= SPAWN_GAP) {
            const cx = Math.random() * 600;
            const cy = Math.random() * 600;
            const r = Math.random() * (ASTEROID_UB - ASTEROID_LB) + ASTEROID_LB;
            random_spawn(s_index, cx, cy, r);
            return { n_asteroid: ast_num + 1,
                last_spawn: t,
                last_collide: col ? t : state.last_collide,
                game_time: new_time
            };
        }
        return { n_asteroid: ast_num,
            last_spawn: state.last_spawn,
            last_collide: col ? t : state.last_collide,
            game_time: new_time
        };
    })
        .subscribe(() => {
        const visible_move = (group) => {
            if (group.attr("data-ready") == "true") {
                move(group);
                group.attr("visibility", "visible");
            }
            else {
                group.attr("visibility", "hidden");
            }
        };
        visible_move(g_ship);
        g_asteroids.forEach(visible_move);
        g_bullets.forEach(visible_move);
    });
    const keydown = Observable.fromEvent(document, "keydown");
    const keyup = Observable.fromEvent(document, "keyup");
    const arrowSub = (key, dataAttr) => {
        keydown
            .filter(({ code: c }) => c == key)
            .subscribe(() => {
            g_ship.attr(dataAttr, "true");
        });
        keyup
            .filter(({ code: c }) => c == key)
            .subscribe(() => {
            g_ship.attr(dataAttr, "false");
        });
    };
    arrowSub("KeyW", "data-up");
    arrowSub("KeyS", "data-down");
    arrowSub("KeyA", "data-left");
    arrowSub("KeyD", "data-right");
    keydown
        .filter(({ code: c }) => c == "Enter")
        .filter(() => g_ship.attr("data-ready") == "false")
        .subscribe(() => {
        initilize();
    });
    keydown
        .filter(({ code: c }) => c == "Space")
        .filter(() => g_ship.attr("data-ready") == "true")
        .timer(BULLET_CD)
        .flatMap(() => {
        const s_group = g_bullets.find((g) => g.attr("data-cd") == "false");
        if (s_group) {
            s_group.attr("data-x", g_ship.attr("data-x"));
            s_group.attr("data-y", g_ship.attr("data-y"));
            s_group.attr("data-r", g_ship.attr("data-r"));
            s_group.attr("data-lv", BULLET_VELOCITY);
            s_group.attr("data-ready", "true");
            s_group.attr("data-cd", "true");
        }
        return new Observable((observer) => {
            return Observable.timeout(BULLET_RANGE).subscribe(() => { }, () => {
                if (s_group) {
                    s_group.attr("data-ready", "false");
                    s_group.attr("data-cd", "false");
                }
            });
        });
    }).subscribe(() => { });
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map