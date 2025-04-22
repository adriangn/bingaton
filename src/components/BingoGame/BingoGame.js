import React, { useState } from 'react';
import { Card, Button, Typography, Divider, Space, InputNumber, Statistic, Row, Col, Switch, Slider, Form, Tabs, Input } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, StopOutlined, SettingOutlined } from '@ant-design/icons';
import { useBingo } from '../../context/BingoContext';
import BingoCardChecker from '../BingoCardChecker';
import './BingoGame.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

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
    seriesInfo: prizeConfig.seriesInfo || '',
    soldCards: prizeConfig.soldCards || 0,
    cardPrice: prizeConfig.cardPrice || 5.00,
    linePercentage: prizeConfig.linePercentage || 15,
    bingoPercentage: prizeConfig.bingoPercentage || 50,
    totalPrizePercentage: prizeConfig.totalPrizePercentage || 100
  });
  
  // Calcular el bote total
  const totalPot = formData.soldCards * formData.cardPrice;
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
    updatePrizeConfig(newData);
  };
  
  return (
    <Form layout="vertical" className="prize-settings-form">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item label="Serie de los cartones">
            <Input 
              placeholder="Ej: A-1000000"
              value={formData.seriesInfo}
              onChange={(e) => handleInputChange('seriesInfo', e.target.value)}
              disabled={disabled}
            />
          </Form.Item>
          
          <Form.Item label="Cartones vendidos">
            <InputNumber 
              min={0}
              step={12}
              style={{ width: '100%' }}
              value={formData.soldCards}
              onChange={(value) => handleInputChange('soldCards', value)}
              disabled={disabled}
            />
          </Form.Item>
          
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
              min={35}  // Mínimo de 35% para poder cumplir con los mínimos de línea (5%) y bingo (30%)
              max={100}
              step={5}
              value={formData.totalPrizePercentage}
              onChange={(value) => handleInputChange('totalPrizePercentage', value)}
              disabled={disabled}
              marks={{ 
                35: '35%', 
                50: '50%', 
                75: '75%',
                100: '100%' 
              }}
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
    startNewGame();
  };

  return (
    <Card className="bingo-game-container">
      {gameActive ? (
        <div className="active-game">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card className="current-number-display">
                <Statistic 
                  title="Número Actual"
                  value={currentNumber || '-'}
                  valueStyle={{ 
                    color: '#1890ff', 
                    fontSize: 72,
                    fontWeight: 'bold' 
                  }}
                />
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card>
                <Statistic 
                  title="Total de números extraídos"
                  value={extractedNumbers.length}
                  suffix={`/ 90`}
                />
                <Divider />
                <Statistic 
                  title="Números restantes"
                  value={remainingNumbers.length}
                />
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
              <Tabs defaultActiveKey="voice">
                <TabPane tab="Voz" key="voice">
                  <BingoSettings 
                    voiceConfig={voiceConfig}
                    updateVoiceConfig={updateVoiceConfig}
                    disabled={gameStatus === 'running'}
                    intervalTime={intervalTime}
                    changeIntervalTime={changeIntervalTime}
                    isRunning={gameStatus === 'running'}
                  />
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
          
          <Tabs defaultActiveKey="basic">
            <TabPane tab="Básica" key="basic">
              <Form layout="vertical" className="setup-form">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Intervalo entre números (segundos)">
                      <Slider
                        min={1}
                        max={20}
                        onChange={changeIntervalTime}
                        value={intervalTime}
                      />
                      <Text type="secondary">{intervalTime} segundos</Text>
                    </Form.Item>
                  </Col>
                  
                  <Col xs={24} md={12}>
                    <BingoSettings 
                      voiceConfig={voiceConfig}
                      updateVoiceConfig={updateVoiceConfig}
                      disabled={false}
                      intervalTime={intervalTime}
                      changeIntervalTime={changeIntervalTime}
                      isRunning={false}
                    />
                  </Col>
                </Row>
              </Form>
            </TabPane>
            
            <TabPane tab="Premios" key="prizes">
              <PrizeSettings 
                prizeConfig={prizeConfig}
                updatePrizeConfig={configurePrizes}
                disabled={false}
              />
            </TabPane>
          </Tabs>
          
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