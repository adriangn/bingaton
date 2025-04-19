import React, { useState } from 'react';
import { Card, Button, InputNumber, Space, Typography, Divider, notification } from 'antd';
import './GameControls.css';

const { Title, Text } = Typography;

const GameControls = ({ 
  onStartGame, 
  onDrawNumber, 
  onGenerateCards, 
  gameStarted, 
  gameEnded, 
  onResetGame,
  cardCount
}) => {
  const [numCards, setNumCards] = useState(1);
  
  const handleGenerateCards = () => {
    if (numCards < 1 || numCards > 10) {
      notification.warning({
        message: 'Número de cartones inválido',
        description: 'Por favor, seleccione entre 1 y 10 cartones.',
      });
      return;
    }
    
    onGenerateCards(numCards);
  };

  return (
    <Card className="game-controls">
      <Title level={3}>Controles del Juego</Title>
      
      <div className="controls-section">
        <Title level={4}>Generar Cartones</Title>
        <Space>
          <Text>Número de cartones:</Text>
          <InputNumber 
            min={1} 
            max={10} 
            defaultValue={1} 
            onChange={setNumCards}
            disabled={gameStarted}
          />
          <Button 
            type="primary" 
            onClick={handleGenerateCards}
            disabled={gameStarted}
          >
            Generar Cartones
          </Button>
        </Space>

        <Text type="secondary">
          Puedes generar hasta 10 cartones para jugar.
        </Text>
      </div>

      <Divider />

      <div className="controls-section">
        <Title level={4}>Control de la Partida</Title>
        <Space>
          <Button 
            type="primary" 
            onClick={onStartGame} 
            disabled={gameStarted || cardCount === 0}
          >
            Iniciar Juego
          </Button>
          
          <Button 
            type="default" 
            onClick={onDrawNumber} 
            disabled={!gameStarted || gameEnded}
          >
            Extraer Bola
          </Button>
          
          <Button 
            danger 
            onClick={onResetGame}
          >
            Reiniciar Juego
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default GameControls; 