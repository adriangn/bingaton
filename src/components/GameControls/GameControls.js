import React, { useState, useEffect } from 'react';
import { Card, Button, InputNumber, Space, Typography, notification, Input, Tooltip } from 'antd';
import { PrinterOutlined, InfoCircleOutlined, RedoOutlined } from '@ant-design/icons';
import './GameControls.css';

const { Title, Text } = Typography;

// Función para generar una serie aleatoria
const generateRandomSeriesString = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
  const randomNumber = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${randomLetter}-${randomNumber}`;
};

const GameControls = ({ 
  onGeneratePrintableCards,
  currentSeed
}) => {
  const [numCards, setNumCards] = useState(12);
  // Inicializar con una serie aleatoria
  const [seed, setSeed] = useState(generateRandomSeriesString());
  
  const handleGenerateCards = () => {
    if (numCards < 12 || numCards > 60 || numCards % 12 !== 0) {
      notification.warning({
        message: 'Número de cartones inválido',
        description: 'Por favor, seleccione 12, 24, 36, 48 o 60 cartones (múltiplos de 12).',
      });
      return;
    }

    // Validar el formato de la semilla como serie
    if (!seed) {
      notification.warning({
        message: 'Serie no especificada',
        description: 'Debe ingresar una serie para generar los cartones',
      });
      return;
    }
    
    onGeneratePrintableCards(numCards, seed);
  };

  const generateRandomSeed = () => {
    setSeed(generateRandomSeriesString());
  };

  // Función para ajustar el número de cartones al múltiplo de 12 más cercano
  const handleNumCardsChange = (value) => {
    if (!value) {
      setNumCards(12);
      return;
    }
    
    // Ajustar al múltiplo de 12 más cercano
    const multiple = Math.round(value / 12) * 12;
    
    // Limitar entre 12 y 60
    const adjusted = Math.min(Math.max(multiple, 12), 60);
    setNumCards(adjusted);
  };

  return (
    <Card className="game-controls">
      <Title level={3}>Generador de Cartones de Bingo</Title>
      
      <div className="controls-section">
        <Title level={4}>Generar Cartones Para Imprimir</Title>
        
        <div style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Número de cartones (múltiplos de 12):</Text>
            <InputNumber 
              min={12} 
              max={60} 
              step={12}
              value={numCards}
              onChange={handleNumCardsChange}
              style={{ width: 200 }}
            />
            
            <Text>
              Serie:
              <Tooltip title="Esta serie se usará como semilla para generar los cartones, y aparecerá impresa en los mismos. Si usa la misma serie, se generarán los mismos cartones.">
                <InfoCircleOutlined style={{ marginLeft: 8 }} />
              </Tooltip>
            </Text>
            
            <Space>
              <Input
                placeholder="Ej: A-1000000" 
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                style={{ width: 200 }}
              />
              <Button 
                icon={<RedoOutlined />} 
                onClick={generateRandomSeed}
                type="default"
              >
                Generar Serie
              </Button>
            </Space>
            
            {currentSeed && (
              <div className="current-seed">
                <Text type="secondary">Última serie usada: {currentSeed}</Text>
              </div>
            )}
          </Space>
        </div>
        
        <Button 
          type="primary" 
          onClick={handleGenerateCards}
          icon={<PrinterOutlined />}
          size="large"
          style={{ marginTop: 16 }}
        >
          Generar Cartones para Imprimir
        </Button>

        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            Puedes generar cartones reglamentarios para imprimir en formato A4 (12 por página).
            La serie aparecerá impresa en los cartones y permite regenerarlos exactamente iguales.
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default GameControls; 