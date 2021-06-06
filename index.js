const canvas = document.querySelector('canvas');
canvas.width = innerWidth;
canvas.height = innerHeight;

const scoreEl = document.getElementById('scoreEl');
const startGameEl = document.getElementById('startGameEl');
const modalEl = document.getElementById('modalEl');
const modalScore = document.getElementById('modalScore');

const ctx = canvas.getContext('2d');

class Player
{
	constructor( x, y, radius, color )
	{
		this.x = x;
		this.y = y;
		this.radius = radius;
 		this.color = color;

	}
	draw()
	{
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		ctx.fillStyle = this.color;
		ctx.fill();
	}
}


class Projectile
{
	constructor( x, y, radius, color, velocity )
	{
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color;
		this.velocity = velocity;
	}
	draw()
	{
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		ctx.fillStyle = this.color;
		ctx.fill();
	}
	update()
	{
		this.draw();
		this.x = this.x + this.velocity.x;
		this.y = this.y + this.velocity.y;

	}
}

class Enemy
{
	constructor( x, y, radius, color, velocity )
	{
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color;
		this.velocity = velocity;
	}
	draw()
	{
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		ctx.fillStyle = this.color;
		ctx.fill();
	}
	update()
	{
		this.draw();
		this.x = this.x + this.velocity.x;
		this.y = this.y + this.velocity.y;

	}
}

const friction = 0.99;
class Particle
{
	constructor( x, y, radius, color, velocity )
	{
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color;
		this.velocity = velocity;
		this.alpha = 1;
	}
	draw()
	{
		ctx.save();
		ctx.globalAlpha = this.alpha;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		ctx.fillStyle = this.color;
		ctx.fill();
		ctx.restore();
	}
	update()
	{
		this.draw();
		this.velocity.x *= friction;
		this.velocity.y *= friction;
		this.x = this.x + this.velocity.x;
		this.y = this.y + this.velocity.y;
		this.alpha -= 0.01;

	}
}


const x = canvas.width / 2;
const y = canvas.height / 2;
let player = new Player(x,y, 15, 'white');


// sprite arrays
let projectiles = [];
let enemies = [];
let particles = [];

function init ()
{
	player = new Player(x,y, 15, 'white');
	projectiles = [];
	enemies = [];
	particles = [];
	score = 0;
	scoreEl.innerHTML = score;
}


function spawnEnemies ()
{
	setInterval(() => {
		let x;
		let y;
		const radius = Math.random() * 25 + 10;
		if(Math.random() > 0.5)
		{
			x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
			y = Math.random() * canvas.height;

		} else
		{
			x = Math.random() * canvas.width;
			y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;

		}
		const color = `hsl(${Math.random() * 360}, 50%, 50%)`
		const angle = Math.atan2(canvas.height / 2 - y, 
								canvas.width / 2 - x);
		const velocity = {
			x: Math.cos(angle) / (radius / 20),
			y: Math.sin(angle) / (radius / 20)
		}

		enemies.push( new Enemy (x , y, radius, color, velocity ));
	}, 1000);
	
}

let animationID;
let score = 0;

function animate()
{
	animationID = requestAnimationFrame(animate);
	ctx.fillStyle = 'rgba(0,0,0,0.1)';
	ctx.fillRect(0,0, canvas.width, canvas.height);
	player.draw();
	particles.forEach((particle, index) => {
		if( particle.alpha <= 0 )
		{
			particles.splice(index, 1)
		}else
		{
			particle.update();
		}
	});
	

	//remove projectiles from edges of screen
	projectiles.forEach((projectile, projIndex)=> {
		projectile.update();
		if (projectile.x + projectile.radius < 0 || 
			projectile.x - projectile.radius > canvas.width || 
			projectile.y + projectile.radius < 0 || 
			projectile.y - projectile.radius > canvas.height ) 
		{
			setTimeout(() => 
			{
				projectiles.splice(projIndex, 1);
			});
		}
	});

	enemies.forEach((enemy, enemIndex) => 
	{
		enemy.update();
		const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
		
		// end game
		if( dist - enemy.radius - player.radius < 1 )
		{
			modalEl.style.display = 'flex';
			modalScore.innerHTML = score;
			cancelAnimationFrame(animationID);
		} 
		projectiles.forEach((projectile, projIndex) => {
			const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
			
			// particle formation after projectile hits enemy


			// projectile touch enemy
			if( dist - enemy.radius - projectile.radius < 1 )
			{
				// create explosion
				const numPar = enemy.radius * 2;
				for ( let i = 0; i < numPar; i++ )
				{
					particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2 + 1, enemy.color, {
						x: (Math.random() - 0.5) * (Math.random() * 4),
						y: (Math.random() - 0.5) * (Math.random() * 4)
					}));
				}

				if( enemy.radius - 10 > 5 )
				{

					// increase the score
					score += 100;
					scoreEl.innerHTML = score;
					
					gsap.to(enemy, {
						radius: enemy.radius - 10
					});
					setTimeout(() => 
					{
						projectiles.splice(projIndex, 1);
					});
				} else 
				{
					// increase the score
					score += 250;
					scoreEl.innerHTML = score;
					
					setTimeout(() => 
					{
						enemies.splice(enemIndex, 1);
						projectiles.splice(projIndex, 1);
					});
				}
			}
		})

	});
}

addEventListener('mousedown', (event ) => 
{
	let numPro = 0;
	const angle = Math.atan2(event.clientY - y, event.clientX - x);
	const velocity = {
		x: Math.cos(angle) * 5,
		y: Math.sin(angle) * 5
	}
	projectiles.push(new Projectile (x, y, 5, player.color, velocity));
	projectiles.forEach( () => {
		numPro ++;
	});

});

startGameEl.addEventListener('click', event =>
{
	init();
	animate();
	spawnEnemies();
	modalEl.style.display = 'none';
});

