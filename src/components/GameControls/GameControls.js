import React, { useState } from 'react';
import { Card, Button, InputNumber, Space, Typography, notification } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import './GameControls.css';

const { Title, Text } = Typography;

const GameControls = ({ 
  onGeneratePrintableCards
}) => {
  const [numCards, setNumCards] = useState(1);
  
  const handleGenerateCards = () => {
    if (numCards < 1 || numCards > 60) {
      notification.warning({
        message: 'Número de cartones inválido',
        description: 'Por favor, seleccione entre 1 y 60 cartones.',
      });
      return;
    }
    
    onGeneratePrintableCards(numCards);
  };

  return (
    <Card className="game-controls">
      <Title level={3}>Generador de Cartones de Bingo</Title>
      
      <div className="controls-section">
        <Title level={4}>Generar Cartones Para Imprimir</Title>
        
        <Space>
          <Text>Número de cartones:</Text>
          <InputNumber 
            min={1} 
            max={60} 
            defaultValue={1} 
            onChange={setNumCards}
          />
          <Button 
            type="primary" 
            onClick={handleGenerateCards}
            icon={<PrinterOutlined />}
          >
            Generar Cartones para Imprimir
          </Button>
        </Space>

        <Text type="secondary">
          Puedes generar hasta 60 cartones reglamentarios para imprimir en formato A4 (6 por página).
        </Text>
      </div>
    </Card>
  );
};

export default GameControls; 