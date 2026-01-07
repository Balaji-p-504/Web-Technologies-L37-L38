document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('myCanvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  // Clear canvas
  ctx.clearRect(0,0, canvas.width, canvas.height);

  // Filled rectangle (x, y, width, height) - red
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(30, 50, 150, 100);

  // Filled circle (centerX, centerY, radius) - blue
  ctx.beginPath();
  ctx.arc(350, 120, 50, 0, Math.PI * 2);
  ctx.fillStyle = '#0000ff';
  ctx.fill();
  ctx.closePath();

  // Straight line - green
  ctx.beginPath();
  ctx.moveTo(20, 260);
  ctx.lineTo(480, 260);
  ctx.strokeStyle = '#008000';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.closePath();

  // Text inside canvas - purple and bold
  ctx.fillStyle = '#800080';
  ctx.font = 'bold 24px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HTML5 Canvas', canvas.width / 2, 40);
});
