import React, { useState } from 'react';
import { Card, Button, Typography, Divider, Space, InputNumber, Statistic, Row, Col, Switch, Slider, Form, Tabs, Input, Collapse, Table, Badge, Alert } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, StopOutlined, SettingOutlined, TrophyOutlined, TagOutlined } from '@ant-design/icons';
import { useBingo } from '../../context/BingoContext';
import BingoCardChecker from '../BingoCardChecker';
import './BingoGame.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

// Componente para la configuración
const BingoSettings = ({ voiceConfig, updateVoiceConfig, disabled, intervalTime, changeIntervalTime, isRunning }) => {
  // Función para probar la configuración de voz con un número aleatorio
  const testVoiceSettings = () => {
    if (!window.speechSynthesis) return;
    
    // Detener cualquier lectura en curso
    window.speechSynthesis.cancel();
    
    // Generar un número aleatorio entre 1 y 90
    const randomNumber = Math.floor(Math.random() * 90) + 1;
    
    // Primer utterance: número completo
    const utteranceNumber = new SpeechSynthesisUtterance();
    utteranceNumber.text = `${randomNumber}`;
    utteranceNumber.lang = 'es-ES';
    utteranceNumber.rate = voiceConfig.rate;
    utteranceNumber.volume = voiceConfig.volume;
    
    // Reproducir el número completo
    window.speechSynthesis.speak(utteranceNumber);
    
    // Si están habilitados los dígitos individuales y es un número de más de un dígito
    if (voiceConfig.announceDigits && randomNumber >= 10) {
      // Crear un timeout para reproducir los dígitos después de 1.2 segundos
      setTimeout(() => {
        const digitsText = randomNumber.toString().split('').join(', ');
        
        const utteranceDigits = new SpeechSynthesisUtterance();
        utteranceDigits.text = digitsText;
        utteranceDigits.lang = 'es-ES';
        utteranceDigits.rate = voiceConfig.rate;
        utteranceDigits.volume = voiceConfig.volume;
        
        window.speechSynthesis.speak(utteranceDigits);
      }, 1200); // Pausa de 1.2 segundos entre número y dígitos
    }
  };
  
  return (
    <Form layout="vertical" className="settings-form">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Title level={5}>Configuración general</Title>
          
          <Form.Item
            label={<>Intervalo entre números: <Text type="secondary">{intervalTime} segundos</Text></>}
            className="settings-form-item"
          >
            <Slider 
              min={1}
              max={20}
              step={1}
              value={intervalTime}
              onChange={changeIntervalTime}
              disabled={isRunning}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Title level={5}>Configuración de voz</Title>
          
          <Form.Item
            label="Activar sonido"
            className="settings-form-item"
          >
            <Switch 
              checked={voiceConfig.enabled} 
              onChange={(value) => updateVoiceConfig({ enabled: value })}
              disabled={disabled}
            />
          </Form.Item>
          
          <Form.Item
            label="Anunciar dígitos individuales"
            className="settings-form-item"
          >
            <Switch 
              checked={voiceConfig.announceDigits} 
              onChange={(value) => updateVoiceConfig({ announceDigits: value })}
              disabled={disabled || !voiceConfig.enabled}
            />
          </Form.Item>
          
          <Form.Item
            label={<>Velocidad de la voz: <Text type="secondary">{voiceConfig.rate}x</Text></>}
            className="settings-form-item"
          >
            <Slider 
              min={0.5}
              max={1.5}
              step={0.1}
              value={voiceConfig.rate}
              onChange={(value) => updateVoiceConfig({ rate: value })}
              disabled={disabled || !voiceConfig.enabled}
            />
          </Form.Item>
          
          <Form.Item
            label={<>Volumen: <Text type="secondary">{voiceConfig.volume * 100}%</Text></>}
            className="settings-form-item"
          >
            <Slider 
              min={0.1}
              max={1}
              step={0.1}
              value={voiceConfig.volume}
              onChange={(value) => updateVoiceConfig({ volume: value })}
              disabled={disabled || !voiceConfig.enabled}
            />
          </Form.Item>
          
          <Form.Item className="settings-form-item">
            <Button 
              onClick={testVoiceSettings}
              disabled={disabled || !voiceConfig.enabled}
              icon={<PlayCircleOutlined />}
              type="default"
            >
              Probar audio
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

// Componente para la configuración de premios
const PrizeSettings = ({ prizeConfig, updatePrizeConfig, disabled }) => {
  const [formData, setFormData] = useState({
    cardPrice: prizeConfig.cardPrice || 1.00,
    linePercentage: prizeConfig.linePercentage || 25,
    bingoPercentage: prizeConfig.bingoPercentage || 75,
    totalPrizePercentage: prizeConfig.totalPrizePercentage || 100
  });
  
  // Obtener valores de soldCards directamente de prizeConfig
  // eslint-disable-next-line no-unused-vars
  const { seriesInfo, soldCards } = prizeConfig;
  
  // Calcular el bote total
  const totalPot = soldCards * formData.cardPrice;
  const adjustmentFactor = formData.totalPrizePercentage / 100;
  const linePrize = totalPot * (formData.linePercentage / 100) * adjustmentFactor;
  const bingoPrize = totalPot * (formData.bingoPercentage / 100) * adjustmentFactor;
  
  // Calcular porcentaje total actual (suma de línea y bingo)
  const currentDistributionSum = formData.linePercentage + formData.bingoPercentage;
  
  // Proporción actual entre línea y bingo
  const lineRatio = formData.linePercentage / currentDistributionSum;
  const bingoRatio = formData.bingoPercentage / currentDistributionSum;
  
  const handleInputChange = (field, value) => {
    const newData = { ...formData };
    
    // Actualizar el campo con el nuevo valor
    newData[field] = value;
    
    // Lógica especial para ajustar automáticamente los porcentajes
    if (field === 'totalPrizePercentage') {
      // Al cambiar el porcentaje total, ajustar línea y bingo proporcionalmente
      const newSum = value;
      
      // Calculamos los nuevos valores manteniendo la proporción
      let newLine = Math.round(lineRatio * newSum);
      let newBingo = Math.round(bingoRatio * newSum);
      
      // Ajustamos los valores para asegurar que suman exactamente el nuevo total
      // y respetan los mínimos
      if (newLine < 5) {
        newLine = 5;
        newBingo = newSum - 5;
      } else if (newBingo < 30) {
        newBingo = 30;
        newLine = newSum - 30;
      }
      
      // Si por algún motivo no se pueden cumplir los mínimos, ajustamos
      if (newLine < 5 || newBingo < 30) {
        // En este caso es imposible mantener los mínimos, así que asignamos
        // los valores mínimos y ajustamos el total
        newLine = 5;
        newBingo = 30;
        newData.totalPrizePercentage = 35;
      } else {
        // En caso de redondeo, ajustamos la diferencia al bingo
        const adjustedSum = newLine + newBingo;
        if (adjustedSum !== newSum) {
          newBingo = newSum - newLine;
        }
      }
      
      newData.linePercentage = newLine;
      newData.bingoPercentage = newBingo;
    } else if (field === 'linePercentage') {
      // Si cambia el porcentaje de línea, ajustar el de bingo para que sumen el total
      newData.bingoPercentage = newData.totalPrizePercentage - value;
      
      // Verificar mínimos
      if (newData.bingoPercentage < 30) {
        newData.bingoPercentage = 30;
        newData.linePercentage = newData.totalPrizePercentage - 30;
        
        // Si no se puede cumplir el mínimo de línea
        if (newData.linePercentage < 5) {
          newData.linePercentage = 5;
          newData.totalPrizePercentage = 35;
        }
      }
    } else if (field === 'bingoPercentage') {
      // Si cambia el porcentaje de bingo, ajustar el de línea para que sumen el total
      newData.linePercentage = newData.totalPrizePercentage - value;
      
      // Verificar mínimos
      if (newData.linePercentage < 5) {
        newData.linePercentage = 5;
        newData.bingoPercentage = newData.totalPrizePercentage - 5;
        
        // Si no se puede cumplir el mínimo de bingo
        if (newData.bingoPercentage < 30) {
          newData.bingoPercentage = 30;
          newData.totalPrizePercentage = 35;
        }
      }
    }
    
    setFormData(newData);
    // Mantener los valores originales de seriesInfo y soldCards de prizeConfig
    updatePrizeConfig({
      ...prizeConfig,
      cardPrice: newData.cardPrice,
      linePercentage: newData.linePercentage,
      bingoPercentage: newData.bingoPercentage,
      totalPrizePercentage: newData.totalPrizePercentage
    });
  };
  
  return (
    <Form layout="vertical" className="prize-settings-form">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item label="Precio por cartón (€)">
            <InputNumber 
              min={0}
              step={0.5}
              precision={2}
              style={{ width: '100%' }}
              value={formData.cardPrice}
              onChange={(value) => handleInputChange('cardPrice', value)}
              disabled={disabled}
            />
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              {[0.20, 0.50, 1.00, 2.00, 3.00].map(price => (
                <Button 
                  key={price}
                  size="small"
                  type={formData.cardPrice === price ? 'primary' : 'default'}
                  onClick={() => handleInputChange('cardPrice', price)}
                  disabled={disabled}
                >
                  {price.toFixed(2)}€
                </Button>
              ))}
            </div>
          </Form.Item>
          
          <Form.Item 
            label={
              <Space>
                <span>Porcentaje total a repartir (%)</span>
                <Text type="secondary">{formData.totalPrizePercentage}%</Text>
              </Space>
            }
          >
            <Slider 
              min={35}
              max={100}
              step={5}
              value={formData.totalPrizePercentage}
              onChange={(value) => handleInputChange('totalPrizePercentage', value)}
              disabled={disabled}
            />
          </Form.Item>
        </Col>
        
        <Col xs={24} md={12}>
          <Title level={5}>Distribución de premios</Title>
          
          <Statistic 
            title="Bote total recaudado"
            value={totalPot.toFixed(2)}
            suffix="€"
            valueStyle={{ color: '#52c41a' }}
          />
          
          <Divider />
          
          <Form.Item 
            label={
              <Space>
                <span>Premio para Línea (%)</span>
                <Text type="secondary">{formData.linePercentage}% → {linePrize.toFixed(2)}€</Text>
              </Space>
            }
          >
            <Slider 
              min={5}
              max={Math.max(70, formData.totalPrizePercentage - 30)} // Máximo dinámico basado en el total
              value={formData.linePercentage}
              onChange={(value) => handleInputChange('linePercentage', value)}
              disabled={disabled}
            />
          </Form.Item>
          
          <Form.Item 
            label={
              <Space>
                <span>Premio para Bingo (%)</span>
                <Text type="secondary">{formData.bingoPercentage}% → {bingoPrize.toFixed(2)}€</Text>
              </Space>
            }
          >
            <Slider 
              min={30}
              max={Math.max(95, formData.totalPrizePercentage - 5)} // Máximo dinámico basado en el total
              value={formData.bingoPercentage}
              onChange={(value) => handleInputChange('bingoPercentage', value)}
              disabled={disabled}
            />
          </Form.Item>
          
          <div className="distribution-info">
            <Text type="secondary">
              Distribución actual: {formData.linePercentage}% línea + {formData.bingoPercentage}% bingo = {currentDistributionSum}%
            </Text>
            <br />
            <Text type="secondary">
              Total repartido: {(totalPot * (formData.totalPrizePercentage / 100)).toFixed(2)}€ ({formData.totalPrizePercentage}% del bote)
            </Text>
          </div>
        </Col>
      </Row>
    </Form>
  );
};

// Componente para mostrar el resumen de ganadores
const WinnersSummary = () => {
  const { prizeConfig, linesClosed } = useBingo();
  
  // Generar la lista de ganadores sin repetidos
  const winners = (() => {
    // Crear un mapa para agrupar por número de cartón
    const winnerMap = new Map();
    
    // Procesar ganadores de línea
    if (prizeConfig.lineWinners && prizeConfig.lineWinners.length > 0) {
      prizeConfig.lineWinners.forEach(cardNumber => {
        const prize = calculateIndividualPrize('line', prizeConfig.lineWinners.length);
        
        if (winnerMap.has(cardNumber)) {
          const existing = winnerMap.get(cardNumber);
          // Actualizar si ya existe añadiendo el premio de línea
          winnerMap.set(cardNumber, {
            ...existing,
            hasLine: true,
            totalPrize: existing.totalPrize + prize,
            prizes: [...existing.prizes, { type: 'line', prize }]
          });
        } else {
          // Crear nuevo registro
          winnerMap.set(cardNumber, {
            cardNumber,
            hasLine: true,
            hasBingo: false,
            totalPrize: prize,
            prizes: [{ type: 'line', prize }]
          });
        }
      });
    }
    
    // Procesar ganadores de bingo
    if (prizeConfig.bingoWinners && prizeConfig.bingoWinners.length > 0) {
      prizeConfig.bingoWinners.forEach(cardNumber => {
        const prize = calculateIndividualPrize('bingo', prizeConfig.bingoWinners.length);
        
        if (winnerMap.has(cardNumber)) {
          const existing = winnerMap.get(cardNumber);
          // Actualizar si ya existe añadiendo el premio de bingo
          winnerMap.set(cardNumber, {
            ...existing,
            hasBingo: true,
            totalPrize: existing.totalPrize + prize,
            prizes: [...existing.prizes, { type: 'bingo', prize }]
          });
        } else {
          // Crear nuevo registro
          winnerMap.set(cardNumber, {
            cardNumber,
            hasLine: false,
            hasBingo: true,
            totalPrize: prize,
            prizes: [{ type: 'bingo', prize }]
          });
        }
      });
    }
    
    // Convertir el mapa a un array
    return Array.from(winnerMap.values());
  })();
  
  // Calcular premio individual
  function calculateIndividualPrize(type, winnersCount) {
    if (!winnersCount) return 0;
    
    const { soldCards, cardPrice, linePercentage, bingoPercentage, totalPrizePercentage } = prizeConfig;
    
    if (!soldCards || !cardPrice) return 0;
    
    const totalPot = soldCards * cardPrice;
    const adjustmentFactor = totalPrizePercentage / 100;
    
    if (type === 'line') {
      const linePrize = totalPot * (linePercentage / 100) * adjustmentFactor;
      return linePrize / winnersCount;
    } else if (type === 'bingo') {
      const bingoPrize = totalPot * (bingoPercentage / 100) * adjustmentFactor;
      return bingoPrize / winnersCount;
    }
    
    return 0;
  }
  
  // Columnas de la tabla
  const columns = [
    {
      title: 'Cartón #',
      dataIndex: 'cardNumber',
      key: 'cardNumber',
      sorter: (a, b) => a.cardNumber - b.cardNumber,
    },
    {
      title: 'Premio',
      dataIndex: 'premios',
      key: 'premios',
      render: (_, record) => (
        <Space>
          {record.hasLine && (
            <Badge 
              count="LÍNEA" 
              style={{ backgroundColor: '#1890ff', fontSize: '14px' }}
            />
          )}
          {record.hasBingo && (
            <Badge 
              count="BINGO" 
              style={{ backgroundColor: '#52c41a', fontSize: '14px' }}
            />
          )}
        </Space>
      )
    },
    {
      title: 'Importe',
      dataIndex: 'totalPrize',
      key: 'totalPrize',
      render: (text) => <Text strong style={{ color: '#faad14' }}>{text.toFixed(2)}€</Text>,
      sorter: (a, b) => a.totalPrize - b.totalPrize,
    }
  ];
  
  // Calcular totales para la cabecera
  const { soldCards, cardPrice, linePercentage, bingoPercentage, totalPrizePercentage } = prizeConfig;
  const totalPot = soldCards * cardPrice;
  const adjustmentFactor = totalPrizePercentage / 100;
  
  const totalLinePrize = totalPot * (linePercentage / 100) * adjustmentFactor;
  const totalBingoPrize = totalPot * (bingoPercentage / 100) * adjustmentFactor;
  
  return (
    <div className="winners-summary">
      <Divider orientation="left" style={{ marginTop: 0, marginBottom: 12 }}>
        <Space size="small">
          <TrophyOutlined />
          <span>Resumen de Premios</span>
        </Space>
      </Divider>
      
      <Row gutter={[8, 8]} style={{ marginBottom: '8px' }}>
        <Col span={12}>
          <Statistic
            title="Premio a línea"
            value={totalLinePrize.toFixed(2)}
            suffix="€"
            valueStyle={{ color: '#1890ff', fontSize: '18px' }}
            prefix={<TagOutlined />}
          />
          {linesClosed && (
            <Alert
              message="Líneas cerradas"
              type="warning"
              showIcon
              style={{ marginTop: '4px', padding: '4px 8px', fontSize: '12px' }}
            />
          )}
        </Col>
        <Col span={12}>
          <Statistic
            title="Premio a bingo"
            value={totalBingoPrize.toFixed(2)}
            suffix="€"
            valueStyle={{ color: '#52c41a', fontSize: '18px' }}
            prefix={<TagOutlined />}
          />
        </Col>
      </Row>
      
      <div className="winners-table-container" style={{ flex: 1, overflow: 'auto' }}>
        {winners.length > 0 ? (
          <Table 
            columns={columns} 
            dataSource={winners.map((winner, index) => ({
              ...winner,
              key: `winner-${index}`
            }))} 
            pagination={false}
            size="small"
            bordered
            scroll={{ y: 180 }}
          />
        ) : (
          <Alert
            message="No hay ganadores registrados"
            description="Los ganadores aparecerán aquí cuando se validen cartones premiados"
            type="info"
            showIcon
          />
        )}
      </div>
    </div>
  );
};

// Componente principal BingoGame
const BingoGame = () => {
  const {
    gameActive,
    gameStatus,
    extractedNumbers,
    currentNumber,
    remainingNumbers,
    intervalTime,
    startNewGame,
    pauseGame,
    resumeGame,
    endGame,
    changeIntervalTime,
    voiceConfig,
    updateVoiceConfig,
    prizeConfig,
    configurePrizes
  } = useBingo();

  // Estado para controlar la visibilidad de configuración
  const [showSettings, setShowSettings] = useState(false);
  
  // Estado para la configuración del juego
  const [gameConfig, setGameConfig] = useState({
    seriesInfo: prizeConfig.seriesInfo || '',
    soldCards: prizeConfig.soldCards || 0,
    cardPrice: prizeConfig.cardPrice || 1.00,
    intervalTime: intervalTime || 5,
    voiceEnabled: voiceConfig.enabled || true,
    linePercentage: prizeConfig.linePercentage || 25,
    bingoPercentage: prizeConfig.bingoPercentage || 75
  });

  // Manejar cambios en la configuración principal
  const handleConfigChange = (field, value) => {
    setGameConfig(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Aplicar los cambios según el campo
    if (field === 'intervalTime') {
      changeIntervalTime(value);
    } else if (field === 'voiceEnabled') {
      updateVoiceConfig({ enabled: value });
    } else {
      // Para campos relacionados con premios
      configurePrizes({
        ...prizeConfig,
        [field]: value
      });
    }
  };

  // Renderizar los números extraídos en forma de cuadrícula
  const renderExtractedNumbers = () => {
    // Crear un array de 90 números
    const allNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
    
    return (
      <div className="extracted-numbers-grid">
        {allNumbers.map(number => {
          const isExtracted = extractedNumbers.includes(number);
          const isCurrent = number === currentNumber;
          
          return (
            <div 
              key={number} 
              className={`
                number-cell 
                ${isExtracted ? 'extracted' : ''} 
                ${isCurrent ? 'current' : ''}
              `}
            >
              {number}
            </div>
          );
        })}
      </div>
    );
  };

  // Iniciar un nuevo juego con la configuración actual
  const handleStartNewGame = () => {
    // Aplicar la configuración principal primero
    configurePrizes({
      ...prizeConfig,
      seriesInfo: gameConfig.seriesInfo,
      soldCards: gameConfig.soldCards,
      cardPrice: gameConfig.cardPrice
    });
    
    // Iniciar el juego
    startNewGame();
  };

  return (
    <Card className="bingo-game-container">
      {gameActive ? (
        <div className="active-game">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={14}>
              <Card className="game-info-card">
                <Row gutter={[8, 0]}>
                  <Col xs={24} sm={14} className="current-number-container">
                    <Statistic 
                      title="Número Actual"
                      value={currentNumber || '-'}
                      valueStyle={{ 
                        color: '#1890ff', 
                        fontSize: 60,
                        fontWeight: 'bold' 
                      }}
                    />
                  </Col>
                  <Col xs={24} sm={10}>
                    <div className="stats-container">
                      <Statistic 
                        title="Números extraídos"
                        value={extractedNumbers.length}
                        suffix={`/ 90`}
                        style={{ marginBottom: '16px' }}
                      />
                      <Statistic 
                        title="Números restantes"
                        value={remainingNumbers.length}
                      />
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
            
            <Col xs={24} md={10}>
              <Card className="winners-summary-card" style={{ height: '100%' }}>
                <WinnersSummary />
              </Card>
            </Col>
          </Row>
          
          <div className="game-controls">
            <Space size="middle">
              {gameStatus === 'running' ? (
                <Button 
                  type="primary" 
                  danger
                  icon={<PauseCircleOutlined />} 
                  onClick={pauseGame}
                  size="large"
                >
                  Pausar
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />} 
                  onClick={resumeGame}
                  size="large"
                  disabled={gameStatus === 'finished'}
                >
                  Reanudar
                </Button>
              )}
              
              <Button 
                icon={<StopOutlined />} 
                onClick={endGame}
                size="large"
              >
                Terminar
              </Button>
              
              <Button
                icon={<SettingOutlined />}
                onClick={() => setShowSettings(!showSettings)}
                size="large"
              >
                Configuración
              </Button>
            </Space>
          </div>
          
          {showSettings && (
            <Card className="settings-card">
              <Tabs defaultActiveKey="config">
                <TabPane tab="Configuración Básica" key="config">
                  <Form layout="vertical" className="settings-form">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Velocidad entre números"
                          className="settings-form-item"
                        >
                          <Space align="center" style={{ width: '100%' }}>
                            <Slider 
                              min={1}
                              max={20}
                              step={1}
                              value={intervalTime}
                              onChange={(value) => changeIntervalTime(value)}
                              disabled={gameStatus === 'running'}
                              style={{ width: '80%' }}
                            />
                            <Text type="secondary">{intervalTime}s</Text>
                          </Space>
                        </Form.Item>
                        
                        <Form.Item
                          label="Sonido"
                          className="settings-form-item"
                        >
                          <Switch 
                            checked={voiceConfig.enabled} 
                            onChange={(value) => updateVoiceConfig({ enabled: value })}
                            disabled={gameStatus === 'running'}
                          />
                        </Form.Item>
                      </Col>
                      
                      <Col xs={24} md={12}>
                        <Form.Item label="Serie de cartones">
                          <Input 
                            placeholder="Ej: A-1000000"
                            value={prizeConfig.seriesInfo}
                            onChange={(e) => configurePrizes({ ...prizeConfig, seriesInfo: e.target.value })}
                            disabled={gameStatus === 'running'}
                          />
                        </Form.Item>
                        
                        <Form.Item 
                          label="Cartones vendidos"
                          tooltip="Información sobre número de cartones en juego y recaudación"
                        >
                          <div style={{ padding: '5px 0' }}>
                            <Text strong>{prizeConfig.soldCards}</Text> cartones × <Text strong>{prizeConfig.cardPrice.toFixed(2)}€</Text> = <Text strong type="success">{(prizeConfig.soldCards * prizeConfig.cardPrice).toFixed(2)}€</Text>
                          </div>
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Collapse ghost>
                      <Panel header="Configuración Avanzada" key="advanced">
                        <Row gutter={[16, 16]}>
                          <Col xs={24} md={12}>
                            <Form.Item label="Precio por cartón (€)">
                              <InputNumber 
                                min={0}
                                step={0.5}
                                precision={2}
                                style={{ width: '100%' }}
                                value={prizeConfig.cardPrice}
                                onChange={(value) => configurePrizes({ ...prizeConfig, cardPrice: value })}
                                disabled={gameStatus === 'running'}
                              />
                              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                {[0.20, 0.50, 1.00, 2.00, 3.00].map(price => (
                                  <Button 
                                    key={price}
                                    size="small"
                                    type={prizeConfig.cardPrice === price ? 'primary' : 'default'}
                                    onClick={() => configurePrizes({ ...prizeConfig, cardPrice: price })}
                                    disabled={gameStatus === 'running'}
                                  >
                                    {price.toFixed(2)}€
                                  </Button>
                                ))}
                              </div>
                            </Form.Item>
                            
                            <Form.Item 
                              label={
                                <Space>
                                  <span>Porcentaje total a repartir (%)</span>
                                  <Text type="secondary">{prizeConfig.totalPrizePercentage}%</Text>
                                </Space>
                              }
                            >
                              <Slider 
                                min={35}
                                max={100}
                                step={5}
                                value={prizeConfig.totalPrizePercentage}
                                onChange={(value) => {
                                  // Aquí falta la lógica de ajuste de porcentajes que ya está implementada
                                  // en el componente PrizeSettings. La conservamos en el tab "Premios".
                                  configurePrizes({ ...prizeConfig, totalPrizePercentage: value })
                                }}
                                disabled={gameStatus === 'running'}
                              />
                            </Form.Item>
                          </Col>
                          
                          <Col xs={24} md={12}>
                            <Form.Item
                              label="Anunciar dígitos individuales"
                            >
                              <Switch 
                                checked={voiceConfig.announceDigits} 
                                onChange={(value) => updateVoiceConfig({ announceDigits: value })}
                                disabled={gameStatus === 'running' || !voiceConfig.enabled}
                              />
                            </Form.Item>
                            
                            <Form.Item
                              label={<>Velocidad de la voz: <Text type="secondary">{voiceConfig.rate}x</Text></>}
                            >
                              <Slider 
                                min={0.5}
                                max={1.5}
                                step={0.1}
                                value={voiceConfig.rate}
                                onChange={(value) => updateVoiceConfig({ rate: value })}
                                disabled={gameStatus === 'running' || !voiceConfig.enabled}
                              />
                            </Form.Item>
                            
                            <Form.Item
                              label={<>Volumen: <Text type="secondary">{voiceConfig.volume * 100}%</Text></>}
                            >
                              <Slider 
                                min={0.1}
                                max={1}
                                step={0.1}
                                value={voiceConfig.volume}
                                onChange={(value) => updateVoiceConfig({ volume: value })}
                                disabled={gameStatus === 'running' || !voiceConfig.enabled}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Panel>
                    </Collapse>
                  </Form>
                </TabPane>
                
                <TabPane tab="Premios" key="prizes">
                  <PrizeSettings 
                    prizeConfig={prizeConfig}
                    updatePrizeConfig={configurePrizes}
                    disabled={gameStatus === 'running'}
                  />
                </TabPane>
              </Tabs>
            </Card>
          )}
          
          {gameStatus === 'paused' && (
            <div className="checker-container">
              <Divider orientation="left">Comprobar cartones</Divider>
              <BingoCardChecker />
            </div>
          )}
          
          <Divider orientation="left">Tablero de números</Divider>
          {renderExtractedNumbers()}
        </div>
      ) : (
        <div className="game-setup">
          <Title level={4}>Configuración del Juego</Title>
          
          <Card className="setup-card">
            <Form layout="vertical" className="setup-form">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Title level={5}>Configuración Principal</Title>
                  
                  <Form.Item label="Serie de cartones">
                    <Input 
                      placeholder="Ej: A-1000000"
                      value={gameConfig.seriesInfo}
                      onChange={(e) => handleConfigChange('seriesInfo', e.target.value)}
                    />
                  </Form.Item>
                  
                  <Form.Item label="Cartones vendidos">
                    <InputNumber 
                      min={0}
                      step={12}
                      style={{ width: '100%' }}
                      value={gameConfig.soldCards}
                      onChange={(value) => handleConfigChange('soldCards', value)}
                    />
                  </Form.Item>
                  
                  <Form.Item label="Velocidad entre números (segundos)">
                    <Row>
                      <Col span={16}>
                        <Slider
                          min={1}
                          max={20}
                          value={gameConfig.intervalTime}
                          onChange={(value) => handleConfigChange('intervalTime', value)}
                        />
                      </Col>
                      <Col span={8}>
                        <Text style={{ marginLeft: 12 }}>{gameConfig.intervalTime} segundos</Text>
                      </Col>
                    </Row>
                  </Form.Item>
                  
                  <Form.Item label="Sonido">
                    <Switch 
                      checked={gameConfig.voiceEnabled} 
                      onChange={(value) => handleConfigChange('voiceEnabled', value)}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} md={12}>
                  <Collapse ghost>
                    <Panel header="Configuración Avanzada" key="advanced">
                      <Tabs defaultActiveKey="prizes">
                        <TabPane tab="Premios" key="prizes">
                          <PrizeSettings 
                            prizeConfig={prizeConfig}
                            updatePrizeConfig={configurePrizes}
                            disabled={false}
                          />
                        </TabPane>
                        
                        <TabPane tab="Voz" key="voice">
                          <BingoSettings 
                            voiceConfig={voiceConfig}
                            updateVoiceConfig={updateVoiceConfig}
                            disabled={!gameConfig.voiceEnabled}
                            intervalTime={intervalTime}
                            changeIntervalTime={changeIntervalTime}
                            isRunning={false}
                          />
                        </TabPane>
                      </Tabs>
                    </Panel>
                  </Collapse>
                </Col>
              </Row>
            </Form>
          </Card>
          
          <div className="start-game-container">
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />} 
              onClick={handleStartNewGame}
              size="large"
            >
              Iniciar Partida
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default BingoGame; 