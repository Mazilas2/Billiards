'use client'

import { useEffect, useState } from "react";
import { TableLogic, BallLogic } from "@/services/BilliardLogic";

const config = {
  "WIDTH": 1200,
  "HEIGHT": 600,
  "MIN_RADIUS_BALLS": 10,
  "MAX_RADIUS_BALLS": 30,
  "FPS": 165
}

const staticBalls = [
  new BallLogic('0', 100, 100, 'red', Math.random() * (config.MAX_RADIUS_BALLS - config.MIN_RADIUS_BALLS) + config.MIN_RADIUS_BALLS),
  new BallLogic('1', 200, 200, 'blue', Math.random() * (config.MAX_RADIUS_BALLS - config.MIN_RADIUS_BALLS) + config.MIN_RADIUS_BALLS),
];

export default function Home() {
  const tableWidth = config.WIDTH;
  const tableHeight = config.HEIGHT;
  const [id, setId] = useState<number>(2);
  const [table, setTable] = useState<TableLogic>(new TableLogic(tableWidth, tableHeight));
  const [color, setColor] = useState<string>('black');
  const [changeColor, setChangeColor] = useState<string>('');
  const [radius, setRadius] = useState<number>((config.MAX_RADIUS_BALLS + config.MIN_RADIUS_BALLS) / 2);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedBall, setSelectedBall] = useState<BallLogic | null>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedBall, setDraggedBall] = useState<BallLogic | null>(null);
  const [prevPosition, setPrevPosition] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    staticBalls.forEach(ball => table.addBall(ball));
    drawBalls();
  }, []);

  const findBallAtPosition = (x: number, y: number) => table.BallsOnTable.find(ball => {
    const distance = Math.sqrt(Math.pow(ball.position.x - x, 2) + Math.pow(ball.position.y - y, 2));
    return distance < ball.ball.radius;
  });

  const getRelativeMousePosition = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = document.getElementById('billiard-table') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleBallChange = (ball: BallLogic) => {
    table.changeBall(ball.id, changeColor);
    drawBalls();
  };

  const handleAddBall = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ball = new BallLogic(
      id.toString(),
      Math.random() * tableWidth,
      Math.random() * tableHeight,
      color,
      radius
    );
    table.addBall(ball);
    setId(id => id + 1);
    setRadius(Math.random() * (config.MAX_RADIUS_BALLS - config.MIN_RADIUS_BALLS) + config.MIN_RADIUS_BALLS);
    drawBalls();
  };

  const canvasMouseDownHandler = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const { x, y } = getRelativeMousePosition(e);
    const ball = findBallAtPosition(x, y);
    if (ball) {
      setSelectedBall(ball);
      setIsDragging(true);
      setDraggedBall(ball);
      setPrevPosition({ x, y });
      if (ball === draggedBall) ball.speed = 0;
    }
  };

  const canvasMouseMoveHandler = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (isDragging && draggedBall && prevPosition) {
      const { x, y } = getRelativeMousePosition(e);
      const dx = x - prevPosition.x;
      const dy = y - prevPosition.y;
      if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        setSelectedBall(null);
        table.changeBallPosition(draggedBall.id, x, y);
        drawBalls();
      }
    }
  };

  const canvasMouseUpHandler = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (selectedBall) setIsModalOpen(true);
    else if (isDragging && draggedBall) {
      const { x, y } = getRelativeMousePosition(e);
      table.changeBallPosition(draggedBall.id, x, y);
      drawBalls();
    }
    setIsDragging(false);
    setDraggedBall(null);
    setPrevPosition(null);
    drawBalls();
  };

  const drawBalls = () => {
    const canvas = document.getElementById('billiard-table') as HTMLCanvasElement;
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      table.BallsOnTable.forEach(ball => {
        context.beginPath();
        context.arc(ball.position.x, ball.position.y, ball.ball.radius, 0, Math.PI * 2, false);
        context.fillStyle = ball.ball.color;
        context.fill();
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      table.BallsOnTable.forEach(ball => ball.move(tableWidth, tableHeight, table.BallsOnTable));
      drawBalls();
    }, 1000 / config.FPS);
    return () => clearInterval(interval);
  }, [table, drawBalls]);

  return (
    <main className="flex min-h-screen flex-col items-center p-24 gap-32">
      <form className="flex justify-between w-[50%]" onSubmit={handleAddBall}>
        <label htmlFor="color">Ball color</label>
        <input type="text" placeholder="Ball color" defaultValue={color} onChange={e => setColor(e.target.value)} />
        <label htmlFor="radius">Ball radius</label>
        <input type="number" placeholder="Ball radius" defaultValue={radius} disabled />
        <button type="submit" className="bg-green-500 p-2 rounded-md">Add ball</button>
      </form>
      <canvas
        className="border-2 border-black bg-green-700"
        width={tableWidth}
        height={tableHeight}
        id="billiard-table"
        onMouseDown={canvasMouseDownHandler}
        onMouseMove={canvasMouseMoveHandler}
        onMouseUp={canvasMouseUpHandler}
      />
      {isModalOpen && selectedBall && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
          <form className="bg-white p-8 rounded-md">
            <h2>Ball details</h2>
            <input type="text" placeholder="Ball color" defaultValue={changeColor} onChange={e => setChangeColor(e.target.value)} />
            <button className="bg-red-500 p-2 rounded-md" onClick={() => {
              setIsModalOpen(false);
              handleBallChange(selectedBall);
              setSelectedBall(null);
            }}>Close</button>
          </form>
        </div>
      )}
    </main>
  );
}
