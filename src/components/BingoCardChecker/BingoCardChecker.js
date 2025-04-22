import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Form, Input, Button, Space, Alert, Typography, Divider, Row, Col, Badge, Spin } from 'antd';
import { CheckOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
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
    setValidationResult,
    extractedNumbers,
    prizeConfig,
    linesClosed,
    registerMultipleWinners
  } = useBingo();
  
  // Estado local para controlar la validación
  const [isValidating, setIsValidating] = useState(false);
  
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
  }, [prizeConfig.seriesInfo, formData.seed]);
  
  // Calcular premio individual
  const calculateIndividualPrize = useCallback((type, winnersCount) => {
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
  }, [prizeConfig]);
  
  // Generar la lista de ganadores sin repetidos - no se usa actualmente
  // eslint-disable-next-line no-unused-vars
  const winners = useMemo(() => {
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
  }, [prizeConfig.lineWinners, prizeConfig.bingoWinners, calculateIndividualPrize]);
  
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
    
    // Asegurarse de que no hay números repetidos
    const uniqueNumbers = [...new Set(cardNumbers)];
    if (uniqueNumbers.length !== cardNumbers.length) {
      return 'Hay números de cartón repetidos. Cada cartón debe comprobarse una sola vez';
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
      // Mostrar error como resultado
      setMultipleResults([{
        hasLine: false,
        hasBingo: false,
        message: `Error: ${errorMessage}`,
        isError: true
      }]);
      return;
    }
    
    // Extraer los números de cartón válidos
    const cardNumbers = formData.cardNumber.split(/[\s,]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    
    // Eliminar duplicados
    const uniqueCardNumbers = [...new Set(cardNumbers)];
    
    // Limpiar resultados anteriores
    setMultipleResults([]);
    setValidationResult(null);
    
    // Iniciar validación
    setIsValidating(true);
    
    // Procesar cada cartón secuencialmente pero sin registrar ganadores
    const processCards = async () => {
      // Primero validamos todos los cartones sin registrarlos como ganadores
      const validationResults = [];
      
      for (let i = 0; i < uniqueCardNumbers.length; i++) {
        const cardNumber = uniqueCardNumbers[i];
        // Validar cartón sin registrarlo como ganador todavía (usando el flag noRegister=true)
        const result = await new Promise(resolve => {
          validateCard(formData.seed, cardNumber, validationType, (res) => {
            resolve({...res, cardNumber});
          }, true); // Pasamos true como noRegister
        });
        validationResults.push(result);
      }
      
      // Filtrar los cartones ganadores
      const winningCards = validationResults.filter(r => 
        (validationType === 'line' && r.hasLine) || 
        (validationType === 'bingo' && r.hasBingo)
      );
      
      // Si hay cartones ganadores, registrarlos todos juntos
      if (winningCards.length > 0) {
        const winningCardNumbers = winningCards.map(r => r.cardNumber);
        registerMultipleWinners(validationType, winningCardNumbers);
        
        // Actualizar los resultados con el premio ajustado (compartido)
        const totalPrize = calculateIndividualPrize(validationType, 1) * winningCards.length;
        const prizePerWinner = totalPrize / winningCards.length;
        
        // Actualizamos los mensajes para reflejar que son premios compartidos
        return validationResults.map(result => {
          if ((validationType === 'line' && result.hasLine) || 
              (validationType === 'bingo' && result.hasBingo)) {
            return {
              ...result,
              prize: prizePerWinner,
              originalPrize: totalPrize,
              sharedAmong: winningCards.length,
              message: `¡${validationType === 'line' ? 'Línea' : 'Bingo'} válido! Premio compartido: ${prizePerWinner.toFixed(2)}€ (${winningCards.length} ganadores)`
            };
          }
          return result;
        });
      }
      
      return validationResults;
    };
    
    // Esperar a que se completen todas las validaciones
    setTimeout(async () => {
      try {
        let results = await processCards();
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
    // Renderizar múltiples resultados
    if (multipleResults.length > 0) {
      // Si el primer resultado es un error, mostrarlo como alerta
      if (multipleResults[0].isError) {
        return (
          <div className="validation-result">
            <Divider />
            <Alert
              message={multipleResults[0].message}
              type="error"
              showIcon
            />
          </div>
        );
      }
      
      // Si las líneas están cerradas y hay un resultado que lo indica, mostrar alerta
      const hasLineClosedResult = multipleResults.some(result => result.isLinesClosed);
      
      return (
        <div className="multiple-results">
          <Divider>Resultados de la comprobación</Divider>
          
          {hasLineClosedResult && (
            <Alert
              message="Líneas cerradas"
              description="La fase de líneas está cerrada. No se pueden registrar más ganadores de línea."
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}
          
          {multipleResults.map((result, index) => (
            <div key={`result-${index}`} className="result-item">
              <div className={`card-container ${result.hasBingo ? 'card-container-bingo' : result.hasLine ? 'card-container-line' : ''}`}>
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
                
                {(result.hasLine || result.hasBingo) && result.prize > 0 && (
                  <div className="prize-info">
                    {/* Información sobre premios compartidos */}
                    {result.sharedAmong && result.sharedAmong > 1 && (
                      <Text type="secondary">
                        Premio total de {result.originalPrize?.toFixed(2)}€ compartido entre {result.sharedAmong} ganadores
                      </Text>
                    )}
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
              tooltip="Introduce varios números separados por comas o espacios (ej: 1, 2, 3 o 1 2 3). No se permiten números repetidos."
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
        
        {/* Botones de acción */}
        <div className="validation-buttons">
          <Space>
            <Button
              type="primary"
              onClick={handleCheckLine}
              icon={<SearchOutlined />}
              disabled={isValidating || extractedNumbers.length === 0 || linesClosed}
            >
              Comprobar Líneas {linesClosed && "(Cerrado)"}
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