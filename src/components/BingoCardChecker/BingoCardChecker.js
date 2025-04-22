import React, { useState } from 'react';
import { Card, Form, Input, Button, Space, Alert, Typography, Divider, Row, Col, Badge, Spin, Statistic } from 'antd';
import { CheckOutlined, CloseOutlined, SearchOutlined, ReloadOutlined, TrophyOutlined } from '@ant-design/icons';
import { useBingo } from '../../context/BingoContext';
import './BingoCardChecker.css';

const { Title, Text } = Typography;

// Componente para mostrar un cartón de bingo
const CardDisplay = ({ card }) => {
  return (
    <div className="bingo-card-display">
      <table className="bingo-table">
        <tbody>
          {card.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((number, colIndex) => (
                <td key={colIndex} className={number ? 'number-cell' : 'empty-cell'}>
                  {number}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Componente para validar cartones
const BingoCardChecker = () => {
  const { 
    validateCard,
    validationResult, 
    isValidating,
    setValidationResult,
    extractedNumbers,
    prizeConfig
  } = useBingo();
  
  const [formData, setFormData] = useState({
    seed: '',
    cardNumber: ''
  });
  
  // Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Validar el formulario antes de procesar
  const validateForm = () => {
    if (!formData.seed || !formData.seed.trim()) {
      return 'Debes introducir la serie del cartón';
    }
    
    if (!formData.cardNumber || isNaN(parseInt(formData.cardNumber))) {
      return 'Debes introducir un número de cartón válido';
    }
    
    if (parseInt(formData.cardNumber) < 1) {
      return 'El número de cartón debe ser mayor que 0';
    }
    
    return null;
  };
  
  // Manejar validación de línea
  const handleCheckLine = () => {
    const errorMessage = validateForm();
    if (errorMessage) {
      setValidationResult({
        hasLine: false,
        hasBingo: false,
        message: `Error: ${errorMessage}`
      });
      return;
    }
    
    validateCard(
      formData.seed, 
      parseInt(formData.cardNumber),
      'line'
    );
  };
  
  // Manejar validación de bingo
  const handleCheckBingo = () => {
    const errorMessage = validateForm();
    if (errorMessage) {
      setValidationResult({
        hasLine: false,
        hasBingo: false,
        message: `Error: ${errorMessage}`
      });
      return;
    }
    
    validateCard(
      formData.seed, 
      parseInt(formData.cardNumber),
      'bingo'
    );
  };
  
  // Resetear el formulario y resultados
  const handleReset = () => {
    setFormData({
      seed: '',
      cardNumber: ''
    });
    setValidationResult(null);
  };
  
  // Render del resultado con premios
  const renderResult = () => {
    if (!validationResult) return null;
    
    return (
      <div className="validation-result">
        <Divider />
        
        <Alert
          message={validationResult.message}
          type={validationResult.hasBingo ? 'success' : 
               validationResult.hasLine ? 'success' : 
               validationResult.message.includes('Error') ? 'error' : 'info'}
          showIcon
        />
        
        {(validationResult.hasLine || validationResult.hasBingo) && validationResult.prize > 0 && (
          <div className="prize-info">
            <Row gutter={[16, 16]} className="prize-row">
              <Col span={24}>
                <Statistic
                  title={
                    <Space>
                      <TrophyOutlined />
                      <span>Premio</span>
                    </Space>
                  }
                  value={validationResult.prize.toFixed(2)}
                  suffix="€"
                  valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
                />
              </Col>
            </Row>

            {/* Si hay múltiples ganadores, mostrar información */}
            {validationResult.hasLine && prizeConfig.hasMultipleLineWinners && (
              <Text type="secondary">
                Premio compartido entre {prizeConfig.lineWinners.length} ganadores
              </Text>
            )}
            {validationResult.hasBingo && prizeConfig.hasMultipleBingoWinners && (
              <Text type="secondary">
                Premio compartido entre {prizeConfig.bingoWinners.length} ganadores
              </Text>
            )}
          </div>
        )}
        
        {validationResult.card && (
          <div className="card-container">
            <Divider orientation="left">
              <Space>
                <Text>Cartón #{validationResult.cardNumber}</Text>
                <Badge 
                  count={validationResult.hasBingo ? 'BINGO' : 
                        validationResult.hasLine ? 'LÍNEA' : null} 
                  style={{ 
                    backgroundColor: validationResult.hasBingo ? '#52c41a' : '#1890ff' 
                  }}
                />
              </Space>
            </Divider>
            
            <CardDisplay card={validationResult.card} />
            
            {validationResult.hasLine && !validationResult.hasBingo && (
              <div className="line-indicator">
                Línea en la fila {validationResult.lineNumber}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="bingo-card-checker">
      <Title level={4}>Comprobar Cartón</Title>
      
      <Form layout="vertical">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Serie del cartón">
              <Input
                placeholder="Ej: A-1000000"
                name="seed"
                value={formData.seed}
                onChange={handleInputChange}
                disabled={isValidating}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Número del cartón">
              <Input
                type="number"
                placeholder="Ej: 1"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                min={1}
                disabled={isValidating}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <div className="validation-buttons">
          <Space>
            <Button 
              type="primary"
              onClick={handleCheckLine}
              icon={<SearchOutlined />}
              disabled={isValidating || extractedNumbers.length === 0}
            >
              Comprobar Línea
            </Button>
            
            <Button 
              type="primary" 
              danger
              onClick={handleCheckBingo}
              icon={<CheckOutlined />}
              disabled={isValidating || extractedNumbers.length === 0}
            >
              Comprobar Bingo
            </Button>
            
            <Button 
              onClick={handleReset}
              icon={<ReloadOutlined />}
            >
              Limpiar
            </Button>
          </Space>
        </div>
      </Form>
      
      {isValidating && (
        <div className="validation-loading">
          <Spin tip="Validando cartón..." />
        </div>
      )}
      
      {renderResult()}
    </Card>
  );
};

export default BingoCardChecker; 