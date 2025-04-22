import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Space, Alert, Typography, Divider, Row, Col, Badge, Spin, Statistic } from 'antd';
import { CheckOutlined, SearchOutlined, ReloadOutlined, TrophyOutlined } from '@ant-design/icons';
import { useBingo } from '../../context/BingoContext';
import './BingoCardChecker.css';

const { Title, Text } = Typography;

// Componente para mostrar un cartón de bingo
const CardDisplay = ({ card }) => {
  const { extractedNumbers } = useBingo();
  
  return (
    <div className="bingo-card-display">
      <table className="bingo-table">
        <tbody>
          {card.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((number, colIndex) => {
                const isExtracted = number !== null && extractedNumbers.includes(number);
                return (
                  <td 
                    key={colIndex} 
                    className={`
                      ${number ? 'number-cell' : 'empty-cell'}
                      ${isExtracted ? 'extracted-number' : ''}
                    `}
                  >
                    {number}
                  </td>
                );
              })}
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
    seed: prizeConfig.seriesInfo || '',
    cardNumber: ''
  });
  
  // Estado para almacenar múltiples resultados
  const [multipleResults, setMultipleResults] = useState([]);
  
  // Actualizar la serie si cambia en la configuración
  useEffect(() => {
    if (prizeConfig.seriesInfo && prizeConfig.seriesInfo !== formData.seed) {
      setFormData(prev => ({
        ...prev,
        seed: prizeConfig.seriesInfo
      }));
    }
  }, [prizeConfig.seriesInfo]);
  
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
    
    if (!formData.cardNumber || formData.cardNumber.trim() === '') {
      return 'Debes introducir al menos un número de cartón válido';
    }
    
    // Comprobar que todos los números sean válidos
    const cardNumbers = formData.cardNumber.split(/[\s,]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    
    if (cardNumbers.length === 0) {
      return 'No se ha encontrado ningún número de cartón válido';
    }
    
    if (cardNumbers.some(n => n < 1)) {
      return 'Todos los números de cartón deben ser mayores que 0';
    }
    
    return null;
  };
  
  // Procesar múltiples cartones
  const processMultipleCards = (validationType) => {
    const errorMessage = validateForm();
    if (errorMessage) {
      setValidationResult({
        hasLine: false,
        hasBingo: false,
        message: `Error: ${errorMessage}`
      });
      return;
    }
    
    // Extraer los números de cartón válidos
    const cardNumbers = formData.cardNumber.split(/[\s,]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    
    // Limpiar resultados anteriores
    setMultipleResults([]);
    setValidationResult(null);
    
    // Iniciar validación
    setIsValidating(true);
    
    // Procesar cada cartón secuencialmente con un pequeño retraso entre cada uno
    const processCards = async () => {
      const results = [];
      for (let i = 0; i < cardNumbers.length; i++) {
        const cardNumber = cardNumbers[i];
        // Esperar a que se complete la validación del cartón actual
        const result = await new Promise(resolve => {
          validateCard(formData.seed, cardNumber, validationType, (res) => {
            resolve(res);
          });
        });
        results.push({ ...result, cardNumber });
      }
      return results;
    };
    
    // Esperar a que se completen todas las validaciones
    setTimeout(async () => {
      try {
        const results = await processCards();
        setMultipleResults(results);
      } finally {
        setIsValidating(false);
      }
    }, 100);
  };
  
  // Manejar validación de línea
  const handleCheckLine = () => {
    processMultipleCards('line');
  };
  
  // Manejar validación de bingo
  const handleCheckBingo = () => {
    processMultipleCards('bingo');
  };
  
  // Resetear el formulario y resultados
  const handleReset = () => {
    setFormData({
      seed: prizeConfig.seriesInfo || '',
      cardNumber: ''
    });
    setValidationResult(null);
    setMultipleResults([]);
  };
  
  // Render del resultado con premios
  const renderResult = () => {
    if (validationResult) {
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
    }
    
    // Renderizar múltiples resultados
    if (multipleResults.length > 0) {
      return (
        <div className="multiple-results">
          <Divider>Resultados de la comprobación</Divider>
          
          {multipleResults.map((result, index) => (
            <div key={`result-${index}`} className="result-item">
              <div className="card-container">
                <Divider orientation="left">
                  <Space>
                    <Text>Cartón #{result.cardNumber}</Text>
                    <Badge 
                      count={result.hasBingo ? 'BINGO' : 
                            result.hasLine ? 'LÍNEA' : 'NO PREMIADO'} 
                      style={{ 
                        backgroundColor: result.hasBingo ? '#52c41a' : 
                                        result.hasLine ? '#1890ff' : '#f5222d'
                      }}
                    />
                    {(result.hasLine || result.hasBingo) && result.prize > 0 && (
                      <Text strong style={{ color: '#faad14' }}>
                        {result.prize.toFixed(2)}€
                      </Text>
                    )}
                  </Space>
                </Divider>
                
                <CardDisplay card={result.card} />
                
                {result.hasLine && !result.hasBingo && result.lineNumber && (
                  <div className="line-indicator">
                    Línea en la fila {result.lineNumber}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <Card className="bingo-card-checker">
      <Title level={4}>Comprobar Cartones</Title>
      
      <Form layout="vertical">
        <Row gutter={16}>
          <Col xs={24} md={prizeConfig.seriesInfo ? 24 : 12}>
            {!prizeConfig.seriesInfo ? (
              <Form.Item label="Serie de los cartones">
                <Input
                  placeholder="Ej: A-1000000"
                  name="seed"
                  value={formData.seed}
                  onChange={handleInputChange}
                  disabled={isValidating}
                />
              </Form.Item>
            ) : (
              <Form.Item label="Serie de los cartones">
                <Input
                  value={formData.seed}
                  disabled={true}
                  addonBefore="Serie configurada:"
                />
              </Form.Item>
            )}
          </Col>
          <Col xs={24} md={prizeConfig.seriesInfo ? 24 : 12}>
            <Form.Item 
              label="Números de cartones" 
              tooltip="Introduce varios números separados por comas o espacios (ej: 1, 2, 3 o 1 2 3)"
            >
              <Input
                placeholder="Ej: 1, 2, 3, 4, 5"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
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
              Comprobar Líneas
            </Button>
            
            <Button 
              type="primary" 
              danger
              onClick={handleCheckBingo}
              icon={<CheckOutlined />}
              disabled={isValidating || extractedNumbers.length === 0}
            >
              Comprobar Bingos
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
          <Spin tip="Validando cartones..." />
        </div>
      )}
      
      {renderResult()}
    </Card>
  );
};

export default BingoCardChecker; 