class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.santa = document.getElementById('santa');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.giftsContainer = document.getElementById('gifts-container');
        this.chimneysContainer = document.getElementById('chimneys-container');
        this.score = 0;
        this.lives = 3;
        this.isGameOver = false;
        this.lastScoreTime = 0;
        this.scoreInterval = 1000; // Check every second
        this.scoreIncrement = 1; // Will count up to 5
        this.currentScoreCount = 0; // Track progress to next 5
        this.giftDeliveryPoints = 5; // 5 points for delivering a gift
        this.isInvulnerable = false;
        this.invulnerableTime = 1500; // 1.5 seconds of invulnerability after hit
        
        // Physics parameters
        this.gravity = 0.25;
        this.lift = -0.5;
        this.velocity = 0;
        this.maxVelocity = 6;
        this.santaY = 25;
        this.isSpacePressed = false;
        this.damping = 0.98;
        
        // Gift parameters
        this.gifts = [];
        this.giftTypes = ['🍭', '🎄', '🍪', '🎁', '⭐'];
        this.giftSizes = [40, 45, 50];
        this.giftColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        this.lastGiftTime = 0;
        this.giftSpawnInterval = 2000;
        this.giftSpeed = 3;
        
        // Scoring parameters
        this.giftScores = {
            '🍭': 10,   // Candy
            '🎄': 20,   // Tree
            '🍪': 15,   // Cookie
            '🎁': 25,   // Present
            '⭐': 30    // Star
        };
        
        // Game state
        this.lastScoreTime = 0;
        this.lastSmokeTime = 0;
        this.nextSmokeInterval = this.getRandomInterval();
        this.smokingHouses = [];
        
        // House parameters
        this.houses = [];
        this.lastHouseTime = 0;
        this.minHouseInterval = 1000;
        this.maxHouseInterval = 2000;
        this.houseSpeed = 2;
        this.nextHouseSpawn = this.getRandomInterval();
        
        // House colors for after gift delivery
        this.houseColors = [
            { body: '#FF6B6B', roof: '#FF8787' },  // Red house
            { body: '#4ECDC4', roof: '#45B7AF' },  // Teal house
            { body: '#96CEB4', roof: '#88BEA6' },  // Green house
            { body: '#D4A5A5', roof: '#BC9393' },  // Pink house
            { body: '#9FA4C4', roof: '#8B8FA8' },  // Purple house
            { body: '#FFD93D', roof: '#F4C724' },  // Yellow house
            { body: '#6C5B7B', roof: '#574A64' }   // Dark purple house
        ];
        
        // House sizes
        this.houseSizes = [
            { width: 100, height: 120 },
            { width: 90, height: 110 },
            { width: 110, height: 130 }
        ];
        
        // Window configurations for houses
        this.windowConfigs = [
            // 3 windows
            [
                { left: '20%', top: '40%' },
                { left: '50%', top: '40%' },
                { left: '80%', top: '40%' }
            ],
            // 4 windows
            [
                { left: '20%', top: '30%' },
                { left: '60%', top: '30%' },
                { left: '20%', top: '60%' },
                { left: '60%', top: '60%' }
            ],
            // 5 windows
            [
                { left: '20%', top: '30%' },
                { left: '50%', top: '30%' },
                { left: '80%', top: '30%' },
                { left: '35%', top: '60%' },
                { left: '65%', top: '60%' }
            ]
        ];
        
        // Obstacle parameters
        this.obstacles = [];
        this.obstacleContainer = document.createElement('div');
        this.obstacleContainer.id = 'obstacle-container';
        this.container.appendChild(this.obstacleContainer);
        
        this.lastObstacleTime = 0;
        this.obstacleInterval = 3000; // New obstacle every 3 seconds
        this.triangleChance = 0.15; // Start with 15% chance of triangles
        this.difficultyIncreaseInterval = 50; // Increase difficulty every 50 points
        
        // Smoke parameters
        this.lastSmokeCheck = 0;
        this.smokeCheckInterval = 1000; // Check every second
        this.smokeChance = 0.3; // 30% chance for a house to start smoking
        this.smokeDuration = { min: 2000, max: 5000 }; // Smoke lasts 2-5 seconds
        
        // Snowfall parameters
        this.snowflakes = [];
        this.lastSnowTime = 0;
        this.snowInterval = 200; // Create snow every 200ms
        this.maxSnowflakes = 50; // Maximum snowflakes on screen
        
        // Create mountain background
        this.createMountainBackground();
        
        // Initialize game
        this.setupGame();
        this.updateScore();
    }
    
    updateScore(currentTime) {
        // Increment score counter every second
        if (!this.isGameOver && currentTime - this.lastScoreTime > this.scoreInterval) {
            this.currentScoreCount += this.scoreIncrement;
            this.lastScoreTime = currentTime;
            
            // When we reach 5, add to score
            if (this.currentScoreCount >= 5) {
                this.score += 5;
                this.currentScoreCount = 0; // Reset counter
                this.scoreElement.textContent = `Score: ${this.score}`;
            }
        }
    }
    
    updateLives() {
        this.livesElement.textContent = '❤️'.repeat(this.lives);
    }
    
    checkCollisions() {
        const santaRect = this.santa.getBoundingClientRect();
        
        // Check gift collisions
        for (let i = this.gifts.length - 1; i >= 0; i--) {
            const gift = this.gifts[i];
            const giftRect = gift.element.getBoundingClientRect();
            
            if (this.isColliding(santaRect, giftRect)) {
                // Add score based on gift type
                const giftType = gift.element.textContent;
                this.score += this.giftScores[giftType];
                
                // Make gift fall
                gift.element.classList.add('falling');
                
                // Find closest house and make it colorful
                let closestHouse = null;
                let minDistance = Infinity;
                
                this.houses.forEach(house => {
                    const houseRect = house.element.getBoundingClientRect();
                    const distance = Math.abs(giftRect.left - houseRect.left);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestHouse = house.element;
                    }
                });
                
                if (closestHouse) {
                    this.makeHouseColorful(closestHouse);
                }
                
                // Remove gift after animation
                setTimeout(() => {
                    if (gift.element.parentNode) {
                        this.giftsContainer.removeChild(gift.element);
                    }
                    const index = this.gifts.indexOf(gift);
                    if (index > -1) {
                        this.gifts.splice(index, 1);
                    }
                }, 4000);
                
                // Update score display
                this.updateScore();
            }
        }
        
        // Check chimney collisions
        for (const house of this.houses) {
            const chimneyRect = house.element.querySelector('.chimney').getBoundingClientRect();
            
            if (this.isColliding(santaRect, chimneyRect)) {
                this.handleChimneyCollision();
            }
        }
        
        // Check smoke collision
        this.checkSmokeCollisions();
    }
    
    isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }
    
    handleChimneyCollision() {
        if (!this.isInvulnerable) {
            this.lives--;
            this.updateLives();
            
            // Make Santa invulnerable briefly
            this.isInvulnerable = true;
            this.santa.style.opacity = '0.5';
            
            setTimeout(() => {
                this.isInvulnerable = false;
                this.santa.style.opacity = '1';
            }, 2000);
            
            if (this.lives <= 0) {
                this.gameOver();
            }
        }
    }
    
    showCollectionEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'collection-effect';
        effect.textContent = '+points';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        
        this.container.appendChild(effect);
        
        setTimeout(() => {
            this.container.removeChild(effect);
        }, 1000);
    }
    
    gameOver() {
        this.isGameOver = true;
        alert(`Game Over! Final Score: ${this.score}`);
        location.reload(); // Restart game
    }
    
    setupGame() {
        this.setupControls();
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    spawnGift() {
        const type = this.giftTypes[Math.floor(Math.random() * this.giftTypes.length)];
        const size = this.giftSizes[Math.floor(Math.random() * this.giftSizes.length)];
        const color = this.giftColors[Math.floor(Math.random() * this.giftColors.length)];
        
        const gift = document.createElement('div');
        gift.className = 'gift';
        gift.textContent = type;
        gift.style.fontSize = size + 'px';
        gift.style.color = color;
        
        // Position gift on the right side at random height
        const minY = 100;  // Keep below score
        const maxY = this.container.clientHeight - 300;  // Keep well above houses
        const y = Math.random() * (maxY - minY) + minY;
        
        gift.style.left = this.container.clientWidth + 'px';
        gift.style.top = y + 'px';
        
        this.giftsContainer.appendChild(gift);
        
        this.gifts.push({
            element: gift,
            x: this.container.clientWidth,
            y: y,
            size: size
        });
    }
    
    updateGifts(deltaTime) {
        const currentTime = performance.now();
        
        // Spawn new gift if enough time has passed
        if (currentTime - this.lastGiftTime > this.giftSpawnInterval) {
            this.spawnGift();
            this.lastGiftTime = currentTime;
        }
        
        // Update gift positions
        for (let i = this.gifts.length - 1; i >= 0; i--) {
            const gift = this.gifts[i];
            gift.x -= this.giftSpeed;
            gift.element.style.left = gift.x + 'px';
            
            // Remove gifts that are off screen
            if (gift.x < -50) {
                this.giftsContainer.removeChild(gift.element);
                this.gifts.splice(i, 1);
            }
        }
    }
    
    createHouse() {
        const house = document.createElement('div');
        house.className = 'house';
        
        // Create roof
        const roof = document.createElement('div');
        roof.className = 'roof';
        house.appendChild(roof);
        
        // Create chimney
        const chimney = document.createElement('div');
        chimney.className = 'chimney';
        house.appendChild(chimney);
        
        // Create smoke
        const smoke = document.createElement('div');
        smoke.className = 'smoke';
        chimney.appendChild(smoke);
        
        // Add random number of windows
        const windowLayout = this.windowConfigs[Math.floor(Math.random() * this.windowConfigs.length)];
        windowLayout.forEach(config => {
            const window = document.createElement('div');
            window.className = 'window';
            window.style.left = config.left;
            window.style.top = config.top;
            house.appendChild(window);
        });
        
        return house;
    }
    
    getRandomInterval() {
        // Random interval between 1 and 2 seconds
        return Math.random() * 1000 + 1000;
    }
    
    updateHouses(deltaTime) {
        const currentTime = performance.now();
        
        // Spawn new house if enough time has passed
        if (currentTime - this.lastHouseTime > this.nextHouseSpawn) {
            this.spawnHouse();
            this.lastHouseTime = currentTime;
            this.nextHouseSpawn = this.getRandomInterval();
        }
        
        // Update house positions
        for (let i = this.houses.length - 1; i >= 0; i--) {
            const house = this.houses[i];
            house.x -= this.houseSpeed;
            house.element.style.left = house.x + 'px';
            
            // Remove houses that are off screen
            if (house.x < -150) {
                // Remove from smoking houses if it was smoking
                const smokeIndex = this.smokingHouses.findIndex(sh => sh.element === house.element);
                if (smokeIndex > -1) {
                    this.smokingHouses.splice(smokeIndex, 1);
                }
                
                this.container.removeChild(house.element);
                this.houses.splice(i, 1);
            }
        }
    }
    
    addObstacle(type) {
        // Random position within game bounds
        const x = Math.random() * (this.container.offsetWidth - 40);
        const y = type === 'triangle' ? 
            Math.random() * (this.container.offsetHeight / 3) + 100 : // Triangles spawn in upper third
            Math.random() * (this.container.offsetHeight / 2); // Circles can spawn in upper half
        
        const obstacle = document.createElement('div');
        obstacle.className = `obstacle ${type}`;
        obstacle.style.left = x + 'px';
        obstacle.style.top = y + 'px';
        this.obstacleContainer.appendChild(obstacle);
        
        const obstacleObj = {
            element: obstacle,
            type: type,
            x: x,
            y: y,
            speed: type === 'circle' ? 2 : 3,
            createdAt: Date.now()
        };
        
        this.obstacles.push(obstacleObj);
        
        // Remove obstacle after duration
        setTimeout(() => {
            obstacle.remove();
            const index = this.obstacles.indexOf(obstacleObj);
            if (index > -1) {
                this.obstacles.splice(index, 1);
            }
        }, 4000);
    }
    
    updateObstacles() {
        const currentTime = Date.now();
        
        // Add new obstacle every 3 seconds
        if (currentTime - this.lastObstacleTime > this.obstacleInterval) {
            // Gradually increase triangle chance based on score
            const scoreMultiplier = Math.min(2, 1 + Math.floor(this.score / 100) * 0.2);
            const currentTriangleChance = this.triangleChance * scoreMultiplier;
            
            const type = Math.random() < currentTriangleChance ? 'triangle' : 'circle';
            this.addObstacle(type);
            this.lastObstacleTime = currentTime;
        }
        
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'circle') {
                // Circle moves horizontally back and forth
                obstacle.x += obstacle.speed;
                if (obstacle.x > this.container.offsetWidth - 40 || obstacle.x < 0) {
                    obstacle.speed = -obstacle.speed;
                }
                obstacle.element.style.left = obstacle.x + 'px';
            } else if (obstacle.type === 'triangle') {
                // Triangle moves in a more predictable diagonal pattern
                obstacle.x += obstacle.speed;
                // Smoother vertical movement
                obstacle.y += Math.sin((currentTime - obstacle.createdAt) / 500) * 2;
                
                if (obstacle.x > this.container.offsetWidth - 40) {
                    obstacle.x = -40; // Reset to left side
                }
                obstacle.element.style.left = obstacle.x + 'px';
                obstacle.element.style.top = obstacle.y + 'px';
            }
        });
    }
    
    checkSmokeCollisions() {
        if (this.isInvulnerable) return;

        const santaRect = this.santa.getBoundingClientRect();
        
        this.houses.forEach(house => {
            if (!house.hasGift && house.isSmokingUntil > Date.now()) {
                // House is grey and not currently smoking
                const smoke = house.element.querySelector('.smoke.active');
                if (smoke) {
                    const smokeRect = smoke.getBoundingClientRect();
                    // Adjust smoke hitbox to be more forgiving
                    const adjustedSmokeRect = {
                        left: smokeRect.left + smokeRect.width * 0.2,
                        right: smokeRect.right - smokeRect.width * 0.2,
                        top: smokeRect.top,
                        bottom: smokeRect.bottom,
                        width: smokeRect.width * 0.6,
                        height: smokeRect.height
                    };
                    
                    if (this.isColliding(santaRect, adjustedSmokeRect)) {
                        // Make santa temporarily invulnerable
                        this.isInvulnerable = true;
                        setTimeout(() => {
                            this.isInvulnerable = false;
                        }, this.invulnerableTime);

                        // Reduce life by 1
                        this.lives--;
                        this.updateLives();

                        // Visual feedback
                        this.santa.style.opacity = '0.5';
                        setTimeout(() => {
                            this.santa.style.opacity = '1';
                        }, this.invulnerableTime);

                        // Game over if no lives left
                        if (this.lives <= 0) {
                            this.gameOver();
                        }
                    }
                }
            }
        });
    }
    
    makeHouseColorful(house) {
        const randomColor = this.houseColors[Math.floor(Math.random() * this.houseColors.length)];
        
        // Immediate color transition
        house.style.transition = 'background-color 0.1s';
        house.style.backgroundColor = randomColor.body;
        
        const roof = house.querySelector('.roof');
        roof.style.transition = 'border-bottom-color 0.1s';
        roof.style.borderBottomColor = randomColor.roof;
        
        // Reset transitions after change
        setTimeout(() => {
            house.style.transition = '';
            roof.style.transition = '';
        }, 100);
        
        // Stop smoke immediately
        const smoke = house.querySelector('.smoke');
        if (smoke) {
            smoke.classList.remove('active');
        }
    }
    
    spawnHouse() {
        const houseSize = this.houseSizes[Math.floor(Math.random() * this.houseSizes.length)];
        const house = this.createHouse();
        
        // Set initial grey colors
        house.style.backgroundColor = '#808080';
        const roof = house.querySelector('.roof');
        roof.style.borderBottomColor = '#4A4A4A';
        
        // Set size
        house.style.width = houseSize.width + 'px';
        house.style.height = houseSize.height + 'px';
        roof.style.borderLeftWidth = (houseSize.width / 2) + 'px';
        roof.style.borderRightWidth = (houseSize.width / 2) + 'px';
        roof.style.borderBottomWidth = (houseSize.height / 3) + 'px';
        
        house.style.left = this.container.clientWidth + 'px';
        this.container.appendChild(house);
        
        this.houses.push({
            element: house,
            x: this.container.clientWidth,
            width: houseSize.width,
            hasGift: false,
            isSmokingUntil: 0 // Timestamp when smoke should stop
        });
    }
    
    createSnowflake() {
        if (this.snowflakes.length >= this.maxSnowflakes) return;
        
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        
        // Random size between 3 and 8 pixels
        const size = Math.random() * 5 + 3;
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;
        
        // Random horizontal position
        snowflake.style.left = `${Math.random() * 450}px`;
        
        // Random fall duration between 3 and 6 seconds
        const duration = Math.random() * 3000 + 3000;
        snowflake.style.animationDuration = `${duration}ms`;
        
        this.container.appendChild(snowflake);
        this.snowflakes.push(snowflake);
        
        // Remove snowflake after animation
        setTimeout(() => {
            if (snowflake.parentNode) {
                snowflake.remove();
                const index = this.snowflakes.indexOf(snowflake);
                if (index > -1) {
                    this.snowflakes.splice(index, 1);
                }
            }
        }, duration);
    }
    
    updateSnow(currentTime) {
        // Create snowflakes
        if (currentTime - this.lastSnowTime > this.snowInterval) {
            this.createSnowflake();
            this.lastSnowTime = currentTime;
        }
    }
    
    checkGiftCollisions() {
        for (let i = this.gifts.length - 1; i >= 0; i--) {
            const gift = this.gifts[i];
            const giftRect = gift.element.getBoundingClientRect();
            
            // Check if gift hits any house (to remove the gift)
            for (let house of this.houses) {
                const houseRect = house.element.getBoundingClientRect();
                if (this.isColliding(giftRect, houseRect)) {
                    // Remove the gift when it hits any house
                    gift.element.remove();
                    this.gifts.splice(i, 1);
                    
                    // Find the next uncolored house in the sequence
                    let foundCurrentHouse = false;
                    for (let nextHouse of this.houses) {
                        // Start looking for next house after we find the current one
                        if (!foundCurrentHouse) {
                            if (nextHouse === house) {
                                foundCurrentHouse = true;
                            }
                            continue;
                        }
                        
                        // Once we've found the current house, color the next uncolored one
                        if (!nextHouse.hasGift) {
                            nextHouse.hasGift = true;
                            this.makeHouseColorful(nextHouse.element);
                            
                            // Update score
                            this.score += this.giftDeliveryPoints;
                            this.scoreElement.textContent = `Score: ${this.score}`;
                            break;
                        }
                    }
                    break;
                }
            }
        }
    }
    
    updateSmoke(currentTime) {
        // Only check periodically to start new smoke
        if (currentTime - this.lastSmokeCheck > this.smokeCheckInterval) {
            this.lastSmokeCheck = currentTime;
            
            // Check each house
            this.houses.forEach(house => {
                if (!house.hasGift && currentTime > house.isSmokingUntil) {
                    // House is grey and not currently smoking
                    if (Math.random() < this.smokeChance) {
                        // Start smoking with random delay
                        const smoke = house.element.querySelector('.smoke');
                        smoke.style.animationDelay = Math.random() * -2 + 's'; // Random delay between 0-2s
                        smoke.classList.add('active');
                        
                        // Set random duration
                        const duration = Math.random() * 
                            (this.smokeDuration.max - this.smokeDuration.min) + 
                            this.smokeDuration.min;
                        house.isSmokingUntil = currentTime + duration;
                    }
                } else if (currentTime > house.isSmokingUntil && !house.hasGift) {
                    // Stop smoking if duration is over
                    const smoke = house.element.querySelector('.smoke');
                    smoke.classList.remove('active');
                    smoke.style.animationDelay = '0s'; // Reset delay
                }
            });
        }
    }
    
    gameLoop(currentTime) {
        if (this.isGameOver) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update score continuously
        this.updateScore(currentTime);
        
        // Update snow
        this.updateSnow(currentTime);
        
        // Update smoke
        this.updateSmoke(currentTime);
        
        this.updateSantaPosition(deltaTime);
        this.updateGifts(deltaTime);
        this.updateHouses(deltaTime);
        this.checkCollisions();
        this.checkGiftCollisions();
        this.updateObstacles();
        this.checkObstacleCollisions();
        this.checkSmokeCollisions();

        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent page scrolling
                this.isSpacePressed = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.isSpacePressed = false;
            }
        });

        // Touch controls for mobile
        this.container.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            this.isSpacePressed = true;
        }, { passive: false });

        this.container.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isSpacePressed = false;
        }, { passive: false });

        // Prevent default touch behavior to avoid scrolling
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        // Prevent zooming on double tap
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        });
    }
    
    updateSantaPosition(deltaTime) {
        if (this.isSpacePressed) {
            this.velocity += this.lift;
        }
        
        this.velocity += this.gravity;
        this.velocity *= this.damping;
        
        this.velocity = Math.max(Math.min(this.velocity, this.maxVelocity), -this.maxVelocity);
        
        this.santaY += this.velocity;
        
        const minY = 25;
        const maxY = this.container.clientHeight - 80;
        
        if (this.santaY < minY) {
            this.santaY = minY;
            this.velocity = 0;
        }
        if (this.santaY > maxY) {
            this.santaY = maxY;
            this.velocity = 0;
        }
        
        const rotation = this.velocity * 4;
        this.santa.style.transform = `translateX(0) translateY(${this.santaY}px) rotate(${rotation}deg)`;
    }
    
    createFallingStar(x, y) {
        const star = document.createElement('div');
        star.className = 'falling-star';
        star.style.left = x + 'px';
        star.style.top = y + 'px';
        document.getElementById('game-container').appendChild(star);
        
        // Remove the star element after animation completes
        setTimeout(() => {
            star.remove();
        }, 1500);
    }
    
    checkObstacleCollisions() {
        if (this.isInvulnerable) return;

        const santaRect = this.santa.getBoundingClientRect();
        
        this.obstacles.forEach(obstacle => {
            const obstacleRect = obstacle.element.getBoundingClientRect();
            
            if (this.isColliding(santaRect, obstacleRect)) {
                // Make santa temporarily invulnerable
                this.isInvulnerable = true;
                setTimeout(() => {
                    this.isInvulnerable = false;
                }, this.invulnerableTime);

                // Reduce life
                this.lives--;
                this.updateLives();

                if (this.lives <= 0) {
                    this.gameOver();
                    return;
                }

                // Visual feedback
                if (obstacle.type === 'circle') {
                    this.santaX -= 50; // Bounce back from circle
                }

                // Flash santa to show invulnerability
                this.santa.style.opacity = '0.5';
                setTimeout(() => {
                    this.santa.style.opacity = '1';
                }, this.invulnerableTime);
            }
        });
    }
    
    createMountainBackground() {
        const mountainBg = document.createElement('div');
        mountainBg.className = 'mountain-background';
        
        // Create first set of mountains
        const mountainLeft = document.createElement('div');
        mountainLeft.className = 'mountain mountain-left';
        
        const mountainMiddle = document.createElement('div');
        mountainMiddle.className = 'mountain mountain-middle';
        
        const mountainRight = document.createElement('div');
        mountainRight.className = 'mountain mountain-right';
        
        // Create extra mountains for first set
        const mountainExtra1 = document.createElement('div');
        mountainExtra1.className = 'mountain mountain-extra1';
        
        const mountainExtra3 = document.createElement('div');
        mountainExtra3.className = 'mountain mountain-extra3';
        
        // Create duplicate mountains for continuous scrolling
        const mountainLeft2 = document.createElement('div');
        mountainLeft2.className = 'mountain mountain-left-2';
        
        const mountainMiddle2 = document.createElement('div');
        mountainMiddle2.className = 'mountain mountain-middle-2';
        
        const mountainRight2 = document.createElement('div');
        mountainRight2.className = 'mountain mountain-right-2';
        
        // Create extra mountains for second set
        const mountainExtra2 = document.createElement('div');
        mountainExtra2.className = 'mountain mountain-extra2';
        
        const mountainExtra4 = document.createElement('div');
        mountainExtra4.className = 'mountain mountain-extra4';
        
        // Add all mountains to background
        mountainBg.appendChild(mountainLeft);
        mountainBg.appendChild(mountainMiddle);
        mountainBg.appendChild(mountainRight);
        mountainBg.appendChild(mountainExtra1);
        mountainBg.appendChild(mountainExtra3);
        mountainBg.appendChild(mountainLeft2);
        mountainBg.appendChild(mountainMiddle2);
        mountainBg.appendChild(mountainRight2);
        mountainBg.appendChild(mountainExtra2);
        mountainBg.appendChild(mountainExtra4);
        
        // Insert mountain background as first child
        this.container.insertBefore(mountainBg, this.container.firstChild);
    }
}

window.addEventListener('load', () => new Game());
