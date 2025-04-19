import React from 'react';
import { Card, Row, Col, Typography, Divider } from 'antd';
import './PrintableBingoCard.css';

const { Text, Title } = Typography;

const PrintableBingoCard = ({ 
  cardData, 
  cardId, 
  seriesInfo, 
  price = "5.00",
  securityCode
}) => {
  // Generar código de barras (simplificado para demostración)
  const barcode = `S${seriesInfo.replace('-', '')}C${String(cardId).padStart(4, '0')}`;
  
  return (
    <Card className="print-card" bordered={false}>
      <div className="print-card-header">
        <div className="print-card-info">
          <Text strong>Cartón núm. {String(cardId).padStart(4, '0')}</Text>
          <Text>Serie: {seriesInfo}</Text>
        </div>
        <div className="print-card-price">
          <Text strong>{price} euros</Text>
        </div>
      </div>

      <Divider className="print-divider" />
      
      <div className="print-card-grid">
        {/* Renderiza la matriz 3x9 del cartón */}
        {[0, 1, 2].map(row => (
          <Row key={`row-${row}`} className="print-card-row">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(col => {
              const number = cardData[row][col];
              
              return (
                <Col key={`cell-${row}-${col}`} className="print-card-cell">
                  {number !== null ? number : ''}
                </Col>
              );
            })}
          </Row>
        ))}
      </div>
      
      <Divider className="print-divider" />
      
      <div className="print-card-footer">
        <div className="print-security-code">
          <Text type="secondary">Código: {securityCode}</Text>
        </div>
        <div className="print-barcode">
          <div className="barcode-container">{barcode}</div>
        </div>
      </div>
    </Card>
  );
};

export default PrintableBingoCard; 