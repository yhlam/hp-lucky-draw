/**
 * Hardcoded Result
 */
function Result(large, small) {
    this.large_wheel = large;
    this.small_wheel = small;
}

var round = 0;

var RESULTS = [
    new Result(16,  2), new Result(27, 12), new Result( 3,  7), new Result(30,  4), new Result(12,  5),
    new Result( 4,  2), new Result(29,  7), new Result(23, 10), new Result( 1, 11), new Result(24,  4),
    new Result(31,  3), new Result(20,  7), new Result(28,  3), new Result(19,  8), new Result( 2,  2),
    new Result( 5,  9), new Result(21, 10), new Result(18,  1), new Result( 6, 11), new Result( 9, 12),
    new Result( 7,  3), new Result(17,  6), new Result(32,  5), new Result( 8,  8), new Result(26,  2),
    new Result(10,  1), new Result(15,  3), new Result(22,  2), new Result(13,  5), new Result(11,  7),
    new Result(25,  9), new Result(14, 11), new Result( 5, 10), new Result(16, 12), new Result(20,  3),
    new Result( 1,  5), new Result( 3,  9), new Result(27,  3), new Result(15,  7), new Result( 8, 11),
    new Result(11, 12), new Result(19,  9), new Result( 6, 10), new Result(17,  4), new Result(14,  9),
    new Result( 9,  6), new Result(18,  6), new Result(25,  1), new Result(21,  8), new Result(10,  2),
];


/**
 * Position and scale of image on start and resize
 */
var heights = {}; // Map of ID to original height
$(document).ready(function() {
    var imgs = document.getElementsByClassName('image');
    for(var i=0; i<imgs.length; i++) {
        var img = imgs[i];
        heights[img.id] = img.height;
    }
});

var cum_ratio = 1.0;
function init() {
    var bg = document.getElementById('bg');
    var ratio = window.innerHeight / bg.height;
    cum_ratio = cum_ratio * ratio;
    var left = (window.innerWidth - bg.width * ratio) / 2;

    var imgs = document.getElementsByClassName('image');
    for(var i=0; i<imgs.length; i++) {
        var img = imgs[i];
        var original_height = heights[img.id];
        img.height = original_height * cum_ratio;

        var x_offset = img.getAttribute('x-offset');
        if(x_offset) {
            img.style.left = (left + parseFloat(x_offset) * cum_ratio) + 'px';
        }
        else {
            img.style.left = left + 'px';
        }

        var y_offset = img.getAttribute('y-offset');
        if(y_offset) {
            img.style.top = (parseFloat(y_offset) * cum_ratio) + 'px';
        }
    }
}

$(document).ready(init);
$(window).resize(init);


/**
 * Setup flashing of light blub
 */
$(document).ready(function() {
    var show = 0;
    setInterval(function() {
        if(show % 2) {
            document.getElementById('blub0').style.display = 'none';
            document.getElementById('blub1').style.display = 'inline';
        }
        else {
            document.getElementById('blub1').style.display = 'none';
            document.getElementById('blub0').style.display = 'inline';
        }
        show++;
    }, 500);
});


/**
 * Setup mouse over response of owl
 */
$('#owl').hover(function(e) {
    $('#owl').attr('src', 'img/owl-hover.png');
}, function(e) {
    $('#owl').attr('src', 'img/owl.png');
});


/**
 * Constructor of Wheel
 * id: ID of the wheel element
 * slice_num: Number of slice in the wheel
 * time_quantum: time interval to update position of wheel
 * friction_sec: intialal friction in degree second^-2
 * minimum_friction_sec: minium friction
 * omega_base_sec: Rate of change of angle in degree / second
 * omega_var_sec: Range of variation of omega
 * clockwise: true if rotate in clockwise, false if rotate in anti-clockwise
 * safe_ratio: percentage of cell the is the pointer safe to stop at
 */
