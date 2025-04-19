import React, { useState } from 'react';
import { Card, Button, InputNumber, Space, Typography, Divider, notification, Radio } from 'antd';
import { PrinterOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import './GameControls.css';

const { Title, Text } = Typography;

const GameControls = ({ 
  onStartGame, 
  onDrawNumber, 
  onGenerateCards,
  onGeneratePrintableCards,
  gameStarted, 
  gameEnded, 
  onResetGame,
  cardCount
}) => {
  const [numCards, setNumCards] = useState(1);
  const [cardType, setCardType] = useState('game'); // 'game' o 'print'
  
  const handleGenerateCards = () => {
    if (numCards < 1 || numCards > 10) {
      notification.warning({
        message: 'Número de cartones inválido',
        description: 'Por favor, seleccione entre 1 y 10 cartones.',
      });
      return;
    }
    
    if (cardType === 'game') {
      onGenerateCards(numCards);
    } else {
      onGeneratePrintableCards(numCards);
    }
  };

  return (
    <Card className="game-controls">
      <Title level={3}>Controles del Juego</Title>
      
      <div className="controls-section">
        <Title level={4}>Generar Cartones</Title>
        
        <div style={{ marginBottom: 16 }}>
          <Text strong>Tipo de cartón:</Text>
          <Radio.Group 
            value={cardType} 
            onChange={e => setCardType(e.target.value)}
            style={{ marginLeft: 16 }}
          >
            <Radio value="game">Para jugar (5x5)</Radio>
            <Radio value="print">Para imprimir (3x9, reglamentario)</Radio>
          </Radio.Group>
        </div>
        
        <Space>
          <Text>Número de cartones:</Text>
          <InputNumber 
            min={1} 
            max={cardType === 'print' ? 60 : 10} 
            defaultValue={1} 
            onChange={setNumCards}
            disabled={gameStarted}
          />
          <Button 
            type="primary" 
            onClick={handleGenerateCards}
            disabled={gameStarted}
            icon={cardType === 'print' ? <PrinterOutlined /> : null}
          >
            {cardType === 'print' ? 'Generar Cartones para Imprimir' : 'Generar Cartones para Jugar'}
          </Button>
        </Space>

        <Text type="secondary">
          {cardType === 'print' 
            ? 'Puedes generar hasta 60 cartones reglamentarios para imprimir en formato A4 (6 por página).' 
            : 'Puedes generar hasta 10 cartones para jugar.'}
        </Text>
      </div>

      {cardType === 'game' && (
        <>
          <Divider />

          <div className="controls-section">
            <Title level={4}>Control de la Partida</Title>
            <Space>
              <Button 
                type="primary" 
                onClick={onStartGame} 
                disabled={gameStarted || cardCount === 0}
                icon={<PlayCircleOutlined />}
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
                icon={<ReloadOutlined />}
              >
                Reiniciar Juego
              </Button>
            </Space>
          </div>
        </>
      )}
    </Card>
  );
};

export default GameControls; 