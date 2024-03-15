const config = {
    "FRICTION": 0.995,
}
// Классы для логики бильярда

// Интерфейсы для позиции
interface Position {
    x: number;
    y: number;
}

// Интерфейсы для шара
interface Ball {
    color: string;
    radius: number;
}

// Класс для логики шара
class BallLogic {
    id: string;
    position: Position;
    ball: Ball;
    speed: number;
    friction: number;
    vx: number;
    vy: number;

    constructor(
        id: string,
        x: number,
        y: number,
        color: string,
        radius: number
    ) {
        this.id = id
        this.position = { x: x, y: y }
        this.ball = { color: color, radius: radius }
        this.speed = 0
        this.vx = 0
        this.vy = 0
        this.friction = config.FRICTION
    }

    // Метод для движения шара
    move(tableWidth: number, tableHeight: number, balls: BallLogic[]) {
        const newX = this.position.x + this.vx * this.speed;
        const newY = this.position.y + this.vy * this.speed;

        if (newX - this.ball.radius < 0 || newX + this.ball.radius > tableWidth) {
            this.position.x = Math.max(this.ball.radius, Math.min(newX, tableWidth - this.ball.radius));
            this.vx *= -1;
        } else {
            this.position.x = newX;
        }

        if (newY - this.ball.radius < 0 || newY + this.ball.radius > tableHeight) {
            this.position.y = Math.max(this.ball.radius, Math.min(newY, tableHeight - this.ball.radius));
            this.vy *= -1;
        } else {
            this.position.y = newY;
        }

        for (const otherBall of balls) {
            if (otherBall === this) continue; // Пропустить этот шар
            const dx = otherBall.position.x - this.position.x;
            const dy = otherBall.position.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Если шары пересекаются
            if (distance < this.ball.radius + otherBall.ball.radius) {
                const overlap = (this.ball.radius + otherBall.ball.radius) - distance;
                const ax = overlap * dx / distance;
                const ay = overlap * dy / distance;

                this.position.x -= ax;
                this.position.y -= ay;
                otherBall.position.x += ax;
                otherBall.position.y += ay;

                const nx = dx / distance;
                const ny = dy / distance;
                const p = 2 * (this.vx * nx + this.vy * ny - otherBall.vx * nx - otherBall.vy * ny) / (this.ball.radius + otherBall.ball.radius);

                this.vx = this.vx - p * this.ball.radius * nx;
                this.vy = this.vy - p * this.ball.radius * ny;
                otherBall.vx = otherBall.vx + p * otherBall.ball.radius * nx;
                otherBall.vy = otherBall.vy + p * otherBall.ball.radius * ny;

                const totalRadius = this.ball.radius + otherBall.ball.radius;
                const thisPortion = this.ball.radius / totalRadius;
                const otherPortion = otherBall.ball.radius / totalRadius;
                const thisSpeedChange = this.speed * thisPortion;
                const otherSpeedChange = this.speed * otherPortion;

                otherBall.speed += otherSpeedChange;
                this.speed -= thisSpeedChange;

                break;
            }
        }
        this.speed *= this.friction;
    }

    // Метод для изменения цвета шара
    changeColor(color: string) {
        this.ball.color = color
    }
}

// Класс для логики стола
class TableLogic {
    width: number
    heigth: number
    BallsOnTable: BallLogic[]

    constructor(width: number, heigth: number) {
        this.width = width
        this.heigth = heigth
        this.BallsOnTable = []
    }

    // Метод для добавления шара на стол
    addBall(bL: BallLogic) {
        let foundPosition = false;
        let x = Math.random() * (this.width - 2 * bL.ball.radius) + bL.ball.radius;
        let y = Math.random() * (this.heigth - 2 * bL.ball.radius) + bL.ball.radius;
        
        while (!foundPosition && y < this.heigth - bL.ball.radius) {
            while (!foundPosition && x < this.width - bL.ball.radius) {
                bL.position.x = x;
                bL.position.y = y;
                if (!this.BallsOnTable.some(ball => this.checkIntersectionBetweenBalls(ball, bL)) &&
                    !this.checkIntersectionWithTable(bL)) {
                    this.BallsOnTable.push(bL);
                    foundPosition = true;
                }
                x += 2 * bL.ball.radius;
            }
            x = Math.random() * (this.width - 2 * bL.ball.radius) + bL.ball.radius;
            y += 2 * bL.ball.radius;
        }
    }
    
    // Метод для проверки пересечения шаров
    checkIntersectionBetweenBalls(bl1: BallLogic, bl2: BallLogic) {
        let distance = Math.sqrt(
            Math.pow(bl1.position.x - bl2.position.x, 2) +
            Math.pow(bl1.position.y - bl2.position.y, 2)
        )
        return distance < bl1.ball.radius + bl2.ball.radius
    }

    // Метод для проверки пересечения шара со столом
    checkIntersectionWithTable(bL: BallLogic) {
        return bL.position.x - bL.ball.radius < 0 ||
            bL.position.x + bL.ball.radius > this.width ||
            bL.position.y - bL.ball.radius < 0 ||
            bL.position.y + bL.ball.radius > this.heigth
    }

    // Метод для изменения цвета шара
    changeBall(id: string, color: string) {
        const index = this.BallsOnTable.findIndex(b => b.id === id)
        if (index !== -1) {
            this.BallsOnTable[index].changeColor(color)
        }
    }

    // Метод для изменения позиции шара (при перетаскивании)
    changeBallPosition(id: string, x: number, y: number) {
        const index = this.BallsOnTable.findIndex(b => b.id === id)
        if (index !== -1) {
            const dx = x - this.BallsOnTable[index].position.x;
            const dy = y - this.BallsOnTable[index].position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0) {
                this.BallsOnTable[index].speed = distance;
                this.BallsOnTable[index].vx = dx / distance;
                this.BallsOnTable[index].vy = dy / distance;
            }
            this.BallsOnTable[index].position.x = x;
            this.BallsOnTable[index].position.y = y;
        }
    }
}

export { BallLogic, TableLogic }