function Wheel(id, slice_num, time_quantum, friction_sec, minimum_friction_sec, omega_base_sec, omega_var_sec, clockwise, safe_ratio) {
    this.id = id;
    this.element = document.getElementById(id);
    this.jquery_obj = $('#' + id);
    this.slice_num = slice_num
    this.time_quantum = time_quantum;
    this.friction_coeff = friction_sec / omega_base_sec / time_quantum;
    this.minimum_friction = friction_sec / time_quantum;
    this.omega_base = omega_base_sec / time_quantum;
    this.omega_var = omega_var_sec / time_quantum;
    this.clockwise = clockwise;
    this.slice_degree = 360 / slice_num;
    this.lower_safe_boundary = this.slice_degree * safe_ratio / 2;
    this.upper_safe_boundary = this.slice_degree * (1 - safe_ratio / 2);
    this.theta = 0;
    this.omega = 0;
    this.rotating = false;
    this.complete = true;
    this.timer = null;

    this.rotate = function() {
        this.rotating = true;
        if(this.complete) {
            this.omega = this.omega_base + (Math.random() - 0.5) * this.omega_var;
            this.complete = false;

            /**
             * Simulation
             */
            var sim_omega = this.omega;
            var sim_theta = this.theta;
            while(sim_omega>0) {
                sim_theta += this.clockwise ? sim_omega : -sim_omega;
                sim_omega -= Math.max(this.friction_coeff * sim_omega, this.minimum_friction);
            }

            var effective_theta = sim_theta >= 0 ? sim_theta % 360 : (-sim_theta) % 360;

            // Handle the pre-set results
            if(round < RESULTS.length) {
                var target = RESULTS[round];
                if(target) {
                    var target_slice = target[this.id];
                    var slice;
                    if(this.clockwise) {
                        slice = slice_num - Math.floor((effective_theta + this.slice_degree / 2.0) / this.slice_degree) + 1;
                    }
                    else {
                        slice = Math.floor((effective_theta + this.slice_degree / 2.0) / this.slice_degree) + 1;
                    }
                    if(slice != target_slice) {
                        this.theta -= this.slice_degree * (target_slice - slice);
                    }
                }
            }

            // Make sure the wheel stop as center of a slice
            var center_deviation = effective_theta % this.slice_degree;
            if(center_deviation > this.lower_safe_boundary && center_deviation < this.upper_safe_boundary) {
                var boundary = (this.lower_safe_boundary + this.upper_safe_boundary) / 2;
                if(center_deviation < boundary) {
                    this.theta -= (center_deviation - this.lower_safe_boundary) * (this.clockwise ? 1 : -1);
                }
                else {
                    this.theta += (this.upper_safe_boundary - center_deviation) * (this.clockwise ? 1 : -1);
                }
            }
        }

        var wheel = this;
        this.timer = setInterval(function() {
            wheel.theta += wheel.clockwise ? wheel.omega : -wheel.omega;
            wheel.jquery_obj.rotate(wheel.theta);

            var deceleration = Math.max(wheel.friction_coeff * wheel.omega, wheel.minimum_friction);
            if(wheel.omega <= deceleration) {
                clearInterval(wheel.timer);
                wheel.timer = null;
                wheel.complete = true;
                wheel.rotating = false;
            }
            else {
                wheel.omega -= deceleration;
            }
        }, this.time_quantum);
    }

    this.pause = function() {
        if(this.timer && !this.complete) {
            clearInterval(this.timer);
            this.timer = null;
            this.rotating = false;
        }
    }

    return this;
}

var large_wheel = new Wheel('large_wheel', 32, 30, 1.2, 0.5, 250, 90, false, 0.5);
var small_wheel = new Wheel('small_wheel', 12, 30, 3, 0.5, 360, 90, true, 0.4);

$('#owl').click(function () {
    if(large_wheel.rotating || small_wheel.rotating) {
        large_wheel.pause();
        small_wheel.pause();
    }
    else {
        if(large_wheel.complete == small_wheel.complete) {
            var increase_round = large_wheel.complete;
            large_wheel.rotate();
            small_wheel.rotate();
            if(increase_round) {
                round++;
            }
        }
        else if(!large_wheel.complete) {
            large_wheel.rotate();
        }
        else if(!small_wheel.complete) {
            small_wheel.rotate();
        }
    }
});
