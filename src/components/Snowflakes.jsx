import { useEffect } from 'react';
import './Snowflakes.css';

function Snowflakes() {
  useEffect(() => {
    const snowflakes = ['❄', '❅', '❆'];
    const container = document.body;
    
    const createSnowflake = () => {
      const snowflake = document.createElement('div');
      snowflake.className = 'snowflake';
      snowflake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
      snowflake.style.left = Math.random() * 100 + '%';
      snowflake.style.animationDuration = Math.random() * 3 + 2 + 's';
      snowflake.style.opacity = Math.random();
      snowflake.style.fontSize = Math.random() * 10 + 10 + 'px';
      
      container.appendChild(snowflake);
      
      setTimeout(() => {
        snowflake.remove();
      }, 5000);
    };

    const interval = setInterval(createSnowflake, 300);
    
    return () => clearInterval(interval);
  }, []);

  return null;
}

export default Snowflakes;

