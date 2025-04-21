import React, { useState } from 'react';
import { Card, Button, Typography, Divider, Space, InputNumber, Statistic, Row, Col, Switch, Slider, Form, Collapse, Tabs } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, StopOutlined, SettingOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { useBingo } from '../../context/BingoContext';
import BingoCardChecker from '../BingoCardChecker';
import './BingoGame.css';

const { Title, Text } = Typography;
const { Panel } = Collapse;
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
    <Collapse className="settings-panel">
      <Panel header="Configuración del juego" key="1" extra={<SettingOutlined />}>
        <Form layout="vertical">
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

          <Divider className="settings-divider" />
          
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
        </Form>
      </Panel>
    </Collapse>
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
    updateVoiceConfig
  } = useBingo();

  // Estado para controlar las pestañas
  const [activeTab, setActiveTab] = useState('board');

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

  return (
    <Card className="bingo-game-container">
      <Title level={3}>Juego de Bingo en Vivo</Title>
      
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
                Terminar Partida
              </Button>
            </Space>
          </div>

          {/* Panel de configuración en juego */}
          <BingoSettings 
            voiceConfig={voiceConfig}
            updateVoiceConfig={updateVoiceConfig}
            disabled={gameStatus === 'finished'}
            intervalTime={intervalTime}
            changeIntervalTime={changeIntervalTime}
            isRunning={gameStatus === 'running'}
          />
          
          <Divider />
          
          {/* Pestañas para tablero y comprobación de cartones */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            className="bingo-tabs"
          >
            <TabPane 
              tab={<span><PlayCircleOutlined />Tablero</span>} 
              key="board"
            >
              <Divider orientation="left">Números Extraídos</Divider>
              {renderExtractedNumbers()}
            </TabPane>
            
            <TabPane 
              tab={<span><CheckSquareOutlined />Comprobar Cartones</span>} 
              key="checker"
              disabled={extractedNumbers.length === 0}
            >
              <BingoCardChecker />
            </TabPane>
          </Tabs>
          
          {gameStatus === 'paused' && activeTab === 'board' && (
            <div className="validation-actions">
              <Divider />
              <Title level={4}>Para comprobar ganadores:</Title>
              <Space size="middle">
                <Button 
                  type="primary" 
                  icon={<CheckSquareOutlined />}
                  onClick={() => setActiveTab('checker')}
                >
                  Ir a Comprobar Cartones
                </Button>
              </Space>
            </div>
          )}
        </div>
      ) : (
        <div className="start-game">
          <Title level={4}>Iniciar una nueva partida de bingo</Title>
          <Text>
            Inicia una partida para comenzar a sacar números automáticamente. 
            Puedes pausar en cualquier momento para comprobar líneas y bingos.
          </Text>

          {/* Panel de configuración antes de iniciar el juego */}
          <BingoSettings 
            voiceConfig={voiceConfig}
            updateVoiceConfig={updateVoiceConfig}
            disabled={false}
            intervalTime={intervalTime}
            changeIntervalTime={changeIntervalTime}
            isRunning={false}
          />
          
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />} 
            onClick={startNewGame}
            size="large"
            style={{ marginTop: 20 }}
          >
            Iniciar Partida
          </Button>
        </div>
      )}
    </Card>
  );
};

export default BingoGame; 